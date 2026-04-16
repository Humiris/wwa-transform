# WWA Transform

> Turn any website into an AI-powered agentfront — crawl, generate, deploy.

WWA Transform is a Claude Code plugin + CLI tool that transforms any website into a full agent-first experience with AI chat, voice calls, interactive product browsing, conversational checkout, and more.

## Install

### Claude Code Plugin

```bash
# Clone to your plugins directory
git clone https://github.com/Humiris/wwa-transform.git ~/.claude/plugins/wwa-transform
```

Then in Claude Code:
```
/wwa-transform https://stripe.com
```

### CLI

```bash
npx wwa-transform https://stripe.com
```

### Codex

```bash
codex --plugin https://github.com/Humiris/wwa-transform
```

Then ask: "Transform stripe.com into an agentfront"

## What It Does

1. **Crawls** the target website — extracts brand, products, images, colors, navigation
2. **Analyzes** the company — understands market, customers, value proposition
3. **Generates** a full Next.js agentfront with:
   - Split-pane layout (content left, AI chat right)
   - AI chat powered by Gemini + GPT
   - Real-time voice calls via Gemini Live
   - 3D interactive product cards
   - Conversational checkout & demo booking
   - AI code generation for reports/dashboards
   - Developer page with API keys & MCP server
4. **Deploys** to `wwa.{domain}.codiris.app` via Vercel + Cloudflare

## Examples

| Brand | Type | Live URL |
|-------|------|----------|
| Visa | Financial Services | [wwa.visa.codiris.app](https://wwa.visa.codiris.app) |
| Stripe | Developer API | [wwa.stripe.codiris.app](https://wwa.stripe.codiris.app) |
| Apple | Consumer Tech | [wwa.project2389.codiris.app](https://wwa.project2389.codiris.app) |

## Tech Stack

- Next.js 16 + React 19
- Tailwind CSS v4
- Framer Motion
- Zustand
- Gemini 3.1 Flash Lite + GPT-5.4
- Gemini Live (voice)
- Vercel + Cloudflare

## License

MIT — Built by [Iris Lab](https://codiris.app)
