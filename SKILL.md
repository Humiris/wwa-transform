---
name: wwa-transform
description: >-
  This skill should be used when the user asks to "transform a website",
  "create an agentfront", "build a WWA app", "make an agent-first website",
  "turn a website into an agent experience", "wwa transform", or mentions
  "agentfront" in context of building one from a URL.
version: 2.0.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - WebFetch
  - WebSearch
argument-hint: <website-url>
---

# WWA Transform v2 — Intelligent Website-to-Agentfront

Transform any website into a custom AI-powered agentfront. The skill deeply analyzes the company — its market, products, value proposition, customers — then builds a tailored experience. NOT a template copy-paste.

## Core Principle

**Understand the company first, build second.** Every company is different:
- Stripe sells APIs to developers → show API products, code examples, pricing tiers
- Nike sells shoes to consumers → show product catalog, categories, shopping
- Visa sells payment cards → show card tiers, comparisons, benefits
- Salesforce sells enterprise SaaS → show solutions by industry, case studies, demos

The agentfront must reflect what the company ACTUALLY is, not what Visa is.

## Template Location
`./template/` relative to this SKILL.md — the skill directory (typically `~/.claude/skills/wwa-transform/` after install) contains the Next.js template. Content is generated custom per company. After `cp -R`, run the template's `npx next build` once to confirm nothing regressed in the template itself.

## Reference Implementation
**https://wwa.visa.codiris.app** — live demo of a finished agentfront (payment card company). Source for the template is at https://github.com/Humiris/wwa-transform/tree/main/template.

If any template file looks incomplete or broken, inspect the live demo via WebFetch for visual reference, then apply the `visaCards → productItems` / `VisaCard → ProductItem` / `annualFee → price` renames — don't try to fix the template stub in place.

---

## PHASE 1: Deep Company Intelligence

### Step 1.1: Crawl Multiple Pages

Use `WebFetch` on at minimum:
1. **Homepage** — hero, value prop, main CTAs, navigation
2. **Products/Features page** — what they actually sell
3. **Pricing page** (if exists) — how they charge, what tiers
4. **About page** — company story, mission, stats

For EACH page, ask WebFetch:
```
Extract everything: brand name, tagline, ALL image URLs (full absolute), 
colors (hex from buttons/headers/CSS), navigation items, products/features 
with descriptions, pricing tiers, stats/numbers, customer logos, 
testimonials, CTAs, form fields. Be exhaustive.
```

### Step 1.2: AI Company Analysis

After crawling, THINK deeply about the company. Answer these questions BEFORE writing any code:

**Market Understanding:**
- What industry is this company in? (Fintech, SaaS, E-commerce, Healthcare, etc.)
- Who are their customers? (Developers, Enterprises, Consumers, SMBs)
- What problem do they solve?
- Who are their competitors?

**Product Understanding:**
- What do they sell? (APIs, Physical products, Subscriptions, Services, Cards)
- How many products/tiers do they have?
- How do they charge? (Per-transaction, Subscription, One-time, Usage-based, Free)
- Do they have a free tier or trial?

**Content Structure:**
- What sections make sense for THIS company's homepage?
- What navigation items should exist?
- What categories should products be organized by?
- Should there be a "cards" section? (Only if they sell cards/plans/tiers)
- Should there be a pricing grid? A product catalog? Case studies?

**Value Proposition:**
- What's their main headline?
- What stats are impressive? (Users, revenue, uptime, countries)
- What social proof do they have? (Customer logos, testimonials)

**Typography (CRITICAL — match brand aesthetic):**

The template uses Geist by default. You MUST change fonts to match the brand:

| Brand Type | Fonts to Use | Implementation |
|------------|--------------|----------------|
| Luxury fashion (Dior, Hermès, Chanel) | Playfair Display + Inter | Serif headings, clean body |
| Tech/SaaS (Stripe, Notion, Linear) | Inter or Geist | Modern sans-serif |
| Premium/Editorial (Apple, Aesop) | SF Pro / Helvetica Neue / system fonts | Clean, minimal |
| Fintech (Visa, Chase) | Geist / Inter | Professional sans |
| E-commerce (Amazon, Walmart) | Inter / Roboto | Readable, utilitarian |

Update `src/app/layout.tsx`:
```tsx
import { Playfair_Display, Inter } from "next/font/google";

const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });

// In body: className={`${serif.variable} ${sans.variable} font-sans`}
```

Update `src/app/globals.css`:
```css
:root {
  --brand-primary: #000000;    /* match brand color */
  --brand-secondary: #C9A96E;
  --font-serif-brand: var(--font-serif), "Didot", "Bodoni MT", "Georgia", serif;
}

h1, h2, .font-serif {
  font-family: var(--font-serif-brand);
  letter-spacing: -0.01em;
}
```

**User Intent (CRITICAL — drives CTAs and modals):**
Analyze what users ACTUALLY do on this site. Map to correct CTA:

| Company Type | Primary Intent | CTA Text | Modal Type |
|--------------|---------------|----------|------------|
| E-commerce (Dior, Nike, Apple) | Shop / Buy products | "Shop Now" | Cart / Product detail |
| SaaS/API (Stripe, Notion) | Try / Book demo | "Start Free" or "Book a Demo" | Demo booking form |
| Enterprise (Salesforce) | Contact sales | "Contact Sales" | Sales form |
| Financial (Visa, banks) | Apply / Get card | "Apply Now" | Application form |
| Marketplace — Listings (Airbnb, Booking, Uber) | Search / Book | "Start Searching" | Search UI |
| Marketplace — C2C (Vinted, Depop, Etsy, eBay) | Sell AND Browse (dual intent) | "Sell Now" + "Start Browsing" | Seller signup modal (personal / pro) |
| Services (Consulting) | Contact / Meeting | "Book a Call" | Calendar booking |
| Content (Netflix, Spotify) | Subscribe / Try | "Start Free Trial" | Signup form |

**NEVER use "Book a Demo" for e-commerce.** E-commerce brands want you to SHOP, not schedule a meeting.

Update these files based on intent:
- `brand-config.ts` → `ctaPrimary` and `ctaSecondary`
- `hero-section.tsx` → button text
- `solution-detail-panel.tsx` → button text
- `book-demo-modal.tsx` → rename, change fields to match intent (e-commerce = Contact Client Services, Cart, or remove entirely)
- `actions.ts` system prompt → what the agent offers users

### Step 1.3: Define the Page Architecture

Based on your analysis, decide which sections the homepage should have. Choose from:

| Section | Use When | Example |
|---------|----------|---------|
| Hero Carousel | Always | Rotating through top products/features |
| Stats Bar | Company has impressive numbers | "$1.9T processed", "99.999% uptime" |
| Product Grid | 3+ distinct products | API products, SaaS modules |
| Pricing Tiers | Clear pricing tiers exist | Free/Pro/Enterprise |
| Feature Showcase | Key differentiators | With images and descriptions |
| Customer Logos | Has notable customers | "Trusted by Amazon, Shopify..." |
| Solution Categories | Products grouped by use case | "For Startups", "For Enterprise" |
| Code Example | Developer-focused company | Interactive code snippet |
| Card Catalog | Sells cards/plans consumers browse | Credit cards, subscription plans |
| CTA Banner | Always | "Book a Demo" / "Get Started" / "Start Free" |
| World Map | Company has global presence story | Payment networks, logistics, international SaaS |

**DO NOT include sections that don't apply:**
- API company → NO credit card tiers, NO card comparison
- E-commerce → NO API docs, NO code examples
- SaaS without global story → NO world map (make `handleShowMap` a no-op in page.tsx)
- Company without browsable products → leave `productItems` array empty, the browse section won't render

---

## PHASE 2: Download Assets

### Step 2.1: Download ALL Images

**MANDATORY.** The agentfront is useless without real images.

> ❗ **The single biggest bug in past transforms** is shipping images from the wrong brand — a generic "sneaker" photo from Unsplash that happens to show a Nike Swoosh on an adidas site, or a "handbag" photo that's clearly Chanel on a Dior site. Mis-branded imagery destroys credibility instantly.
>
> **Rule**: Every image that represents a **specific named product or franchise** (e.g. "Samba OG", "Air Max 90", "Lady Dior") MUST come from a source that lets you verify it shows the correct brand. Generic-category Unsplash photos are banned for these slots. They are OK only for brand-agnostic shots (lifestyle hero, category tiles with no named product, abstract backgrounds).
>
> **And every image MUST pass visual verification (Step 2.3) before you write its path into `cards.ts` / `solutions.ts`.**

```bash
mkdir -p ~/wwa.{domain}/public/images/cards

# Use browser headers to bypass CDN blocks
curl -L -o "public/images/{name}.jpg" "{url}" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Referer: https://{domain}/" \
  -H "Accept: image/*"
```

**Download at minimum:**
- Logo (SVG preferred, PNG fallback)
- Hero/banner image
- 1 image per product/solution (6-10 total)
- 2-4 lifestyle/feature images
- Customer logos if available
- Product screenshots/UI images

### Image Source Priority (USE IN THIS ORDER)

**For named products/franchises** (Samba, Air Jordan 1, Stan Smith, Lady Dior, Birkin, etc.), priority is:

1. Brand's own CDN (works for most sportswear — Nike, adidas, Puma, Asics, New Balance)
2. **Wikipedia / Wikimedia Commons** — the category page `commons.wikimedia.org/wiki/Category:{Brand}_{Product}` has real, licensed product photos for every iconic sneaker, boot, bag, watch, perfume, etc.
3. Industry publication CDN for the brand's segment (WWD for fashion, Fragrantica for perfume, SneakerNews/Hypebeast for sneakers)
4. **DROP THE PRODUCT from `productItems`** if none of 1–3 yields a verified photo. A site with 6 real products is infinitely better than a site with 8 and two wrong-brand frauds.

**Unsplash is BANNED for named-product slots.** It's OK only for: hero lifestyle shots (action/atmosphere, no named product), brand-agnostic category tiles, abstract backgrounds. If you use it, still run Step 2.3 verification — generic sneaker/bag photos on Unsplash very frequently show competitor logos.

Most premium brand sites (Dior, Apple, Notion, Vercel, Hermès) AGGRESSIVELY BLOCK curl. Do NOT waste time trying to download from the brand's CDN. Skip directly to the fallback.

**Sportswear CDNs are hit-or-miss** — Puma, Nike, Adidas, Asics, Under Armour, New Balance, Reebok sometimes serve real JPEGs on their public CDNs, but **you have to know the exact style code** and the match rate is worse than you'd expect. Observed on recent transforms:

- **adidas** (`assets.adidas.com`) — returned 0 bytes on every style code tried (Apr 2026)
- **Nike** (`static.nike.com`) — works for some products, requires inspecting a product page's `<img srcset>` to get the right hash
- **New Balance** (`nb.scene7.com`) — works with a Referer header, but style codes are hard to guess; ~50% hit rate even for the most popular models
- **Puma** (`images.puma.com`) — most reliable of the sportswear CDNs

**Rule of thumb**: try the brand CDN once with a single well-known SKU. If it returns real bytes (>20KB), map your remaining products; if it 0-bytes or errors, drop straight to Wikimedia Commons. Don't spend 10 minutes guessing style codes.

| Brand | CDN pattern | How to get the `{styleId}` |
|-------|-------------|----------------------------|
| Puma | `https://images.puma.com/image/upload/f_auto,q_auto,w_800,h_800/global/{styleId}/01/sv01/fnd/PNA/fmt/png/{slug}` | The number after `/pd/slug/` on a product page |
| Nike | `https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/{hash}/{slug}.jpg` | Inspect a product page's `<img srcset>` |
| Adidas | `https://assets.adidas.com/images/w_600,f_auto,q_auto/{styleId}/{slug}.jpg` | Often blocked — try once, fall back to Wikimedia |
| New Balance | `https://nb.scene7.com/is/image/NB/{styleId}_nb_02_i?wid=1200&hei=1200` | Match the style id on the product page (e.g. `m1906rcd`) |

Always include `-H "Referer: https://{brand-domain}/"` — the Cloudinary-style CDNs behind most sportswear brands accept the request with referrer, 404 it without.

**Remember**: even when the CDN works, you still MUST run Step 2.3 visual verification on the downloaded bytes — CDNs occasionally return placeholder/blank images with a 200 status.

**1. Brand's own CDN** (always try first for sportswear/athletic; ~30% of premium luxury sites; skip straight to #3 for most editorial/luxury brands)
```bash
curl -sL -o public/images/{name}.jpg "{url}" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Referer: https://{domain}/"
```

**2. Wikipedia / Wikimedia Commons** — works for famous brands, logos, iconic products
```bash
curl -sL -o public/images/brand-logo.svg \
  "https://upload.wikimedia.org/wikipedia/commons/{path}/{file}.svg" \
  -H "User-Agent: Mozilla/5.0"
```
Use WebSearch: "{brand} logo SVG wikimedia commons"

**2.5. INDUSTRY PUBLICATIONS — USE THIS FOR FASHION BRANDS**
Fashion/luxury brands block their own CDN, but fashion PUBLICATIONS host real runway photos:

```bash
# WWD (Women's Wear Daily) — 2-3MB runway photos, works without auth
# Pattern: https://wwd.com/wp-content/uploads/{YYYY}/{MM}/{brand}-{collection}-{location}-GG-{01-80}.jpg

curl -sL -o public/images/runway.jpg \
  "https://wwd.com/wp-content/uploads/2025/05/dior-cruise-2026-rome-GG-01.jpg" \
  -H "User-Agent: Mozilla/5.0"

# Fragrantica CDN — real perfume bottle photos, works without auth
# Pattern: https://fimgs.net/mdimg/perfume/375x500.{perfume_id}.jpg
# Find IDs via WebSearch: "{perfume name} fragrantica"

curl -sL -o public/images/jadore.jpg \
  "https://fimgs.net/mdimg/perfume/375x500.210.jpg" \
  -H "User-Agent: Mozilla/5.0"
```

Other working fashion/beauty publication CDNs:
- **wwd.com/wp-content/uploads/** — runway, backstage, beauty product shots
- **fimgs.net/mdimg/perfume/** — perfume bottles (Fragrantica)
- **nowfashion.com/wp-content/uploads/** — runway photos
- **showstudio.com/** — editorial fashion content
- **vogue.com/photos/** — often requires auth
- **fashionography.com/wp-content/uploads/** — runway archives

**IMPORTANT:** Sample a couple of images first (~2-3MB each). On macOS use `sips -Z 1200 input.jpg -o output.jpg` to resize before committing.

### Brand Videos for Hero Backgrounds

Many luxury brands have hero video loops that dramatically elevate the feel. Look for them:

```bash
# Brand-hosted videos often work with proper headers
curl -sL -o public/videos/hero.webm "{brand-video-url}" \
  -H "User-Agent: Mozilla/5.0" \
  -H "Referer: https://{domain}/"
```

**Finding brand video URLs:**
- Dior: `diorama.dam-broadcast.com/...` — works publicly
- Apple: `apple.com/assets-www/...` — often public
- Most fashion houses have `dam-broadcast` or `.cdn.` video CDNs
- Inspect the brand's homepage for `<video>` or `<source>` tags with `.webm` / `.mp4`
- WebSearch: "{brand} hero video webm" or check Dam broadcast networks

**Implementation in hero-section.tsx:**
```tsx
<video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover" poster="/images/hero-image.jpg">
  <source src="/videos/hero.webm" type="video/webm" />
</video>
<div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
```

Video hero is essential for luxury brands. Fall back to static image if video can't be obtained. Keep videos under 10MB (resize with ffmpeg if needed).

**American heritage brands (Ralph Lauren, Levi's, L.L. Bean, J.Crew, Tommy Hilfiger) rarely expose public video CDNs.** Plan for a static full-bleed runway or editorial hero with a subtle 1.04 scale-on-mount or parallax effect instead — don't waste time hunting for a video that isn't there.

**3. Unsplash (MANDATORY FALLBACK — always works, real product photos)**
```bash
# Search URL pattern: https://images.unsplash.com/photo-{id}?w=800&q=80
# DO NOT make up IDs — use these tested working IDs by category:

# Luxury perfume / fragrance bottle
curl -sL -o public/images/perfume.jpg "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Men's cologne / dark bottle  
curl -sL -o public/images/cologne.jpg "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Pink/feminine perfume
curl -sL -o public/images/miss.jpg "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Luxury handbag
curl -sL -o public/images/bag.jpg "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Canvas tote
curl -sL -o public/images/tote.jpg "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Leather bag
curl -sL -o public/images/leather-bag.jpg "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Red lipstick
curl -sL -o public/images/lipstick.jpg "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Foundation / makeup
curl -sL -o public/images/foundation.jpg "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Skincare cream
curl -sL -o public/images/skincare.jpg "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Luxury skincare bottles
curl -sL -o public/images/serum.jpg "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Gold jewelry / rings
curl -sL -o public/images/jewelry.jpg "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Fashion / clothing
curl -sL -o public/images/fashion.jpg "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Building / atelier (hero/about)
curl -sL -o public/images/building.jpg "https://images.unsplash.com/photo-1519643225200-94e79e383724?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# SaaS / tech product screenshot
curl -sL -o public/images/saas-ui.jpg "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Abstract tech / code
curl -sL -o public/images/tech.jpg "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# ═══════ ATHLETIC / SPORTSWEAR (verified on Puma transform) ═══════

# Running / runner silhouette
curl -sL -o public/images/running.jpg "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Training / gym / lifting
curl -sL -o public/images/training.jpg "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Football / soccer
curl -sL -o public/images/football.jpg "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Motorsport / racing
curl -sL -o public/images/motorsport.jpg "https://images.unsplash.com/photo-1504276048855-f3d60e69632f?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Kids athletic
curl -sL -o public/images/kids.jpg "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=800&q=80" -H "User-Agent: Mozilla/5.0"

# Athletic fashion / streetwear runner
curl -sL -o public/images/athleisure.jpg "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80" -H "User-Agent: Mozilla/5.0"
```

> **Unsplash ID format caveat:** stick to the timestamp-hex pattern (`photo-1508685096489-7aacd43bd3b1`). Modern Unsplash URLs use slug-style IDs (`hEIHXXic3yI`) that **do NOT work** with `https://images.unsplash.com/photo-{slug}`. If an ID you find is 11 random characters instead of the classic timestamp-hex form, you need the old numeric pattern or the image will 404.

**Verify downloads:** Check file size with `ls -la`. Files under 1KB are failures. Failed downloads return ~29 bytes (Unsplash not-found) or ~300 bytes (error page). Re-download with different ID if under 1KB.

**4. Placehold.co** — LAST RESORT ONLY if Unsplash also fails
```bash
curl -sL -o public/images/{name}.jpg "https://placehold.co/800x400/{hex_no_hash}/white?text={Product}"
```

### Required Downloads

Every project MUST have (minimum):
- Logo (SVG from Wikipedia or brand CDN)
- Hero image (brand or category-matched Unsplash)
- 1 image per solution (category-matched Unsplash)
- 1 image per product (category-matched Unsplash)
- Favicon from `https://www.google.com/s2/favicons?domain={domain}&sz=64`

### Matching Unsplash Photos to Categories

| Company Type | Use These Photos |
|--------------|-----------------|
| Luxury/Fashion (Dior, Hermès, LV) | Perfume + handbag + lipstick + jewelry + fashion |
| Cosmetics (Sephora, Fenty) | Lipstick + foundation + makeup brushes |
| Tech/SaaS (Stripe, Notion) | SaaS UI screenshots + tech + abstract |
| E-commerce (Amazon, Shopify) | Product shots + packaging + shopping |
| Fintech (Visa, Chase) | Cards + phone + wallet |

### Step 2.2: Download Favicon

```bash
curl -L -o "public/favicon.ico" "https://www.google.com/s2/favicons?domain={domain}&sz=64"
```

### Step 2.3: Visual verification — MANDATORY before writing any image path into `cards.ts` / `solutions.ts`

You are a multimodal model. You can see images. **Use the `Read` tool on every downloaded file** and visually inspect what it actually depicts. Do this BEFORE referencing the image from any data file.

```
Read file_path=/absolute/path/to/public/images/samba.jpg
```

For each image, verify the following before approving it:

1. **Brand match.** If the image represents a named product, does it show the correct brand's logo, wordmark, or trademark graphic?
   - Nike → Swoosh visible and no other brand logos
   - adidas → 3-Stripes and/or Trefoil visible, no Swoosh, no "N", no Brooks, no Puma cat
   - Dior → "Dior" wordmark or CD monogram
   - Hermès → "H" clasp or Kelly/Birkin silhouette with Hermès marking
   - Apple → Apple logo, no Samsung/Google/other
2. **Product match.** If the image is tied to a specific franchise in `solutions.ts` (e.g. "Air Max"), does the shoe in the photo actually look like an Air Max (visible Air unit) vs. a random sneaker?
3. **No competitor logos.** If you can see **any** competitor's logo anywhere in the frame (even on a background wall, a bystander's shirt, the box the product is sitting on), reject the image.
4. **No off-brand props.** A Nike shoebox in the corner of an adidas product shot → reject.

**If verification fails**, in order:

1. Retry with a different source from the priority list (Wikimedia Commons almost always has a clean product shot).
2. If still no luck, **remove that product from `productItems` / that franchise from `solutions`** rather than ship the bad image.
3. NEVER "just swap the filename" and hope — the file on disk is what ships.

**Checklist to run at the end of Phase 2:**

```bash
# List every image file with its size
ls -la public/images/*.jpg public/images/*.png public/images/*.svg 2>/dev/null
```

Then, for EACH non-logo image, use `Read` on it and log either `VERIFIED: shows real <brand> <product>` or `REJECTED: shows <what-it-actually-is>`. If any rejected image is still referenced from `cards.ts` / `solutions.ts`, **you have failed this step** — fix it before proceeding to Phase 3.

**For sizing**: if an image is ≥ 3MB, resize on macOS with `sips -Z 1200 input.jpg -o output.jpg` or `sips -Z 1200 --setProperty formatOptions 80 input.jpg -o output.jpg` to keep page weight reasonable.

---

## PHASE 3: Build the Project

### Step 3.1: Copy Framework

```bash
# From inside the cloned skill (typically ~/.claude/skills/wwa-transform):
mkdir -p ~/wwa.{domain}
cp -R ./template/. ~/wwa.{domain}/
cd ~/wwa.{domain} && npm install
```

Do NOT copy from absolute maintainer paths like `/Users/joel/wwa-skill/template/` — that path only exists on the maintainer's machine. Always copy `./template/.` relative to the skill directory that contains this SKILL.md.

**Template naming:** The template uses `ProductItem`/`productItems` (not VisaCard/visaCards) as generic names for browsable items. The navbar component is `brand-navbar.tsx`, the map is `world-map.tsx`. All imports in page.tsx already use these names.

### Step 3.1b: Sweep Visa color tokens (MANDATORY, run once, before everything else)

The template ships with Visa's blue (`#1A1F71`), navy hover (`#141963`), and light blue (`#1434CB`) hardcoded in ~8 components — `solution-detail-panel.tsx`, `solution-slider.tsx`, `generated-view.tsx`, `agent-panel.tsx`, `account-panel.tsx`, `live-session-overlay.tsx`, and others. **Delegating component rewrites to parallel subagents always leaves some of these files unedited**, and the Step 3.6 audit catches it every time. Save yourself the re-roll — run this sweep FIRST, right after `cp -R ./template/.`:

```bash
cd ~/wwa.{domain}

# Replace Visa blue (primary), navy (hover), and light blue (accent) with brand colors.
# Pick hex codes that match your brand-config.ts primary/secondary/accent.
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i '' \
  -e 's/#1A1F71/{BRAND_PRIMARY}/g' \
  -e 's/#141963/{BRAND_PRIMARY_DARK}/g' \
  -e 's/#1434CB/{BRAND_ACCENT}/g'

# Verify zero remaining
grep -rn "#1A1F71\|#141963\|#1434CB" src/
```

Example for a black-primary brand: replace with `#000000`, `#000000`, `#CF0A2C`. For Dior (gold on black): `#0A0A0A`, `#000000`, `#C9A96E`.

After the sweep, subagents can focus on rewriting content (copy, data) without worrying about color hunts. Re-run the grep at the end of Phase 3 to confirm nothing crept back in.

### Step 3.2: Write Brand Config

Write `src/lib/brand-config.ts` with ALL company data from Phase 1. This drives the entire app.

### Step 3.3: Write Solutions Data

Write `src/lib/solutions.ts` — these are the company's ACTUAL products/services. Each must have:
- Real name, real description from their website
- Real features from their product pages
- Image pointing to downloaded file
- Appropriate category for THIS company (not Visa's categories)

### Step 3.4: Write Products/Cards Data (ONLY IF APPLICABLE)

Write `src/lib/cards.ts` — ONLY if the company sells browsable items (plans, cards, products with prices).

**For API companies (Stripe, Twilio):** Use pricing tiers as "cards" — Free, Growth, Enterprise
**For e-commerce (Nike, Apple):** Use actual products as cards
**For SaaS (Salesforce, HubSpot):** Use subscription plans as cards
**For companies with no browsable products:** Leave the array EMPTY and the browse section won't show

### Step 3.5: Rewrite EVERY Content Component

**CRITICAL: Do not sed-replace. REWRITE each file understanding the company.**

**`src/components/hero-section.tsx`** — Rewrite completely:
- Stats must be THIS company's real stats
- "Card Tiers" section: REMOVE if company doesn't have tiers. Replace with what makes sense (e.g., "Choose your plan", "Explore by use case", customer logos grid)
- "Why {Brand}" section: Write real value props from their website, not Visa's
- "Find your card" CTA: Change to whatever CTA makes sense ("Start Building", "Get Started", "Shop Now", "Request Demo")
- Hero images should use downloaded images

**`src/components/inner-page.tsx`** — Rewrite ALL pages:
- Navigation pages must match THIS company's nav (from brand-config)
- Each page content must be written from crawled data
- Remove any pages that don't apply (Stripe doesn't need "Travel" or "Personal")
- Add pages that DO apply (Stripe needs "Developers", "Pricing")

**`src/components/wwa-panel.tsx`** — Update:
- SUGGESTIONS array: Write 6-8 suggestions relevant to THIS company
- Card/solution detection keywords: Based on THIS company's product names
- Chat tab label: "{Brand} Agent"
- Category labels in browse section

**`src/components/assistant-shared.tsx`** — Rewrite ALL fallback responses:
- Every response must be about THIS company's products
- Use real product names, real features, real pricing
- Reference actual pages/docs from their website

**`src/app/actions.ts`** — Rewrite system prompt:
- Identity: "{Brand} Agent" specialist in their actual domain
- Product knowledge from crawled data
- Stats from their actual numbers

**`src/app/page.tsx`** — Update:
- Category grid: Use THIS company's actual categories (not Travel/Cash Back/Business)
- Section titles and descriptions
- Remove any sections that don't apply

**`src/components/book-demo-modal.tsx`** — Update:
- Product interests: THIS company's actual products
- Company types relevant to their market
- Form copy

For **luxury e-commerce / heritage brands**, rewrite the whole modal as "Request a Private Appointment" with three fields — the B2B fields (company size, revenue range, country dropdown, SKU picker) are inappropriate. Keep it short:
- Name + email
- Preferred boutique (dropdown of real flagships from brand-config / flagships.ts)
- Occasion + interests (free text — "wedding gift", "wardrobe refresh", "home", etc.)
Submit CTA: "Request Appointment" — not "Book a Demo".

**`src/components/live-session-overlay.tsx`** — CRITICAL:
- Replace the SVG logo paths (appears 2 times: header + animated center) with the brand's logo
- Update the viewBox to match the brand's SVG
- The voice call should show the BRAND logo, not any other brand

**`src/components/assistant-shared.tsx`** — CRITICAL:
- The `EmptyState` component shows welcome screen with brand logo
- The logo IS the call button — clicking it starts the voice call. NO separate "Start Voice Call" text button
- Pattern: `<button onClick={onOpen}><img src="/images/brand-logo.svg" /></button>`
- Must use brand's logo image file (not inline SVG — renders badly)

**`src/components/agent-panel.tsx`** — CRITICAL (often forgotten):
- Rename ALL skill names: "visa-search" → "{brand}-search", etc.
- Rename CLI commands: "visa-agent" → "{brand}-agent"
- Rename MCP package: "visa-agent-mcp" → "{brand}-agent-mcp"
- Update AgentNet command: "agentnet add {brand}-agent"
- Update skill descriptions to match brand's products
- Update CLI example commands to be relevant to brand
- MCP URL and Claude Code/Codex install commands read from `BRAND.mcpUrl` + `BRAND.mcpServerName` automatically — no string edits needed here as long as brand-config is correct.

**`src/app/mcp/route.ts`** — REAL MCP ENDPOINT (ships with template):
- The template serves a working MCP Streamable HTTP endpoint at `/mcp` on the same origin as the agentfront. JSON-RPC 2.0, stateless, CORS-enabled.
- Default tools read from `productItems` (cards.ts) and `solutions` (solutions.ts): `search_products`, `compare_products`, `get_product`, `get_solutions`, `recommend_product`.
- The `mcpTools` list shown in agent-panel.tsx is already synced with these 5 default tools.
- To add brand-specific tools (e.g. `find_boutique` for luxury, `compare_tiers` for financial, `estimate_fees` for SaaS): append to the `TOOLS` array and add a `case` in `callTool`. Mirror the addition in agent-panel's `mcpTools` list.
- **Brand-config keys to set:**
  - `mcpUrl`: `"https://wwa.{brand}.codiris.app/mcp"` (same origin as deployed agentfront)
  - `mcpServerName`: `"{brand}-agent"` (CLI identifier for `claude mcp add`)
- **Verify after deploy:** `curl -X POST https://wwa.{brand}.codiris.app/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'` — must return the tool list with 200.
- **Recommended brand-specific tools by type** (append to `TOOLS` in route.ts and to `mcpTools` in agent-panel.tsx):
  - Heritage brand (Ralph Lauren, Rolex, Hermès, Patek Philippe): `get_heritage(yearFrom?, yearTo?)` from `src/lib/heritage.ts`, `find_flagship(city?, country?)` from `src/lib/flagships.ts`
  - Multi-house luxury group (Dior, Chanel, Armani): `get_houses()`, `get_house(id)`
  - Restaurant / hospitality arm (Ralph Lauren Polo Bar, Bulgari hotels, Armani Caffè): `find_restaurant(city?)`
  - SaaS with usage pricing (Stripe, Twilio): `estimate_cost(usage)`, `check_availability(region)`
  - Fintech with tiered benefits (Visa, Mastercard, Amex): `compare_tiers(tiers[])`
  - Luxury fragrance house: `get_fragrance_notes(productId)`, `find_boutique(city?)`
  - Marketplace / C2C (Vinted, Depop, Etsy, eBay): `list_markets(region?)`, `list_categories()`, `get_seller_flow(personal|pro)`, `estimate_fees(price, category)` — sellers and buyers want different info from the same API, and marketplaces have operational data (markets live, fee structure) that doesn't fit search/compare/recommend alone.
  - Marketplace / Listings (Booking, Airbnb, VRBO, Expedia, Agoda): `search_stays(destination?, checkIn?, checkOut?, guests?, category?, priceMax?)` returning mocked stay results with price/currency/rating/reviewCount (no need to hit real inventory APIs), `list_destinations(region?, country?)` backed by `src/lib/destinations.ts`, and optionally `get_host_flow()` for the host-onboarding path.
  - Retail / Multi-brand (Sephora, Nordstrom, Net-A-Porter, Farfetch): `list_brands(category?, featuredOnly?)` backed by `src/lib/brands.ts`, `find_shade_match(undertone?, coverage?, finish?)` for beauty, `get_routine(skinType?, concern?, budget?)` for skincare, `get_fragrance_notes(productId)` backed by `src/lib/fragrances.ts`. Extend `search_products` with a `brand?` arg — customers ask "foundations from Rare Beauty under €50" and the default signature doesn't support that.

**`src/lib/brand-config.ts`** — Logo:
- Download logo via WebSearch: "{brand} logo SVG wikipedia" or "{brand} press kit"
- Set `logoSvg: ""` and `logoImage: "/images/brand-logo.svg"`
- ALWAYS prefer logo image file over inline SVG to avoid rendering issues

**`src/components/world-map.tsx`** — Update stats or remove if not relevant

**`src/components/card-3d.tsx`** — ONLY for credit card companies (Visa, Mastercard). 
- For ALL other companies: the template already uses product image cards instead of Card3D
- The `cards-browse-panel.tsx` and `wwa-panel.tsx` CardCarousel show product images with name/price overlay
- Do NOT use Card3D for fashion, SaaS, e-commerce, or any non-card company — it renders a credit card with chip and magnetic stripe
- The file contains hardcoded Visa SVG paths and a `1-800-VISA` customer-service phone. Even if the component is never rendered, the audit grep will still flag those strings. For non-card brands, either **delete `card-3d.tsx` entirely** or scrub the hardcoded Visa strings before running the audit.
- **Specific residue check** — `template/src/components/wwa-panel.tsx` line ~68 still renders `<Card3D card={card} size="sm" onClick={...} />` inside the `CardCarousel` component. Every non-card transform MUST replace that line with a photo tile (e.g. `<img src={card.image} .../>` wrapped in a button). Confirmed on Airbnb sim — the template ships with this leak and it has to be edited in-place.

**`src/components/cards-browse-panel.tsx`** — PRODUCT DETAIL VIEW (non-credit-card companies):

The template has credit-card-specific labels throughout the detail view. You MUST rewrite ALL of these for non-card brands:

| Credit-card term | E-commerce/SaaS replacement |
|------------------|----------------------------|
| "Back to Cards" | "Back to Products" / "Back to Collection" |
| "Issued by" | "From" / remove for brand-native products |
| "Annual fee:" | "Price:" |
| "Card Tier" | "Collection" / "Tier" / "Plan" |
| "Card Highlights" | "Product Highlights" / "Features" |
| "Card Details" | "Details" / "Specifications" |
| "REWARDS / WELCOME BONUS / APR" | Remove entirely — not applicable |
| "Ready to apply?" | "Ready to shop?" / "Ready to get started?" |
| "Apply Now" | "Add to Bag" / "Buy Now" / "Subscribe" |
| "Compare Other Cards" | "Explore Collection" / "Continue Shopping" |
| "Application Submitted!" | "Order Confirmed!" / "Welcome!" |
| "Quick application with instant decision" | "Complete your purchase" / "Get started in seconds" |
| "Browse More Cards" | "Continue Shopping" / "Explore More" |
| "Annual Income *" | "Shipping Notes" / remove |
| "credit history" | Remove the credit check reference entirely |
| `{annualFee}/yr` | `{price}` |
| "Secure Application" | "Secure Checkout" |

Also: the detail view renders the product with a dark gradient background and centered 3D card — change to a white background with image on left + details on right for product-style layout.

**`src/components/hero-section.tsx`** — VISUAL STYLE BY BRAND TYPE:

The default template uses a SaaS/tech aesthetic (split layout, colored gradient tiles, tech-y feature grid). This is WRONG for luxury/editorial brands. Adapt per brand:

**LUXURY / EDITORIAL — FRENCH / EUROPEAN (Dior, Hermès, Chanel, Gucci, Aesop):**
- **Hero**: Full-bleed image or video, black/white overlay, centered text, serif heading, no split
- **CTAs**: Square buttons (no rounded-full), white-on-image, "Discover" / "Shop the Collection"
- **Stats**: Minimal, no gradient background, serif numbers, uppercase labels with wide tracking
- **Collections**: Large 2-col tiles with full product imagery, gradient overlay, serif headings
- **Category grid**: Aspect 4:5 tiles with real product images as backgrounds (NOT colored gradients)
- **Fonts**: Playfair Display / Didot-style serif for all headings
- **Typography**: `tracking-[0.3em]` on uppercase labels, `font-normal` (not bold) on headings
- **Colors**: Black, white, cream, gold — no blue/purple accents
- **Motion**: Slow, gentle (1-2s transitions), long fade-ins

**LUXURY — AMERICAN HERITAGE / PREP (Ralph Lauren, Tommy Hilfiger, J.Crew, L.L. Bean, Brooks Brothers):**
- **Hero**: Full-bleed runway OR editorial lifestyle photograph (equestrian, sailing, library, cabin interior — NOT Paris-minimalist void). Static image with 1.04 scale-on-mount is fine — most of these brands have no public video CDN.
- **CTAs**: Square buttons, uppercase-wide tracking, "Shop the Collection" / "Request an Appointment" / "Visit the Flagship"
- **Stats**: Minimal, serif numbers, uppercase labels — same as French luxury
- **Collections**: 2- or 3-col grid of portrait 3:4 or 4:5 images with serif captions
- **Fonts**: Caslon / Garamond / Playfair Display — NOT Didot (that reads as French and wrong)
- **Typography**: Wide-tracked uppercase labels in burgundy or navy, italic body for pullquotes, never all-caps long-form
- **Colors**: Navy primary, burgundy accent, cream surface, racing green or tartan secondary, antique gold highlight — avoid stark black/white/gold (that's French)
- **Motion**: Slower than French luxury (1200–1600ms), no scale transforms beyond 1.04

**TECH / SAAS (Stripe, Notion, Linear):**
- Split hero with copy left + product screenshot right
- Colored CTAs (rounded-full), "Start Building" / "Book a Demo"
- Stats on dark background with bold numbers
- Feature grid with icons (not images)
- Code snippets as visual elements

**CONSUMER (Apple, Nike, Spotify):**
- Full-bleed hero with big bold text, keep sans-serif
- Single prominent CTA, bold colors
- Product-focused imagery, minimal copy

**FINTECH / FINANCIAL (Visa, Chase, Robinhood):**
- Keep current template style (split, colored tiers, card visuals)
- Blue/navy color palette
- Stats-heavy design, trust signals

**MARKETPLACE / C2C (Vinted, Depop, Etsy, eBay, Poshmark):**
- **Hero**: carousel of category solutions with lifestyle photography (real people + items — NOT isolated product shots). Hero copy is short and action-oriented ("Dresses, tops, denim, and outerwear — secondhand").
- **CTAs**: dual-intent, always two buttons — primary "Sell Now" (solid brand color) + secondary "Start Browsing" (outline or darker brand color). Never "Shop Now" alone; a marketplace's sellers are half the audience.
- **Stats bar**: members / markets / lifetime GMV / seller-fees. Example from Vinted: "80M+ Members · 26 Markets · €10.8B Annual GMV · 0% Selling fees". The zero-fees or low-fees stat is often the single most persuasive number — lead with it if true.
- **Navigation**: the brand's real category tree (Women / Men / Designer / Kids / Home), plus a "Sell" item that routes to the seller flow.
- **Feature tiles** (instead of product grid): Buyer Protection, Ship Fast, Designer Authentication, Bundle Discounts, Zero Fees, Wallet — these are *trust & flow* features, not products.
- **Fonts**: utility sans-serif (Inter, Geist). Marketplaces are utility-first; serif reads luxury and is wrong.
- **Colors**: most marketplaces use a single bold color (Vinted teal `#09B1BA`, Depop red, Etsy orange, Poshmark pink). Use the brand color boldly — stats band, hero CTAs, feature icons.
- **No `book-demo-modal` in the classic B2B shape** — see the marketplace variant in the `book-demo-modal.tsx` guidance below.

**MARKETPLACE / LISTINGS (Booking, Airbnb, VRBO, Trivago, Expedia, Hotels.com, Agoda):**

Similar to C2C marketplaces but asymmetric — travellers/buyers are the primary audience, hosts/sellers are the B-side. Different hero + CTA pattern:

- **Hero**: large photographic hero (city skyline / destination / accommodation) with a **search form overlay** — not a static CTA button. The search form IS the primary interaction. Standard fields: destination, check-in, check-out, guests.
- **CTAs — asymmetric, NOT dual-intent**:
  - Primary: "Search Stays" / "Find a Hotel" / "Search Flights" — large, solid brand color, near the search form
  - Secondary: "List Your Property" / "Become a Host" — small outline button in nav or footer, routes to a host-onboarding modal
  - Do NOT paste dual CTAs side-by-side like C2C. The search form is a primary-heavy pattern.
- **Two signature grids** — SHIP BOTH on the homepage:
  1. **Trending inventory grid** — 18-26 tiles of individual stays/cities/routes with real photography (Paris boutique, Tokyo capsule, Santorini cave, Maldives villa). Each tile shows image + name + price indicator ("from €180/night") + city label.
  2. **Destinations / categories grid** — 24-36 tiles of countries/cities/regions with iconic destination photos (Eiffel, skyline, monument). Each tile shows image + destination name + property count ("12,450 stays").
  - Both grids are what travellers actually scroll through. Skipping either breaks the marketplace feel.
- **Stats bar**: properties / countries / languages / support. Example from Booking: "3M+ Properties · 220+ Countries · 40+ Languages · 24/7 Support".
- **Navigation**: Hotels · Apartments · Villas · Hostels · B&Bs · Holiday homes · Resorts · plus "List your property" as the host entry.
- **`src/lib/cards.ts` repurposing**: the 9-15 `productItems` represent stay categories (Hotels/Apartments/Villas/etc.), NOT individual properties — the same repurposing convention as C2C features but with category shape.
- **Optional `src/lib/destinations.ts`**: listings marketplaces almost always have a destinations catalog. Create this file with `{ id, city, country, region, heroImage, propertyCount }[]` and wire a `list_destinations(region?)` MCP tool to it. Vinted uses `list_markets(region?)` for country markets; Booking uses `list_destinations(region?)` for cities; Uber would use `list_cities(country?)`. Same shape, different primary axis.
- **Optional `src/lib/experiences.ts`** (for brands that sell **activities** alongside stays — Airbnb Experiences, Klook, Viator, GetYourGuide, Hotels.com Spots): `{ id, city, title, type, price, duration, image }[]`. Experiences aren't stays (no overnight axis) and aren't destinations (they're bookable events) — they need their own dataset. Wire a `find_experience(city?, type?)` MCP tool. Skip this file if the brand only sells stays.
- **Premium tier within the marketplace** — Airbnb Luxe, Booking Genius, VRBO Premier Partner, Expedia One Key. These are *tiers-within-the-marketplace* that carry extra service slots (trip designer, pre-stocked pantry, airport transfer, priority support). The flat `productItems[].tier` field in the template captures the label but not the extras. If the premium tier matters to the brand story, create a `premium-tier.ts` with `{ features: string[], amenities: string[], support: string }` and add a fifth MCP tool `get_premium_tier()`. Otherwise just flag the tier with a single card in `productItems` and accept the simplification.
- **Fonts**: utility sans-serif (Inter, Geist). Same as C2C.
- **Colors**: a confident primary color (Booking blue `#003580`, Airbnb red `#FF5A5F`, Expedia yellow `#FFC72C`) — the primary drives the search form, stats bar, and trending grid chrome.

When transforming, EXPLICITLY adapt the hero and category grid to match the brand's visual DNA. Don't just update text — change the layout pattern.

**RETAIL — MULTI-BRAND (Sephora, Nordstrom, Net-A-Porter, Farfetch, Selfridges, MatchesFashion):**

Different from mono-brand luxury (Dior/Hermès) because they stock hundreds of external brands and have to surface those brands as first-class entities. Different from marketplace (Vinted/Airbnb) because they carry real inventory, not user listings.

- **Hero**: large campaign carousel (3-4 slides) with brand collaborations or seasonal themes — less minimalist than luxury, more editorial/commercial.
- **Navigation**: by category (Makeup, Skincare, Fragrance, Hair, Men, Gifts) AND by brand (dedicated "Brands" entry in the nav).
- **Signature sections** on homepage:
  1. Nouveautés / New in — 16+ products
  2. Bestsellers — 16+ products
  3. Shop by category — 6-8 large tiles
  4. Featured brands — horizontal row of 20+ brand cards (logos + "shop the brand")
  5. Curated routine / look builder — 3-4 step walkthrough (Nettoyer → Tonifier → Traiter → Hydrater for beauty)
- **`src/lib/brands.ts`** — REQUIRED for multi-brand retail. `{ id, name, logo, origin, categories[], featured }[]` + `list_brands(category?, featuredOnly?)` MCP tool. Sephora stocks 340+ brands and without this the agent can't answer "what brands do you stock from Korea".
- **Product detail view** — e-commerce shape (NOT Airbnb listing card, NOT credit-card detail):
  - Gallery strip (hero + 3 thumbs; thumbs can repeat with product variants)
  - Brand name (prominent, above title) + product title + star rating + review count + trust badges ("Clean at Sephora", "Cruelty-free", "Vegan")
  - Price row (with strikethrough if discounted)
  - **Shade / swatch picker** — 8-12 color chips with hover labels (required for makeup; skincare skips this)
  - Quantity selector + "Add to bag" / "Ajouter au panier" button in the brand accent color
  - Accordion sections: Ingredients, How to use, Benefits, Reviews
  - "Recommandés pour vous" / "You might also like" — 4-card row filtered to same category
  - No booking card, no application form — pure e-commerce
- **Fonts**: utility sans-serif (Inter / Helvetica Neue). Matches beauty/retail flat-minimalism.
- **Colors**: most beauty retailers use a stark black/white palette (Sephora, Net-A-Porter) with a single accent (Sephora red `#DE1F29`). Tom Ford / Charlotte Tilbury do black + gold. Farfetch does black + editorial color blocks.
- **MCP tools** specific to beauty retail:
  - `list_brands(category?, featuredOnly?)` — filter 340+ brands by category
  - `find_shade_match(undertone?, coverage?, finish?, skinTone?)` — foundation/lipstick recommendation
  - `get_routine(skinType?, concern?, budget?)` — 3-4 step skincare routine
  - `get_fragrance_notes(productId)` — top/heart/base notes per fragrance
  - `search_products` extended with `brand?` and `skinType?` args

**`src/components/wwa-panel.tsx`** — ACCOUNT CREATION FLOW:

The template's account creation asks for "annual income" (makes sense for credit card applications, wrong for everything else). For non-financial brands, replace the income question with something contextually relevant:

| Brand Type | Replace "annual income" with |
|------------|------------------------------|
| Luxury/Fashion | "What categories interest you most? (Fragrance, Bags, Fashion, Jewelry)" |
| E-commerce | "What styles do you prefer?" |
| SaaS | "What's your role/team size?" |
| Enterprise | "What's your company size?" |
| Content/Media | "What genres do you like?" |
| Financial | Keep "annual income" — it's relevant |
| Marketplace / C2C | "Are you mostly buying or selling?" + follow-up category interest. Ask BOTH because the primary flow branches on this. |

Also update:
- `lastAssistantMsg.includes("annual income")` → check for the new question
- Welcome message: "Apply for any card" → "Shop" / "Start using" / appropriate verb
- Summary line: "💰 $income" → "✨ Interests: preferences"
- Avatar background color: `1A1F71` (Visa blue) → brand primary color

**`src/components/wwa-panel.tsx`** — BUY/CHECKOUT MESSAGES:

Replace credit-card phrasing in the buy intent responses:
- "apply for" → "order" / "shop" / "checkout"
- "card" → "product" / "item"
- "annual fee" → "price"
- "Quick apply" → "Quick checkout" / "Fast order"
- "I'll fill the form for you" → "I'll place the order for you"

**`src/components/world-map.tsx`** — REGIONAL STATS:

The template has credit-card network stats (`merchants: "12M+"`, `banks: "5,000+"`, `cards: "800M+"`). Replace with brand-appropriate stats:

| Brand Type | Regional Stats |
|------------|----------------|
| Luxury/Fashion | Boutiques per region, artisans, flagship locations |
| SaaS | Data centers, enterprise customers, API regions |
| Retail | Stores, distribution centers, warehouses |
| Finance | Banks, merchants, cards (keep default) |

Also update GLOBAL_STATS: `"4B+ Cards worldwide"` must match the brand's reality.

**`src/components/card-comparison.tsx`** — TIER BENEFITS:

The template has 20+ Visa-specific credit card benefits (Zero Liability, Auto Rental CDW, Trip Delay, Global Entry Credit, etc). REMOVE all of these and write tier benefits that apply to the brand:

| Brand Type | Tier Benefit Examples |
|------------|----------------------|
| Luxury/Fashion | Free shipping, gift wrap, personalization, private shopping, birthday gift, archive access |
| SaaS | API calls/mo, support SLA, seats, priority features, dedicated account manager |
| Retail | Free shipping threshold, returns window, early access, member pricing |
| Subscription | Streaming quality, devices, downloads, family sharing, ad-free |

Tier names `Traditional / Signature / Infinite` are Visa-specific — rename to match the brand's tier system (e.g., Free/Pro/Enterprise for SaaS, Essentials/Signature/Élite for luxury).

### Step 3.6: Verify Zero Original References

Three comprehensive checks. ALL must pass before deploying:

```bash
# 0. RE-RUN Step 2.3 visual verification for every image referenced from cards.ts / solutions.ts.
#    Open each file in Read and confirm it still shows the correct brand. Do not trust
#    earlier verification — if an agent rewrote data files during Phase 3, image paths may
#    have been shuffled. This check is fast (8-12 Read calls) and catches the #1 UX bug.
grep -oE '"/images/[^"]+"' src/lib/cards.ts src/lib/solutions.ts | sort -u
# For each path listed, Read it and confirm brand match.

# 1. Check for any Visa-brand text leaks
grep -rn "Visa\|visa\.\|#1A1F71\|#141963\|#1434CB" src/ --include="*.tsx" --include="*.ts" | grep -v visaCards | grep -v VisaCard

# 2. Check for credit-card terminology that doesn't fit non-card brands
grep -rn "annual fee\|annual income\|card tier\|Apply Now\|cardholder\|APR\|Reward Rate\|Sign-Up Bonus\|issued by\|Zero Liability\|credit check\|credit history\|Traditional, Signature, and Infinite\|Issuer opt\." src/ --include="*.tsx" --include="*.ts" -i | grep -v node_modules
```

Fix every remaining line before deployment. The `card-3d.tsx` component is allowed to keep credit-card text because it's only rendered for actual credit card brands (Visa/Mastercard).

### Known template residues — scrub before deploy

These files ship in the template with Visa-shaped placeholders that the ordinary Phase 3 rewrites don't always catch. Verify each one explicitly before deploying:

| File | What to scrub |
|------|---------------|
| `src/components/book-demo-modal.tsx` | Ships with B2B fields (CompanySize, AnnualRevenue, Country dropdown, SKU picker) AND an inline Visa wordmark SVG in the header. For luxury / e-commerce brands, rewrite as "Request a Private Appointment" per the luxury pattern above. For SaaS keep B2B but relabel products. For consumer, replace entirely with a newsletter/contact form. **For marketplace / C2C brands**, rewrite as "Open your seller account" — fields: name + email + username + preferred market (dropdown of the brand's live markets only, NOT all countries) + account type (Personal vs Pro) + main category + expected item volume. Drop B2B revenue/size fields entirely. **For marketplace / Listings brands** (Booking, Airbnb, VRBO, Expedia), rewrite instead as "List your property" — fields: contact name + email + phone + property type (Hotel / Apartment / Villa / B&B / Holiday home / Cabin) + number of rooms + destination (city/country) + property name + short description + partner-terms opt-in. Primary audience of this modal is hosts, not buyers — the buyer surface is the search form in the hero. Drop B2B revenue/size fields. **For retail / multi-brand brands** (Sephora, Nordstrom, Net-A-Porter, Farfetch), rewrite as a loyalty signup — fields: name + email + birthday (short format MM-DD for anniversary gifts) + preferred categories (multi-select chips: Makeup / Skincare / Fragrance / Hair / Men / Gifts) + occasion dropdown ("For myself" / "As a gift" / "Wedding" / "Event") + GDPR/marketing consent checkbox. The loyalty programme name and tiers go in the header copy (e.g. Sephora's Blanche/Or/Noire, Nordstrom's Nordy Club). Drop B2B revenue/size fields. In all cases, replace the header SVG with `<img src={BRAND.logoImage} className="brightness-0 invert" />`. The hero's main CTA opens this modal — an untouched modal ships the wrong form and the wrong logo on the most-clicked button. |
| `src/lib/cards.ts` field repurposing per brand type | The `ProductItem` interface is finance-shaped (`issuer`/`tier`/`annualFee`/`apr`/`rewardRate`/`signUpBonus`/`applyUrl`) but the field names are stable — semantics repurpose per brand. Keep a comment block at top of `cards.ts` documenting the mapping so the next maintainer doesn't report them as Visa leaks. **Per brand type:** marketplace C2C → `annualFee: "Free" / "€5 shipping"`, `apr: "All markets"`, `rewardRate: headline benefit`, `signUpBonus: incentive`. Marketplace Listings → `annualFee: "from €180/night"`, `apr: "Entire place"`, `rewardRate: "★ 4.9"`, `signUpBonus: "Free cancellation"`. Retail Multi-brand Beauty → `issuer: brand name` (e.g. "Fenty Beauty"), `tier: collection/line`, `annualFee: price (€)`, `apr: shade / finish` ("50 shades · Matte finish"), `rewardRate: "★ 4.6 (1.2K reviews)"`, `signUpBonus: badge` ("Clean at Sephora" / "Award winner"), `applyUrl: product URL`. Luxury mono-brand → `issuer: House name`, `tier: line` (Lady Dior / Book Tote), `annualFee: price`, `apr: material/size`, `signUpBonus: included` (engraving / monogram). Don't rename the interface properties unless you're willing to update ~12 component references. For listings marketplaces also create `src/lib/destinations.ts`; for multi-brand retail also create `src/lib/brands.ts` (brand catalogue) and optionally `src/lib/fragrances.ts` (notes + perfumer). |
| `src/components/assistant-shared.tsx` EmptyState | The welcome-screen logo is **the call button** (clicking it starts the voice call). Ships with an inline Visa wordmark SVG — which means the FIRST FRAME a customer sees before any interaction shows a Visa logo. Replace the `<svg><path d="..." /></svg>` inside the EmptyState button with `<img src={BRAND.logoImage} alt={BRAND.name} />`. Without this fix, every brand transform launches on a Visa logo. |
| `src/components/live-session-overlay.tsx` | Two inline SVG references render the Visa wordmark in the voice-call overlay (header + animated center). Replace with `<img src={BRAND.logoImage} alt={BRAND.name} />` or swap the SVG path — otherwise the voice call shows Visa. Also rewrite the system-prompt text (role, CTAs, "local banks in 200+ countries") per brand, BUT keep the "TOOL USE IS MANDATORY" block verbatim — it's what makes Gemini Live actually drive the left panel. |
| `src/lib/gemini-live-client.ts` | The `show_card` / `show_solution` tool descriptions include example IDs (`'chase-sapphire-preferred'`, `'tap-to-pay'`). Gemini Live reads these as strong hints about what valid IDs look like. If you leave them unchanged on a non-Visa brand, the voice call will refuse to invoke the tools or will call them with made-up IDs — and the left panel stays empty during the call. Replace both example IDs with real ids from your brand's `cards.ts` / `solutions.ts` (e.g. `'jadore-edp'`, `'cruise-2026'`). This is the single most common reason voice calls "just talk" without updating the visible panel. |
| `src/components/agent-panel.tsx` | The mock API key uses the prefix `vsk_live_` (Visa-derived). Change to a brand-neutral `api_live_` or a brand-specific prefix (`hsk_`, `drk_`, etc). Runs through `Math.random().toString(36)` — easy to miss. |
| `src/lib/cards.ts` | The `ProductItem` interface fields (`annualFee`, `apr`, `rewardRate`, `signUpBonus`, `issuer`, `applyUrl`) all bias toward credit cards. For non-card brands, either repurpose them (document with a comment block at the top of cards.ts — e.g. `annualFee` → price, `apr` → material, `rewardRate` → craftsmanship) or rename the interface properly (updates ~12 components). The audit grep cannot tell a repurposed field from a leak. |
| `src/components/hero-section.tsx` | Often still contains hardcoded `STATS` / `CARD_TIERS` arrays instead of reading from `BRAND.stats`. Replace with `BRAND.stats.map(...)` so stats come from brand-config. |
| `src/components/inner-page.tsx` | Contains `PersonalPage`, `BusinessPage`, `TravelPage` route shapes that assume a payments-brand nav. Rename / re-shape to match `BRAND.navItems` or delete and let `page.tsx` route dynamically. |

---

## PHASE 4: Build, Deploy, Verify

### Step 4.0: Generate a unique, safe slug (REQUIRED)

**Every transform MUST deploy under a `project-*` slug, not the raw brand name.** Two reasons:

1. **Safe Browsing safety** — Chrome's brand-phishing classifier flags any subdomain that looks like a well-known brand (`booking.codiris.app`, `apple.codiris.app`, `nike.codiris.app`). Using `project-<brand>-<unique>` breaks that exact-match heuristic. This is a hard requirement for new transforms since the Booking incident (2026-04-21).
2. **Collision avoidance** — multiple customers transforming the same brand would race for one subdomain. A unique suffix guarantees every customer's deploy has its own URL.

**The required slug shape:**

```
project-<short-brand>-<4char-hex>
```

- `<short-brand>` — 3-8 letters, lowercase, pointing at the brand but not the full domain. Drop the word most associated with the real brand if the full name is too recognizable. Examples:
  - `booking.com` → `book24` (NOT `booking`)
  - `airbnb.com` → `abnb`
  - `dior.com` → `dior` is fine (not a phishing target yet)
  - `nike.com` → `nk` or `nike` (borderline — prefer `nk`)
  - `chase.com` → `chs` (fintech = high-risk — always obfuscate)
- `<4char-hex>` — generated from `openssl rand -hex 2` (4 hex chars = 65,536 combinations). Never reuse.

**Generate at the start of Phase 4:**

```bash
SHORT_BRAND="book24"     # replace per brand
RANDOM_ID=$(openssl rand -hex 2)
SLUG="project-${SHORT_BRAND}-${RANDOM_ID}"
echo "Your slug: $SLUG"
# e.g. project-book24-a4f2
```

Save this value — you'll use it in `brand-config.ts`, as the Vercel project name, as the Cloudflare CNAME, and as the alias.

**Collision check against the registry:**

```bash
curl -s -o /tmp/claim.json -w "%{http_code}\n" "https://codiris.app/api/wwa/registry/$SLUG"
```

- **HTTP 404** — slug is free (expected when using the 4-char random suffix). Continue.
- **HTTP 200** — astronomically unlikely collision. Regenerate `RANDOM_ID` and try again.

**Update brand-config.ts** so every runtime reference to the deploy URL is correct:

```ts
export const BRAND: BrandConfig = {
  // ...
  mcpUrl: `https://wwa.${SLUG}.codiris.app/mcp`,   // replace ${SLUG} with your generated value
  mcpServerName: `${SLUG}-agent`,                   // used in MCP server name + CLI install command
};
```

**Exceptions (grandfathered):** the original 7 brands on `codiris.app/skills` (visa, stripe, dior, ralphlauren, hermes, puma, vinted) still live at `wwa.<brand>.codiris.app` — they pre-date this policy. Do NOT add new transforms at raw-brand subdomains; every new one gets a `project-*` slug.

**After a successful deploy,** open a PR to `public/wwa-registry.json` in `wwwtowwa` adding your entry:

```json
{
  "slug": "{short-brand}",
  "domain": "{brand}.com",
  "deployed_url": "https://wwa.{slug-with-random}.codiris.app",
  "mcp_url": "https://wwa.{slug-with-random}.codiris.app/mcp",
  "type": "{luxury-french|luxury-heritage|fintech|saas|marketplace|marketplace-listings|sportswear|consumer}",
  "color": "{brand primary hex}",
  "first_claimed_at": "YYYY-MM-DD",
  "owner": "{your-handle-or-email}"
}
```

Note: the registry `slug` field is the **short brand** (e.g. `booking`) so the showcase lookup groups all deploys of that brand together, while `deployed_url` carries the full `project-<brand>-<hex>` subdomain that's unique per transform.

### Step 4.1: Build
```bash
npm run build
```
Fix ALL errors. Common: unterminated strings, missing images, type mismatches.

### Step 4.2: Deploy

Create `.env.local` in your new project with the keys below. A stub `.env.example` ships in the template — `cp .env.example .env.local` and fill in your own values.

```
OPENAI_API_KEY=sk-…          # from https://platform.openai.com (fallback chat model)
GEMINI_API_KEY=AIza…         # from https://aistudio.google.com/apikey (primary)
GOOGLE_GENERATIVE_AI_API_KEY=AIza…  # same value as GEMINI_API_KEY (the voice client reads this name)
```

The MCP endpoint renders without these keys — only the AI chat + voice call need them.

```bash
npx vercel --prod --yes

# Push env vars to Vercel
source .env.local
echo "$OPENAI_API_KEY"               | npx vercel env add OPENAI_API_KEY               production --force
echo "$GEMINI_API_KEY"               | npx vercel env add GEMINI_API_KEY               production --force
echo "$GOOGLE_GENERATIVE_AI_API_KEY" | npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production --force

npx vercel --prod --yes
```

### Step 4.2b: Disable Vercel Deployment Protection (if the deploy returns 401)

New Vercel projects under some team accounts default to **Standard Protection** (SSO-required). Symptom: `curl https://wwa{brand}.vercel.app` returns **HTTP 401** with a Vercel SSO login page. Happens silently — no warning from the CLI.

Check with `curl -s -o /dev/null -w "%{http_code}\n" https://{your-vercel-url}`. If you see 401, disable protection via the Vercel API:

```bash
# Read the Vercel CLI's auth token (macOS path)
TOKEN=$(cat "$HOME/Library/Application Support/com.vercel.cli/auth.json" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))')
PROJECT_ID=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['projectId'])")
TEAM_ID=$(python3 -c "import json; print(json.load(open('.vercel/project.json'))['orgId'])")

curl -s -X PATCH "https://api.vercel.com/v9/projects/$PROJECT_ID?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ssoProtection":null,"passwordProtection":null}' \
  | python3 -c "import sys,json; r=json.load(sys.stdin); print('sso:', r.get('ssoProtection'), '| pw:', r.get('passwordProtection'))"
```

Expected output: `sso: None | pw: None`. The change takes effect within seconds — no redeploy needed.

Linux path: `$HOME/.local/share/com.vercel.cli/auth.json`. Windows path: `%APPDATA%\com.vercel.cli\auth.json`.

### Step 4.3: Custom subdomain (OPTIONAL — requires Cloudflare token)

The `wwa.{brand}.codiris.app` alias requires a Cloudflare API token scoped to the `codiris.app` zone. **This token is not shipped with the skill** — it's private infrastructure. Two paths:

**A. You have the token** (maintainer, or coordinated with Iris Lab):
```bash
export CLOUDFLARE_API_TOKEN=…  # scoped to codiris.app zone, DNS edit permission

ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=codiris.app" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['result'][0]['id'])")
curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"CNAME","name":"wwa.{domain}","content":"cname.vercel-dns.com","proxied":false,"ttl":1}'
npx vercel domains add wwa.{domain}.codiris.app
npx vercel --prod --yes
```

**B. You don't have the token** (most customers):
Skip this step. Your Vercel default URL (`https://<project>.vercel.app`) is a fully working agentfront — the MCP endpoint, chat, and all pages work there. Update `brand-config.ts` `mcpUrl` to the Vercel URL so the displayed install command matches. Ask the registry owner (open an issue at github.com/Humiris/wwa-transform) to provision the `wwa.{brand}.codiris.app` alias when you're ready to ship under the shared subdomain.

### Step 4.4: Verify
1. Check HTTP 200: `curl -s -o /dev/null -w "%{http_code}" https://wwa.{domain}.codiris.app`
2. Use WebFetch to read the deployed page — check NO wrong-company content
3. Check images load
4. **MCP round-trip**: `curl -s -m 20 -X POST https://wwa.{domain}.codiris.app/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'` — must return the tool list with 200
5. Report URL to user

**Preview-tool caveat:** the `preview_start` MCP tool detects `package.json` from your **session cwd**, not from `.claude/launch.json` in the target project. If your session cwd is not the target project (e.g. you're working on `wwa.ralphlauren` from a session rooted at `wwa.visa`), `preview_start` will start the wrong dev server. Verify via `curl` against the deployed URL instead of local screenshots when working cross-project.

---

## QUALITY CHECKLIST

Before saying "done", verify:
- [ ] Hero shows THIS company's real value prop and images
- [ ] Stats are THIS company's real numbers
- [ ] Products/solutions are from THIS company's website
- [ ] Categories make sense for THIS company (no "Travel Cards" for Stripe)
- [ ] Navigation matches THIS company's actual sections
- [ ] Inner pages have real content from THIS company
- [ ] Chat suggestions are relevant to THIS company
- [ ] Fallback responses reference THIS company's real products
- [ ] All images are downloaded and loading
- [ ] Zero references to any other company (Visa, etc.)
- [ ] The page structure makes sense for THIS type of company
- [ ] CTAs match what the company actually wants users to do
