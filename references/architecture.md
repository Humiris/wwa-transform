# WWA Agentfront Architecture v2

## Core Framework (Keep for ALL companies)

These components provide the agent-first interaction layer. They work for any company:

| Component | Purpose | Always Keep? |
|-----------|---------|--------------|
| `page.tsx` | Split-pane layout orchestrator | YES — but customize sections |
| `brand-navbar.tsx` | Top nav with logo, menu, sign-in | YES |
| `wwa-panel.tsx` | AI chat with intent detection | YES — customize suggestions/keywords |
| `agent-panel.tsx` | Developer page (API keys, MCP, skills) | YES |
| `account-panel.tsx` | User account creation | YES |
| `book-demo-modal.tsx` | Demo booking form | YES — customize product interests |
| `generated-view.tsx` | AI code generation iframe | YES |
| `live-session-overlay.tsx` | Voice calls | YES |
| `assistant-shared.tsx` | Fallback chat responses | YES — REWRITE per company |

## Content Components (Customize per company)

These must be REWRITTEN based on what the company actually is:

| Component | Purpose | Customization |
|-----------|---------|---------------|
| `hero-section.tsx` | Homepage hero, stats, tiers, features | Stats, sections, images, CTAs |
| `inner-page.tsx` | Navigation page content | ALL pages rewritten from crawled data |
| `solution-detail-panel.tsx` | Product detail view | Works generically with solutions data |
| `solution-slider.tsx` | Horizontal product carousel | Works generically |
| `cards-browse-panel.tsx` | Product browsing/filtering | Category labels from company data |
| `card-comparison.tsx` | Side-by-side comparison | Works generically |
| `card-3d.tsx` | 3D product card | Only if company has visual cards |
| `world-map.tsx` | Global presence map | Only if company has global presence |

## Data Files (Generated per company)

| File | Content |
|------|---------|
| `brand-config.ts` | Company identity, colors, nav, stats, agent identity |
| `solutions.ts` | Products/services array (from crawled data) |
| `cards.ts` | Browsable items (pricing tiers, products) — can be empty |
| `actions.ts` | AI system prompt tailored to company |

## Page Structure Decision Tree

```
Is it a credit card company?
  YES → Card tiers, card browser, card comparison, 3D cards
  NO → Skip card-specific sections

Does it have distinct products?
  YES → Product grid/carousel on homepage
  NO → Feature showcase instead

Does it have pricing tiers?
  YES → Pricing section with tier cards
  NO → "Contact Sales" or "Book Demo" CTA

Is it developer-focused?
  YES → Code examples, API reference links, SDK badges
  NO → Skip developer content on homepage

Does it have global presence?
  YES → World map with stats
  NO → Skip map section

Does it sell to consumers?
  YES → Shopping/browse experience, product catalog
  NO → Solutions by use case, case studies, enterprise CTA
```

## Homepage Section Order (Typical)

1. **Hero** — Always first. Rotating products or single hero.
2. **Stats Bar** — If company has impressive numbers.
3. **Products/Solutions Grid** — What they sell. Adapted layout.
4. **Feature Showcase** — Key differentiators with images.
5. **Social Proof** — Customer logos, testimonials (if available).
6. **Category Browser** — Only if products have meaningful categories.
7. **CTA** — "Book a Demo", "Start Free", "Get Started" based on company type.

## State Management

All state in `page.tsx`:
- Navigation: `activeNavPage`, `activeSolution`, `activeCards`
- Views: `generatedView`, `showMap`, `agentPanelOpen`
- Modals: `showBookDemo`, `showAccountCreation`
- History: `historyRef` for back navigation
- Mobile: `isMobile`, `activeTab`

## AI Integration

- **Primary model**: Gemini 3.1 Flash Lite (configurable)
- **Fallback**: GPT-5.4 (configurable)
- **Voice**: Gemini Live via WebSocket
- **Intent**: Priority detection (buy > account > demo > address > AI classifier)
- **Code gen**: Two-step (plan → build) with sandboxed iframe output
