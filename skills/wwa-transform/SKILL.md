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

**Reality check for SaaS/tech sites:** Most modern SaaS sites (Notion, Vercel, Linear) render product screenshots dynamically via JavaScript, SVG, or Canvas. These CANNOT be downloaded via curl. This is normal. For product images that can't be downloaded:
- Use `https://placehold.co/800x400/{primary_hex_without_hash}/white?text={Product+Name}` — this is perfectly acceptable
- Try to get at least the hero image and logo as real assets
- Customer logos are often SVGs that CAN be downloaded

**If blocked (403):** Try without Referer, try `?w=800&q=80` params, try WebSearch for "{brand} press kit images".

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

**`src/components/card-3d.tsx`** — Only relevant if company sells visual cards/products. For API companies, not used.

### Step 3.6: Verify Zero Original References

```bash
grep -rn "Visa\|visa\.\|#1A1F71\|#141963\|#1434CB" src/ --include="*.tsx" --include="*.ts" | grep -v visaCards | grep -v VisaCard
```
Must return 0. Also grep for any content that's clearly from another company.

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
