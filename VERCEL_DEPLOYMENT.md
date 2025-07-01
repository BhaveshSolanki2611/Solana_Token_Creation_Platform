# Vercel Deployment Guide

## Fixed Issues

### 1. Vercel Configuration Error
**Problem**: The `functions` property cannot be used in conjunction with the `builds` property.

**Solution**: 
- Removed the legacy `builds` property from `vercel.json`
- Updated to use the modern `functions` configuration
- Created proper API serverless function structure

### 2. API Structure
**Problem**: Server was in subdirectory which doesn't work well with Vercel's serverless functions.

**Solution**:
- Created `/api/index.js` as the main serverless function entry point
- Updated routing to use `/api/*` paths correctly
- Maintained backward compatibility with existing server routes

### 3. Build Process
**Problem**: Build scripts were not optimized for Vercel deployment.

**Solution**:
- Updated `vercel-build` script to properly install dependencies and build client
- Simplified build process to work with Vercel's expectations
- Fixed API endpoint mappings in client code

## Current Configuration

### vercel.json
```json
{
  "version": 2,
  "name": "solana-token-creation-platform",
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "client/build",
  "installCommand": "npm run install-all",
  "functions": {
    "api/index.js": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

### Environment Variables Required
Set these in your Vercel dashboard:

- `MONGODB_URI`: Your MongoDB connection string
- `NODE_ENV`: Set to "production"
- `CLIENT_URL`: Your Vercel app URL (e.g., https://your-app.vercel.app)
- `SOLANA_NETWORK`: "devnet", "testnet", or "mainnet-beta"

### Optional Environment Variables
- `SOLANA_DEVNET_URL`: Custom devnet RPC URL
- `SOLANA_TESTNET_URL`: Custom testnet RPC URL  
- `SOLANA_MAINNET_URL`: Custom mainnet RPC URL

## Deployment Steps

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add the required environment variables

## File Structure
```
/
├── api/
│   └── index.js          # Main serverless function
├── client/
│   ├── build/            # Built React app (generated)
│   ├── src/
│   └── package.json
├── server/
│   ├── routes/           # API routes (used by api/index.js)
│   ├── models/           # Database models
│   └── utils/            # Utility functions
├── vercel.json           # Vercel configuration
└── package.json          # Root package.json
```

## API Endpoints
All API endpoints are available under `/api/`:

- `POST /api/tokens` - Create new token
- `GET /api/tokens/:address` - Get token info
- `GET /api/tokens/owner/:address` - Get tokens by owner
- `POST /api/tokens/transfer` - Transfer tokens
- `POST /api/tokens/mint` - Mint additional tokens
- `POST /api/tokens/burn` - Burn tokens
- `GET /api/tokens/:address/holders` - Get token holders
- `GET /api/tokens/:address/transactions` - Get token transactions
- `POST /api/tokens/transactions/confirm` - Confirm transaction
- `GET /api/wallet/balance/:address` - Get wallet balance
- `POST /api/wallet/airdrop` - Request SOL airdrop

## Testing Deployment
After deployment, test these endpoints:
1. `GET /api/health` - Should return server status
2. `GET /` - Should serve the React application
3. API endpoints should work with proper CORS headers

## Troubleshooting

### Build Failures
- Check that all dependencies are properly installed
- Ensure Node.js version compatibility (>=18.x)
- Verify environment variables are set

### API Issues
- Check MongoDB connection string
- Verify Solana network configuration
- Check function timeout limits (currently 30s)

### CORS Issues
- Ensure CLIENT_URL environment variable matches your domain
- Check CORS configuration in api/index.js