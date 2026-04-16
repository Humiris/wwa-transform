import { parse } from "node-html-parser";
import * as https from "https";
import * as http from "http";
import * as url from "url";

export interface BrandData {
  name: string;
  tagline: string;
  domain: string;
  logoUrl: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  navItems: { label: string; page: string; url: string }[];
  solutions: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    category: string;
    icon: string;
    features: { title: string; description: string }[];
  }[];
  products: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: string;
    image: string;
    features: string[];
  }[];
  stats: { value: string; label: string }[];
  images: { url: string; alt: string; type: string }[];
  heroText: string;
}

function fetchPage(targetUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === "https:" ? https : http;

    const req = client.get(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, targetUrl).toString();
        fetchPage(redirectUrl).then(resolve).catch(reject);
        return;
      }

      let data = "";
      res.on("data", (chunk) => data += chunk);
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Timeout")); });
  });
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function extractColors(html: string): { primary: string; secondary: string; accent: string } {
  // Look for CSS custom properties
  const cssVarMatch = html.match(/--(?:primary|brand|main)[^:]*:\s*(#[0-9a-fA-F]{3,8})/);
  const primary = cssVarMatch?.[1] || "#1A1F71";

  // Look for secondary/accent
  const secondaryMatch = html.match(/--(?:secondary|accent)[^:]*:\s*(#[0-9a-fA-F]{3,8})/);
  const secondary = secondaryMatch?.[1] || "#F7B600";

  return { primary, secondary, accent: primary };
}

export async function crawlWebsite(targetUrl: string): Promise<BrandData> {
  const parsed = new URL(targetUrl);
  const domain = parsed.hostname.replace("www.", "").split(".")[0];

  console.log(`    Fetching ${targetUrl}...`);
  const html = await fetchPage(targetUrl);
  const root = parse(html);

  // Brand name
  const ogSiteName = root.querySelector('meta[property="og:site_name"]')?.getAttribute("content");
  const titleTag = root.querySelector("title")?.text?.split(/[|\-–—]/)[0]?.trim();
  const name = ogSiteName || titleTag || domain.charAt(0).toUpperCase() + domain.slice(1);

  // Tagline
  const metaDesc = root.querySelector('meta[name="description"]')?.getAttribute("content") || "";
  const ogDesc = root.querySelector('meta[property="og:description"]')?.getAttribute("content") || "";
  const tagline = metaDesc || ogDesc || `Welcome to ${name}`;

  // Logo
  const favicon = root.querySelector('link[rel*="icon"]')?.getAttribute("href") || "/favicon.ico";
  const ogImage = root.querySelector('meta[property="og:image"]')?.getAttribute("content") || "";
  const headerImg = root.querySelector("header img")?.getAttribute("src") || "";
  const logoUrl = headerImg || ogImage || favicon;

  // Colors
  const colors = extractColors(html);

  // Navigation
  const navLinks = root.querySelectorAll("nav a, header nav a");
  const navItems: BrandData["navItems"] = [];
  const seenLabels = new Set<string>();

  for (const link of navLinks) {
    const label = link.text?.trim();
    const href = link.getAttribute("href") || "#";
    if (label && label.length > 1 && label.length < 30 && !seenLabels.has(label.toLowerCase())) {
      seenLabels.add(label.toLowerCase());
      navItems.push({
        label,
        page: slugify(label),
        url: href.startsWith("http") ? href : new URL(href, targetUrl).toString(),
      });
      if (navItems.length >= 6) break;
    }
  }

  // Hero text
  const h1 = root.querySelector("h1")?.text?.trim() || "";
  const heroSubtitle = root.querySelector("h1 + p, .hero p, [class*='hero'] p")?.text?.trim() || "";
  const heroText = h1 || name;

  // Images
  const images: BrandData["images"] = [];
  const imgElements = root.querySelectorAll("img");
  for (const img of imgElements) {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    const alt = img.getAttribute("alt") || "";
    if (src && !src.includes("data:") && !src.includes("svg+xml") && src.length < 500) {
      const fullUrl = src.startsWith("http") ? src : new URL(src, targetUrl).toString();
      images.push({ url: fullUrl, alt, type: alt.toLowerCase().includes("hero") ? "hero" : "general" });
      if (images.length >= 20) break;
    }
  }

  // Solutions/Features — scan for feature grids or product sections
  const solutions: BrandData["solutions"] = [];
  const featureSections = root.querySelectorAll("[class*='feature'], [class*='product'], [class*='solution'], [class*='service']");
  const h2s = root.querySelectorAll("h2, h3");
  const icons = ["Zap", "Shield", "Globe", "CreditCard", "Smartphone", "Lock", "Send", "Building2", "Code", "Rocket", "Target", "BarChart", "Layers", "Users", "Server"];

  let iconIdx = 0;
  for (const heading of h2s) {
    const headingText = heading.text?.trim();
    if (headingText && headingText.length > 3 && headingText.length < 80 && solutions.length < 12) {
      const nextP = heading.nextElementSibling;
      const desc = nextP?.tagName === "P" ? nextP.text?.trim() || "" : "";
      if (desc.length > 10) {
        solutions.push({
          id: slugify(headingText),
          name: headingText,
          tagline: desc.substring(0, 100),
          description: desc,
          category: "General",
          icon: icons[iconIdx % icons.length],
          features: [],
        });
        iconIdx++;
      }
    }
  }

  // Stats — look for numbers
  const stats: BrandData["stats"] = [];
  const statPattern = /(\d[\d,.]*[+KMBkm]?)\s*[+]?\s*([A-Za-z][A-Za-z ]{2,20})/g;
  const textContent = root.text;
  let statMatch;
  while ((statMatch = statPattern.exec(textContent)) !== null && stats.length < 4) {
    const value = statMatch[1].trim();
    const label = statMatch[2].trim();
    if (value.length < 15 && !stats.some(s => s.label === label)) {
      stats.push({ value, label });
    }
  }

  return {
    name,
    tagline: tagline.substring(0, 200),
    domain,
    logoUrl,
    favicon,
    primaryColor: colors.primary,
    secondaryColor: colors.secondary,
    accentColor: colors.accent,
    navItems: navItems.length > 0 ? navItems : [
      { label: "Products", page: "products", url: "#" },
      { label: "Solutions", page: "solutions", url: "#" },
      { label: "About", page: "about", url: "#" },
    ],
    solutions,
    products: [],
    stats: stats.length > 0 ? stats : [
      { value: "100+", label: "Countries" },
      { value: "10M+", label: "Users" },
    ],
    images,
    heroText,
  };
}
