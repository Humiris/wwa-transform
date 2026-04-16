# WWA Transform

> Turn any website into an AI-powered agentfront — crawl, generate, deploy.

WWA Transform is a plugin for **Claude Code** and **Codex** that transforms any website into a full agent-first experience with AI chat, voice calls, interactive product browsing, conversational checkout, and more.

## Install

### Claude Code

```bash
git clone https://github.com/Humiris/wwa-transform.git ~/.claude/plugins/wwa-transform
```

Then in Claude Code:
```
/wwa-transform https://stripe.com
```

### Codex (OpenAI)

**Option A — Personal install:**
```bash
# Clone the plugin
git clone https://github.com/Humiris/wwa-transform.git ~/.codex/plugins/wwa-transform

# Add to your personal marketplace
mkdir -p ~/.agents/plugins
cat > ~/.agents/plugins/marketplace.json << 'EOF'
{
  "name": "wwa-plugins",
  "interface": { "displayName": "WWA Plugins" },
  "plugins": [{
    "name": "wwa-transform",
    "source": { "source": "local", "path": "../../.codex/plugins/wwa-transform" },
    "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
    "category": "Development"
  }]
}
EOF
```

Then restart Codex, go to Plugins, and install **WWA Transform**.

**Option B — Repo-scoped install (for teams):**
```bash
# In your repo root
mkdir -p .agents/plugins
git clone https://github.com/Humiris/wwa-transform.git .agents/plugins/wwa-transform

cat > .agents/plugins/marketplace.json << 'EOF'
{
  "name": "wwa-plugins",
  "interface": { "displayName": "WWA Plugins" },
  "plugins": [{
    "name": "wwa-transform",
    "source": { "source": "local", "path": "./wwa-transform" },
    "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
    "category": "Development"
  }]
}
EOF
```

Then ask Codex: *"Transform stripe.com into an agentfront"*

### CLI (standalone)

```bash
npx wwa-transform https://stripe.com
```

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

## Live Examples

| Brand | Type | Live URL |
|-------|------|----------|
| Visa | Financial Services | [wwa.visa.codiris.app](https://wwa.visa.codiris.app) |
| Stripe | Developer API | [wwa.stripe.codiris.app](https://wwa.stripe.codiris.app) |
| Apple | Consumer Tech | [wwa.project2389.codiris.app](https://wwa.project2389.codiris.app) |

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | AI chat (GPT fallback) |
| `GEMINI_API_KEY` | Yes | AI chat (Gemini primary) |
| `CLOUDFLARE_API_TOKEN` | For DNS | Custom domain setup |

## Tech Stack

Next.js 16 / React 19 / Tailwind v4 / Framer Motion / Zustand / Gemini 3.1 Flash / GPT-5.4 / Gemini Live / Vercel / Cloudflare

## Plugin Structure

```
wwa-transform/
├── .claude-plugin/plugin.json    # Claude Code manifest
├── .codex-plugin/plugin.json     # Codex manifest
├── skills/wwa-transform/
│   ├── SKILL.md                  # Core skill instructions
│   └── references/               # Architecture, crawling, deployment guides
├── template/                     # Next.js agentfront template
├── cli/                          # Standalone CLI
├── AGENTS.md                     # Codex agent instructions
├── codex.json                    # Codex config
├── marketplace.json              # Marketplace entry
└── assets/                       # Logo, icons
```

## License

MIT — Built by [Iris Lab](https://codiris.app)
