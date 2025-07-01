# Solana Token Creation Platform - Vercel Deployment Guide

This guide provides step-by-step instructions to deploy the Solana Token Creation Platform to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare MongoDB Database

1. **Create MongoDB Atlas Cluster**:
   - Log in to MongoDB Atlas
   - Create a new cluster (free tier is sufficient for testing)
   - Wait for cluster to be created

2. **Configure Database Access**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Create a user with "Read and write to any database" permissions
   - Note down the username and password

3. **Configure Network Access**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Select "Allow access from anywhere" (0.0.0.0/0) for Vercel deployment
   - Click "Confirm"

4. **Get Connection String**:
   - Go to "Clusters" and click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your preferred database name (e.g., `solana-tokens`)

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the repository containing your code

2. **Configure Build Settings**:
   - **Framework Preset**: Other
   - **Root Directory**: Leave empty (use root)
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install --legacy-peer-deps`

3. **Set Environment Variables**:
   Click "Environment Variables" and add the following:

   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string_here
   SOLANA_NETWORK=devnet
   SOLANA_DEVNET_URL=https://api.devnet.solana.com
   SOLANA_TESTNET_URL=https://api.testnet.solana.com
   SOLANA_MAINNET_URL=https://api.mainnet-beta.solana.com
   CLIENT_URL=https://your-app-name.vercel.app
   ```

   **Important**: Replace the following:
   - `your_mongodb_connection_string_here` with your actual MongoDB connection string
   - `your-app-name.vercel.app` with your actual Vercel app URL (you'll get this after deployment)

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy from Project Root**:
   ```bash
   vercel
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add NODE_ENV
   vercel env add MONGODB_URI
   vercel env add SOLANA_NETWORK
   vercel env add SOLANA_DEVNET_URL
   vercel env add SOLANA_TESTNET_URL
   vercel env add SOLANA_MAINNET_URL
   vercel env add CLIENT_URL
   ```

## Step 3: Configure Environment Variables

After deployment, you need to set the correct `CLIENT_URL`:

1. **Get Your Vercel URL**:
   - After deployment, Vercel will provide a URL like `https://your-app-name.vercel.app`

2. **Update CLIENT_URL**:
   - Go to your Vercel project dashboard
   - Navigate to "Settings" → "Environment Variables"
   - Update `CLIENT_URL` with your actual Vercel URL
   - Redeploy the application

## Step 4: Verify Deployment

1. **Check Application**:
   - Visit your Vercel URL
   - Verify the application loads correctly
   - Test wallet connection functionality

2. **Check API Endpoints**:
   - Visit `https://your-app-name.vercel.app/api/health`
   - Should return a JSON response with status "ok"

3. **Test Token Creation**:
   - Connect a Solana wallet (Phantom recommended)
   - Try creating a test token on devnet
   - Verify the token appears in your dashboard

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `SOLANA_NETWORK` | Default Solana network | `devnet` |
| `SOLANA_DEVNET_URL` | Devnet RPC URL | `https://api.devnet.solana.com` |
| `SOLANA_TESTNET_URL` | Testnet RPC URL | `https://api.testnet.solana.com` |
| `SOLANA_MAINNET_URL` | Mainnet RPC URL | `https://api.mainnet-beta.solana.com` |
| `CLIENT_URL` | Frontend URL for CORS | `https://your-app.vercel.app` |

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Ensure all dependencies are properly installed
   - Check that Node.js version is 18.x
   - Verify `package.json` scripts are correct

2. **Database Connection Issues**:
   - Verify MongoDB connection string is correct
   - Ensure database user has proper permissions
   - Check network access settings in MongoDB Atlas

3. **API Errors**:
   - Check Vercel function logs in the dashboard
   - Verify environment variables are set correctly
   - Ensure CORS settings allow your domain

4. **Wallet Connection Issues**:
   - Verify the application is served over HTTPS
   - Check browser console for errors
   - Ensure wallet adapter dependencies are properly installed

### Performance Optimization

1. **Custom RPC Endpoints**:
   - Consider using custom RPC endpoints for better performance
   - Services like QuickNode, Alchemy, or Helius provide faster RPC access
   - Update the `SOLANA_*_URL` environment variables accordingly

2. **Database Optimization**:
   - Create indexes on frequently queried fields
   - Consider using MongoDB connection pooling
   - Monitor database performance in MongoDB Atlas

## Security Considerations

1. **Environment Variables**:
   - Never commit `.env` files to version control
   - Use strong, unique passwords for database users
   - Regularly rotate database credentials

2. **Network Security**:
   - Consider restricting MongoDB network access to specific IP ranges
   - Use HTTPS for all communications
   - Implement rate limiting for API endpoints

3. **Wallet Security**:
   - Never store private keys on the server
   - All transactions are signed client-side
   - Validate all user inputs on the server

## Monitoring and Maintenance

1. **Vercel Analytics**:
   - Enable Vercel Analytics for performance monitoring
   - Monitor function execution times and errors

2. **Database Monitoring**:
   - Use MongoDB Atlas monitoring tools
   - Set up alerts for high resource usage
   - Regularly backup your database

3. **Application Updates**:
   - Keep dependencies updated
   - Monitor Solana network changes
   - Test thoroughly before deploying updates

## Support

If you encounter issues during deployment:

1. Check Vercel deployment logs
2. Review MongoDB Atlas logs
3. Test API endpoints individually
4. Verify environment variables are correctly set

For additional support, refer to:
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)