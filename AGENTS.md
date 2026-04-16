# WWA Transform Agent

This repository contains the WWA Transform tool — an AI agent that transforms any website into an agent-first experience (agentfront).

## How to Use

When asked to transform a website, follow the instructions in `skills/wwa-transform/SKILL.md`.

The workflow is:
1. Deep crawl the target website (4+ pages)
2. Analyze the company (market, products, customers, value prop)
3. Download real images from the website
4. Copy the template from `template/` and customize ALL content
5. Build with `npx next build`
6. Deploy to Vercel + Cloudflare DNS

## Key Files

- `skills/wwa-transform/SKILL.md` — Complete step-by-step instructions
- `skills/wwa-transform/references/` — Architecture, crawling guide, deployment guide
- `template/` — Next.js agentfront template (the framework to build upon)

## Critical Rules

- NEVER copy Visa content to another brand — understand the company first
- ALWAYS download real images from the target website
- ALWAYS rewrite content components (hero, inner pages, chat responses) for the target brand
- The template builds clean with empty data — populate solutions.ts and cards.ts from crawled content
