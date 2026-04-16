# Deployment Guide

## Prerequisites

- Vercel CLI: `npm i -g vercel` (or use `npx vercel`)
- Cloudflare API token with DNS edit permissions for codiris.app zone
- API keys: `OPENAI_API_KEY`, `GEMINI_API_KEY`

## Step 1: Vercel Deployment

```bash
cd ~/wwa.{domain}

# Initial deploy
npx vercel --prod --yes

# Set environment variables
npx vercel env add OPENAI_API_KEY production <<< "$OPENAI_API_KEY"
npx vercel env add GEMINI_API_KEY production <<< "$GEMINI_API_KEY"
npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production <<< "$GEMINI_API_KEY"

# Redeploy with env vars active
npx vercel --prod --yes
```

## Step 2: Cloudflare DNS

The codiris.app domain is managed via Cloudflare. Create a CNAME record:

```bash
# Get zone ID for codiris.app
ZONE_ID=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/zones?name=codiris.app" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  | jq -r '.result[0].id')

# Create CNAME: wwa.{domain}.codiris.app → cname.vercel-dns.com
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CNAME",
    "name": "wwa.{domain}",
    "content": "cname.vercel-dns.com",
    "proxied": false,
    "ttl": 1
  }'
```

## Step 3: Vercel Domain Alias

```bash
npx vercel domains add wwa.{domain}.codiris.app
```

## Step 4: Verify

Wait 30-60 seconds for DNS propagation and SSL provisioning, then verify:

```bash
curl -s -o /dev/null -w "%{http_code}" https://wwa.{domain}.codiris.app
# Should return 200
```

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENAI_API_KEY` | Yes | GPT-5.4 fallback for chat + code gen |
| `GEMINI_API_KEY` | Yes | Gemini Flash Lite primary chat model |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Yes | Same as GEMINI_API_KEY (used by @google/generative-ai SDK) |
| `CLOUDFLARE_API_TOKEN` | For DNS | Cloudflare API token for codiris.app |
| `CLOUDFLARE_ACCOUNT_ID` | For DNS | Cloudflare account ID |

## Troubleshooting

- **Build fails**: Check `npm run build` output for TypeScript errors
- **404 on deploy**: Ensure vercel project is linked correctly
- **DNS not resolving**: Check Cloudflare dashboard, may take up to 5 minutes
- **SSL error**: Vercel auto-provisions SSL, wait 2-3 minutes after domain add
- **API errors on deployed site**: Verify env vars are set with `npx vercel env ls`
