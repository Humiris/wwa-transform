# Agentizer — Codex Plugin Directory Submission

This folder contains everything you need to submit Agentizer to OpenAI's
Codex Plugin Directory the moment self-serve submissions open.

Just paste the relevant section into OpenAI's submission form / channel.

---

## Plugin name

**Agentizer**

## Tagline (≤ 60 chars)

**Turn any website into an AI agent. One command.** (43 chars)

## Short description (≤ 160 chars)

**Crawls any website, generates a split-pane agent interface with chat + voice + MCP, deploys to {brand}.codiris.app. Codex / Claude Code / CLI.** (148 chars)

## Long description

Agentizer transforms any public website into a deployed AI-powered "agentfront" in one command.

Given a single URL, it:

1. **Crawls** the brand — extracts identity (name, colors, products, copy, real CDN imagery) across 4+ pages with consent handling.
2. **Generates** a full Next.js 16 split-pane agent interface — AI chat (GPT-5.4-mini), live voice (OpenAI Realtime `gpt-realtime`), 3D product cards, conversational checkout, and an embedded **MCP Connect** component that lets any external AI agent plug into the deployed brand.
3. **Deploys** to Vercel + custom domain at `{brand}.codiris.app`, sets up Cloudflare DNS + SSL automatically, and exposes a public Streamable-HTTP MCP endpoint with a `/.well-known/mcp.json` discovery manifest.

19 brand transforms shipped via this skill — every one publicly browsable at https://codiris.app/skill-creator. Examples:

- Habyt: https://habyt.codiris.app — flexible co-living with 245 properties, 1,886 photos, Matterport 3D tours
- Joivy: https://joivy.codiris.app — student housing across 12 European cities
- Y Combinator: https://ycombinator.codiris.app — startup application flow with 4-step apply modal

## Categories

- **Primary**: Development
- **Tags**: `codex-plugin`, `claude-skill`, `mcp`, `agentfront`, `cli`, `website-transformer`

## Capabilities (Codex permissions requested)

| Permission | Why we need it |
|---|---|
| `Read` | Read crawled HTML, brand assets, project templates |
| `Write` | Generate the new project file tree (cards.ts, MCP route, components) |
| `Edit` | Adapt template files per brand (colors, copy, MCP tools) |
| `Bash` | Run `npm install`, `next build`, `vercel deploy`, scrape via curl |
| `Glob` | Discover template files to copy/adapt |
| `Grep` | Find brand-specific strings to swap during peer-clone |
| `WebFetch` | Crawl the target website's pages and CDN assets |

No filesystem access outside of `~/.agents`/`~/.claude`/`/tmp` working dirs. No network access except: target site's domain (read-only), `cdn.*` of the target brand (read-only), `vercel.com` API (deploy), `cloudflare.com` API (DNS), `api.openai.com` (chat).

## Pricing

**Free** (MIT licensed). Optional cost: deploys use the operator's own Vercel + Cloudflare accounts, billed by those vendors directly. No upcharge from Iris Lab.

## URLs

| Field | Value |
|---|---|
| Repository | https://github.com/Humiris/wwa-transform |
| Marketplace JSON | https://raw.githubusercontent.com/Humiris/wwa-transform/main/marketplace.json |
| Plugin manifest | https://raw.githubusercontent.com/Humiris/wwa-transform/main/.codex-plugin/plugin.json |
| Skill | https://raw.githubusercontent.com/Humiris/wwa-transform/main/skills/agentizer/SKILL.md |
| Homepage | https://codiris.app/skills |
| Showcase (live transforms) | https://codiris.app/skill-creator |
| Docs | https://codiris.app/skills |
| Privacy Policy | https://codiris.app/privacy |
| Terms of Service | https://codiris.app/terms |
| Author | https://codiris.app |
| Latest release | https://github.com/Humiris/wwa-transform/releases/tag/v2.0.1 |

## Logos

- 256×256 PNG: https://raw.githubusercontent.com/Humiris/wwa-transform/main/assets/logo-256.png
- 1024×1024 PNG: https://raw.githubusercontent.com/Humiris/wwa-transform/main/assets/logo-1024.png
- SVG (vector): https://raw.githubusercontent.com/Humiris/wwa-transform/main/assets/logo.svg

Brand color: **#635BFF** (codiris indigo)

## Default prompts (suggested in the Codex picker)

1. `Agentize https://stripe.com`
2. `Create an agentfront for notion.com`
3. `Turn shopify.com into an AI-powered website`

## Verifying the manifest

A clean run of the validator confirms everything is in place:

```
$ python3 submission/validate.py
[.codex-plugin/plugin.json] all required + recommended fields present
[marketplace.json] github source → Humiris/wwa-transform main
[Logos] 256, 1024 PNG + SVG all present
[Skill] root SKILL.md (106 KB) + skills/agentizer/SKILL.md (symlink) — both reachable
Result: ready to submit.
```

(See `submission/manifest-validation.txt` for the full report.)

## Security review notes

- No telemetry. The skill never phones home. The deployed agentfronts each have their own MCP endpoint that the operator owns.
- API keys (OpenAI, Gemini, Cloudflare, Vercel) are read from environment variables at runtime — never logged, never committed, never sent to Iris Lab.
- The `/api/realtime-token` endpoint inside generated apps mints **ephemeral** OpenAI Realtime tokens (60-second TTL) so the main API key never touches the browser. Strict Origin/Referer allowlist prevents harvesting.
- Operator owns the destination — DNS, Vercel project, deployed code, MCP endpoints. Iris Lab has no control plane.
- Open-source under MIT, full code at github.com/Humiris/wwa-transform — security-review-friendly.

## Demo / screencast

Live demonstrations:

- Watch a brand transform end-to-end: https://codiris.app/skill-creator (click any tile)
- 30-second voice + chat demo: https://habyt.codiris.app — click the mic button, ask "find a 6-month room in Berlin"
- MCP integration: https://habyt.codiris.app/mcp — POST `tools/list` from any agent

## Author / contact

- Name: Iris Lab
- Email: hello@codiris.app
- Website: https://codiris.app
- GitHub: https://github.com/Humiris

---

## Cover letter (paste into the freeform field, if any)

> Hi OpenAI,
>
> Agentizer is a Codex plugin (and Claude Code skill, Cursor rule, CLI binary)
> that turns any website into a deployed AI-powered agent interface in one
> command. We've shipped 19 brand transforms using it so far — Habyt, Joivy,
> Y Combinator, Stripe, and more — every one publicly browsable at
> codiris.app/skill-creator with a live MCP endpoint.
>
> The plugin is MIT-licensed, no telemetry, version 2.0.1, manifest passes
> Codex spec validation. We'd love to be on the directory so other developers
> can find this without going through the GitHub direct-install path.
>
> Demo URL (live): https://habyt.codiris.app
> Repo: https://github.com/Humiris/wwa-transform
>
> Happy to address any review feedback. Thanks for opening this directory!
>
> — Iris Lab
