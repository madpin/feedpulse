#!/bin/bash

# Generate secure secrets for Dokploy deployment
# Usage: ./scripts/generate-secrets.sh

echo "🔐 Generating secure secrets for FeedPulse deployment..."
echo ""
echo "Copy these values to your Dokploy environment variables:"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "# Database"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | cut -c1-32)"
echo ""

echo "# JWT Secrets"
echo "JWT_SECRET=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '=+/' | cut -c1-48)"
echo ""

echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Save these secrets securely (password manager)"
echo "   - Never commit these to git"
echo "   - Use these exact values in Dokploy"
echo ""
echo "📝 Don't forget to also set:"
echo "   - DOMAIN (your domain name)"
echo "   - NEXT_PUBLIC_API_URL (https://api.yourdomain.com)"
echo "   - OPENAI_API_KEY (your OpenAI key)"
echo "   - CORS_ORIGIN (https://yourdomain.com)"
echo ""

