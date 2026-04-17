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
`/Users/joel/wwa-skill/template/` — Framework only (split-pane, chat, navbar). Content is generated custom per company.

## Reference Implementation
`/Users/joel/wwa.visa/` — Shows what a finished agentfront looks like for a payment card company.

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
| Marketplace (Airbnb) | Search / Book | "Start Searching" | Search UI |
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

Most premium brand sites (Dior, Apple, Notion, Vercel, Hermès) AGGRESSIVELY BLOCK curl. Do NOT waste time trying to download from the brand's CDN. Skip directly to the fallback:

**1. Brand's own CDN** (only works for ~30% of sites — try once, move on if blocked)
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
```

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

---

## PHASE 3: Build the Project

### Step 3.1: Copy Framework

```bash
cp -r /Users/joel/wwa-skill/template/ ~/wwa.{domain}/
cd ~/wwa.{domain} && npm install
```

**Template naming:** The template uses `ProductItem`/`productItems` (not VisaCard/visaCards) as generic names for browsable items. The navbar component is `brand-navbar.tsx`, the map is `world-map.tsx`. All imports in page.tsx already use these names.

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

**`src/lib/brand-config.ts`** — Logo:
- Download logo via WebSearch: "{brand} logo SVG wikipedia" or "{brand} press kit"
- Set `logoSvg: ""` and `logoImage: "/images/brand-logo.svg"`
- ALWAYS prefer logo image file over inline SVG to avoid rendering issues

**`src/components/world-map.tsx`** — Update stats or remove if not relevant

**`src/components/card-3d.tsx`** — ONLY for credit card companies (Visa, Mastercard). 
- For ALL other companies: the template already uses product image cards instead of Card3D
- The `cards-browse-panel.tsx` and `wwa-panel.tsx` CardCarousel show product images with name/price overlay
- Do NOT use Card3D for fashion, SaaS, e-commerce, or any non-card company — it renders a credit card with chip and magnetic stripe

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

**LUXURY / EDITORIAL (Dior, Hermès, Chanel, Gucci, Aesop):**
- **Hero**: Full-bleed image, black/white overlay, centered text, serif heading, no split
- **CTAs**: Square buttons (no rounded-full), white-on-image, "Discover" / "Shop the Collection"
- **Stats**: Minimal, no gradient background, serif numbers, uppercase labels with wide tracking
- **Collections**: Large 2-col tiles with full product imagery, gradient overlay, serif headings
- **Category grid**: Aspect 4:5 tiles with real product images as backgrounds (NOT colored gradients)
- **Fonts**: Playfair Display / Didot style serif for all headings
- **Typography**: `tracking-[0.3em]` on uppercase labels, `font-normal` (not bold) on headings
- **Colors**: Black, white, cream, gold — no blue/purple accents
- **Motion**: Slow, gentle (1-2s transitions), long fade-ins

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

When transforming, EXPLICITLY adapt the hero and category grid to match the brand's visual DNA. Don't just update text — change the layout pattern.

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

Two comprehensive checks. BOTH must return 0 lines (or only intentional lines) before deploying:

```bash
# 1. Check for any Visa-brand text leaks
grep -rn "Visa\|visa\.\|#1A1F71\|#141963\|#1434CB" src/ --include="*.tsx" --include="*.ts" | grep -v visaCards | grep -v VisaCard

# 2. Check for credit-card terminology that doesn't fit non-card brands
grep -rn "annual fee\|annual income\|card tier\|Apply Now\|cardholder\|APR\|Reward Rate\|Sign-Up Bonus\|issued by\|Zero Liability\|credit check\|credit history\|Traditional, Signature, and Infinite\|Issuer opt\." src/ --include="*.tsx" --include="*.ts" -i | grep -v node_modules
```

Fix every remaining line before deployment. The `card-3d.tsx` component is allowed to keep credit-card text because it's only rendered for actual credit card brands (Visa/Mastercard).

---

## PHASE 4: Build, Deploy, Verify

### Step 4.1: Build
```bash
npm run build
```
Fix ALL errors. Common: unterminated strings, missing images, type mismatches.

### Step 4.2: Deploy
```bash
# Copy env from existing project
cp ~/wwa.visa/.env.local .env.local

npx vercel --prod --yes

# Set env vars
source .env.local
echo "$OPENAI_API_KEY" | npx vercel env add OPENAI_API_KEY production --force
echo "$GEMINI_API_KEY" | npx vercel env add GEMINI_API_KEY production --force
echo "$GEMINI_API_KEY" | npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production --force

npx vercel --prod --yes
```

### Step 4.3: DNS
```bash
source ~/Documents/wwwtowwa/.env.vercel.local
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

### Step 4.4: Verify
1. Check HTTP 200: `curl -s -o /dev/null -w "%{http_code}" https://wwa.{domain}.codiris.app`
2. Use WebFetch to read the deployed page — check NO wrong-company content
3. Check images load
4. Report URL to user

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
