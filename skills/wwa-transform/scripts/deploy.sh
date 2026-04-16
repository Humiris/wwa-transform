#!/bin/bash
# WWA Transform — Deploy to Vercel + Cloudflare DNS
# Usage: ./deploy.sh <domain> <project-dir>
# Example: ./deploy.sh stripe ~/wwa.stripe

set -e

DOMAIN="$1"
PROJECT_DIR="$2"

if [ -z "$DOMAIN" ] || [ -z "$PROJECT_DIR" ]; then
  echo "Usage: ./deploy.sh <domain> <project-dir>"
  echo "Example: ./deploy.sh stripe ~/wwa.stripe"
  exit 1
fi

echo "=== Deploying wwa.${DOMAIN}.codiris.app ==="

# Step 1: Build
echo "Building..."
cd "$PROJECT_DIR"
npm run build

# Step 2: Deploy to Vercel
echo "Deploying to Vercel..."
npx vercel --prod --yes

# Step 3: Set env vars
echo "Setting environment variables..."
if [ -n "$OPENAI_API_KEY" ]; then
  echo "$OPENAI_API_KEY" | npx vercel env add OPENAI_API_KEY production --force 2>/dev/null || true
fi
if [ -n "$GEMINI_API_KEY" ]; then
  echo "$GEMINI_API_KEY" | npx vercel env add GEMINI_API_KEY production --force 2>/dev/null || true
  echo "$GEMINI_API_KEY" | npx vercel env add GOOGLE_GENERATIVE_AI_API_KEY production --force 2>/dev/null || true
fi

# Redeploy with env vars
echo "Redeploying with env vars..."
npx vercel --prod --yes

# Step 4: Cloudflare DNS
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  echo "Setting up DNS..."
  ZONE_ID=$(curl -s -X GET \
    "https://api.cloudflare.com/client/v4/zones?name=codiris.app" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    | python3 -c "import sys,json; print(json.load(sys.stdin)['result'][0]['id'])" 2>/dev/null || echo "")

  if [ -n "$ZONE_ID" ]; then
    curl -s -X POST \
      "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"CNAME\",\"name\":\"wwa.${DOMAIN}\",\"content\":\"cname.vercel-dns.com\",\"proxied\":false,\"ttl\":1}" \
      > /dev/null 2>&1 || true

    npx vercel domains add "wwa.${DOMAIN}.codiris.app" 2>/dev/null || true
    echo "DNS configured: wwa.${DOMAIN}.codiris.app"
  else
    echo "Warning: Could not get Cloudflare zone ID. Set up DNS manually."
  fi
else
  echo "Warning: CLOUDFLARE_API_TOKEN not set. Set up DNS manually."
fi

echo ""
echo "=== Deployment Complete ==="
echo "URL: https://wwa.${DOMAIN}.codiris.app"
echo ""
