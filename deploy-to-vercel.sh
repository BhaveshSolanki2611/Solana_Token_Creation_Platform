#!/bin/bash

# Vercel Deployment Script for Solana Token Creation Platform
# This script helps you deploy the project to Vercel

echo "🚀 Solana Token Creation Platform - Vercel Deployment"
echo "=================================================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    echo "   git push -u origin main"
    exit 1
fi

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Please ensure all deployment fixes are applied."
    exit 1
fi

# Check if api/index.js exists
if [ ! -f "api/index.js" ]; then
    echo "❌ api/index.js not found. Please ensure serverless function is created."
    exit 1
fi

echo "✅ All required files found"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

echo "🔧 Running pre-deployment build..."
npm run vercel-build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🎯 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub if not already done"
echo "2. Go to https://vercel.com and import your project"
echo "3. Set the following environment variables in Vercel:"
echo "   - MONGODB_URI (your MongoDB connection string)"
echo "   - NODE_ENV=production"
echo "   - CLIENT_URL (your Vercel app URL)"
echo "   - SOLANA_NETWORK=devnet"
echo ""
echo "Or deploy directly using Vercel CLI:"
echo "   vercel --prod"
echo ""
echo "📖 For detailed instructions, see: STEP_BY_STEP_VERCEL_DEPLOYMENT.md"