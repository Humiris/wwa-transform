# Deep Crawling & Company Intelligence Guide

## Philosophy

The crawl isn't about grabbing HTML — it's about UNDERSTANDING THE COMPANY. After crawling, you should know:
- What they sell and to whom
- How they make money
- What makes them different
- What their customers care about

## Crawl Strategy: 4 Pages Minimum

### Page 1: Homepage
Ask WebFetch:
```
Extract EVERYTHING from this page:
1. Brand name, tagline, meta description
2. Hero section: main headline, subheadline, CTA buttons
3. ALL image URLs (full absolute URLs)
4. Navigation menu items with URLs
5. Product/feature sections with names and descriptions
6. Stats/numbers (users, revenue, countries, uptime)
7. Customer logos or testimonials
8. Colors: primary button color, header background, accent colors (hex)
9. Footer links and social media
10. What type of company is this? What do they sell?
```

### Page 2: Products or Features Page
```
List every product/feature mentioned:
- Product name
- Description (2-3 sentences)  
- Key features (bullet points)
- Pricing if shown
- Target audience
- ALL image URLs
```

### Page 3: Pricing Page (if exists)
```
Extract the full pricing structure:
- Plan names and prices
- What's included in each tier
- Free tier details
- Enterprise/custom pricing
- Any usage-based pricing
- CTAs for each tier
```

### Page 4: About Page
```
Extract:
- Company mission/story
- Key statistics (founded year, employees, funding, customers)
- Leadership team
- Office locations / global presence
- Awards or recognition
- ALL images
```

## Company Type Classification

After crawling, classify the company:

| Type | Examples | Homepage Should Have |
|------|----------|---------------------|
| **Developer API** | Stripe, Twilio, SendGrid | Code examples, API products, pricing tiers, docs links |
| **Consumer E-commerce** | Nike, Apple, Amazon | Product catalog, categories, shopping cart, lifestyle images |
| **Enterprise SaaS** | Salesforce, SAP, Workday | Solutions by industry, case studies, demo CTA, ROI stats |
| **Consumer SaaS** | Spotify, Netflix, Canva | Feature showcase, pricing plans, social proof, "Start Free" |
| **Financial Services** | Visa, Mastercard, PayPal | Card products, tiers, security features, global presence |
| **Marketplace** | Airbnb, Uber, DoorDash | Dual-sided (hosts/guests), search, trust/safety |
| **Healthcare/Biotech** | Moderna, Teladoc | Solutions, research, compliance, patient stories |
| **Infrastructure** | AWS, Cloudflare, Vercel | Products grid, pricing calculator, status/uptime, docs |

## Image Download Strategy

**Minimum images needed per company type:**

| Type | Required Images |
|------|----------------|
| Any | Logo, hero banner, favicon |
| API/SaaS | Product screenshots (1 per product), UI demos |
| E-commerce | Product photos (6+), lifestyle shots, category images |
| Enterprise | Case study images, solution graphics, team photos |
| Financial | Card images, security graphics, app screenshots |

**Download command:**
```bash
curl -L -o "public/images/{name}.jpg" "{url}" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Referer: https://{domain}/"
```

**Fallback for blocked images:**
1. Try `?w=800&q=80` or `?format=jpg` query params
2. WebSearch: "{company} press kit images"
3. Check og:image meta tags
4. Use social media profile images
5. Last resort: `https://placehold.co/800x400/{hex}/white?text={Product+Name}`

## Content Generation Rules

After understanding the company, generate content that's TRUE to them:

**DO:**
- Use their actual product names
- Use their real pricing (if public)
- Use their real stats and metrics
- Write descriptions in their brand voice
- Structure pages around their actual navigation
- Include sections that match their business model

**DON'T:**
- Copy structure from another company (Visa, Apple, etc.)
- Include sections that don't apply (no "credit card tiers" for API companies)
- Make up features or stats
- Use generic placeholder text
- Keep any categories/labels from the template company
