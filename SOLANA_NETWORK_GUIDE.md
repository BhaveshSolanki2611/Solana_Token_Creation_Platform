# SOLANA_NETWORK Environment Variable Guide

## 🌐 Available Network Options

Your Solana Token Creation Platform supports **three networks**:

### 1. `devnet` (Recommended for Testing)
```
SOLANA_NETWORK=devnet
```
- **Purpose**: Development and testing
- **Cost**: FREE - No real SOL required
- **Features**: Full functionality, airdrops available
- **Best for**: Testing your application, development

### 2. `testnet` (Advanced Testing)
```
SOLANA_NETWORK=testnet
```
- **Purpose**: More realistic testing environment
- **Cost**: FREE - Test SOL only
- **Features**: Closer to mainnet behavior
- **Best for**: Pre-production testing

### 3. `mainnet-beta` (Production)
```
SOLANA_NETWORK=mainnet-beta
```
- **Purpose**: Live production environment
- **Cost**: REAL SOL required for transactions
- **Features**: Real tokens, real value
- **Best for**: Production deployment

## 🎯 Recommended Setup by Use Case

### For Development/Testing (Most Common)
```
SOLANA_NETWORK=devnet
```
**Why devnet?**
- ✅ Free SOL airdrops available
- ✅ No real money at risk
- ✅ Full functionality testing
- ✅ Fast transaction confirmation

### For Pre-Production Testing
```
SOLANA_NETWORK=testnet
```
**Why testnet?**
- ✅ More realistic network conditions
- ✅ Still free to use
- ✅ Better for load testing

### For Production Launch
```
SOLANA_NETWORK=mainnet-beta
```
**Why mainnet-beta?**
- ✅ Real tokens with real value
- ✅ Production-ready
- ⚠️ Requires real SOL for transactions

## 🔧 How to Set in Vercel

### Option 1: Single Network (Recommended)
Set one network for your deployment:
```
SOLANA_NETWORK=devnet
```

### Option 2: Allow Users to Choose
If you want users to select the network in your app, you can:
1. Set a default: `SOLANA_NETWORK=devnet`
2. Let users switch networks in the UI
3. The app will use the user's selection

## 💡 Best Practices

### For New Projects
1. **Start with devnet**: `SOLANA_NETWORK=devnet`
2. **Test thoroughly** on devnet first
3. **Move to testnet** for advanced testing
4. **Deploy to mainnet-beta** only when ready for production

### For Production Apps
- **Staging Environment**: Use `testnet`
- **Production Environment**: Use `mainnet-beta`
- **Development Environment**: Use `devnet`

## 🚨 Important Notes

### Cost Implications
- **devnet**: FREE ✅
- **testnet**: FREE ✅  
- **mainnet-beta**: COSTS REAL SOL ⚠️

### Transaction Speed
- **devnet**: Fast (good for testing)
- **testnet**: Moderate (realistic testing)
- **mainnet-beta**: Variable (real network conditions)

### Airdrops
- **devnet**: ✅ Available (up to 5 SOL per request)
- **testnet**: ✅ Available (limited)
- **mainnet-beta**: ❌ Not available (must buy real SOL)

## 🎯 Quick Decision Guide

**Choose `devnet` if:**
- You're testing the application
- You want free SOL airdrops
- You're developing new features
- You don't want to spend real money

**Choose `testnet` if:**
- You're doing pre-production testing
- You want more realistic network conditions
- You're testing performance under load

**Choose `mainnet-beta` if:**
- You're launching for real users
- You want to create real tokens with value
- You're ready for production

## 📝 Example Vercel Environment Variables

### For Testing/Development
```
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
CLIENT_URL=https://your-app-name.vercel.app
SOLANA_NETWORK=devnet
```

### For Production
```
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=production
CLIENT_URL=https://your-app-name.vercel.app
SOLANA_NETWORK=mainnet-beta
```

## 🔄 Switching Networks

You can change the network anytime by:
1. Going to your Vercel project settings
2. Updating the `SOLANA_NETWORK` environment variable
3. Redeploying your application

**Recommendation**: Start with `devnet` for your first deployment!