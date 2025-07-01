# Step-by-Step Vercel Deployment Guide

## 🚀 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **MongoDB Database** - You'll need a MongoDB connection string
4. **Project Ready** - All fixes have been applied (✅ Done!)

## 📋 Step 1: Prepare Your Repository

### 1.1 Push to GitHub
```bash
# If not already done, initialize git and push to GitHub
git add .
git commit -m "Fix Vercel deployment issues"
git push origin main
```

### 1.2 Verify Files
Ensure these key files are in your repository:
- ✅ `vercel.json` (updated configuration)
- ✅ `api/index.js` (serverless function)
- ✅ `package.json` (updated scripts)
- ✅ `client/build/` (built React app)

## 🔗 Step 2: Connect to Vercel

### 2.1 Sign Up/Login to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Login"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub account

### 2.2 Import Your Project
1. Click "New Project" on your Vercel dashboard
2. Find your repository in the list
3. Click "Import" next to your project
4. **Important**: Vercel will auto-detect the configuration from `vercel.json`

## ⚙️ Step 3: Configure Project Settings

### 3.1 Project Configuration
Vercel should automatically detect:
- **Framework Preset**: Other
- **Build Command**: `npm run vercel-build`
- **Output Directory**: `client/build`
- **Install Command**: `npm run install-all`

If not auto-detected, set these manually.

### 3.2 Environment Variables (CRITICAL)
Click "Environment Variables" and add these:

**Required Variables:**
```
MONGODB_URI = your_mongodb_connection_string_here
NODE_ENV = production
CLIENT_URL = https://your-app-name.vercel.app
SOLANA_NETWORK = devnet
```

**Optional Variables:**
```
SOLANA_DEVNET_URL = https://api.devnet.solana.com
SOLANA_TESTNET_URL = https://api.testnet.solana.com
SOLANA_MAINNET_URL = https://api.mainnet-beta.solana.com
```

### 3.3 MongoDB Setup (If Needed)
If you don't have MongoDB:
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Add to `MONGODB_URI` environment variable

## 🚀 Step 4: Deploy

### 4.1 Initial Deployment
1. Click "Deploy" button
2. Wait for build process (2-5 minutes)
3. Vercel will show build logs in real-time

### 4.2 Monitor Build Process
Watch for:
- ✅ Dependencies installation
- ✅ Client build completion
- ✅ Serverless function creation
- ✅ Deployment success

## 🧪 Step 5: Test Your Deployment

### 5.1 Basic Tests
Once deployed, test these URLs:

**Frontend:**
```
https://your-app-name.vercel.app/
```

**API Health Check:**
```
https://your-app-name.vercel.app/api/health
```

### 5.2 Automated Testing
Use the provided test script:
```bash
node test-deployment.js https://your-app-name.vercel.app
```

### 5.3 Manual Testing Checklist
- [ ] Frontend loads without errors
- [ ] Wallet connection works
- [ ] API endpoints respond
- [ ] Token creation functions
- [ ] All routes accessible

## 🔧 Step 6: Troubleshooting Common Issues

### 6.1 Build Failures
**Issue**: Build fails during deployment
**Solution**: 
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### 6.2 API Not Working
**Issue**: API endpoints return 500 errors
**Solution**:
- Check environment variables are set
- Verify MongoDB connection string
- Check function logs in Vercel dashboard

### 6.3 CORS Issues
**Issue**: Frontend can't connect to API
**Solution**:
- Ensure `CLIENT_URL` environment variable matches your domain
- Check CORS configuration in `api/index.js`

### 6.4 Database Connection Issues
**Issue**: MongoDB connection fails
**Solution**:
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure database user has proper permissions

## 🔄 Step 7: Updates and Redeployment

### 7.1 Automatic Deployments
- Every push to your main branch triggers automatic deployment
- Vercel will rebuild and redeploy automatically

### 7.2 Manual Redeployment
1. Go to Vercel dashboard
2. Select your project
3. Click "Redeploy" on any deployment

### 7.3 Environment Variable Updates
1. Go to project settings
2. Update environment variables
3. Redeploy to apply changes

## 📊 Step 8: Monitor Your Application

### 8.1 Vercel Dashboard
Monitor:
- Deployment status
- Function invocations
- Error logs
- Performance metrics

### 8.2 Function Logs
- Click on "Functions" tab
- View real-time logs
- Debug API issues

## 🎯 Success Checklist

Your deployment is successful when:
- [ ] ✅ Build completes without errors
- [ ] ✅ Frontend loads at your Vercel URL
- [ ] ✅ API health check returns status "ok"
- [ ] ✅ Wallet connection works
- [ ] ✅ Token creation functions properly
- [ ] ✅ All routes are accessible
- [ ] ✅ No CORS errors in browser console

## 🆘 Getting Help

If you encounter issues:

1. **Check Vercel Logs**: Most issues show up in build/function logs
2. **Verify Environment Variables**: Ensure all required variables are set
3. **Test Locally**: Run `npm run vercel-build` locally first
4. **Check Documentation**: Refer to `VERCEL_DEPLOYMENT.md` for details

## 🎉 You're Done!

Your Solana Token Creation Platform is now live on Vercel! 

**Your app will be available at:**
`https://your-app-name.vercel.app`

**API endpoints will be available at:**
`https://your-app-name.vercel.app/api/*`

## 📝 Quick Commands Reference

```bash
# Test deployment locally
npm run vercel-build

# Test specific build
cd client && npm run build

# Test API locally
npm run dev

# Deploy via CLI (optional)
npm install -g vercel
vercel --prod
```

---

**Note**: All deployment issues have been fixed. The application is now fully compatible with Vercel's deployment requirements while preserving all functionality.