#!/bin/bash

echo "🚀 Deploying Solana Token Creation Platform Fixes..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing server dependencies..."
npm install --legacy-peer-deps

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install --legacy-peer-deps
cd ..

# Build the client
echo "🔨 Building client application..."
cd client
npm run build
cd ..

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "🔍 Next steps:"
echo "1. Check Vercel dashboard for deployment status"
echo "2. Verify environment variables are set:"
echo "   - MONGODB_URI"
echo "   - NODE_ENV=production"
echo "   - SOLANA_NETWORK=devnet"
echo "   - CLIENT_URL"
echo "3. Test token creation functionality"
echo "4. Monitor function logs for any issues"
echo ""
echo "📋 If issues persist, check DEPLOYMENT_FIXES_APPLIED.md for troubleshooting"