# Solana Token Creation Platform

A comprehensive, production-ready platform for creating and managing SPL tokens on the Solana blockchain. Deploy your own tokens with custom metadata, social links, and advanced features.

## 🚀 Features

- **Token Creation**: Create custom SPL tokens with metadata and social links
- **Wallet Integration**: Connect with popular Solana wallets (Phantom, Solflare, etc.)
- **Multi-Network Support**: Support for devnet, testnet, and mainnet
- **Token Management**: Comprehensive dashboard for token management
- **Transaction History**: Complete transaction history with pagination and status tracking
- **Token Holders**: View detailed token holders information with balances and percentages
- **Advanced Settings**: Configure mint and freeze authorities
- **Social Integration**: Add website, Twitter, Telegram, and Discord links
- **Responsive Design**: Modern Material-UI interface optimized for all devices

## 🛠 Tech Stack

- **Frontend**: React 18, Material-UI 5, Solana Wallet Adapter
- **Backend**: Node.js 18, Express, MongoDB
- **Blockchain**: Solana Web3.js, SPL Token Library
- **Deployment**: Vercel (Production Ready)
- **Database**: MongoDB Atlas

## 📋 Prerequisites

- Node.js 18+
- MongoDB database (MongoDB Atlas recommended)
- Solana wallet (Phantom recommended)
- Git

## 🚀 Quick Start

### Local Development

1. **Clone the repository**:
```bash
git clone https://github.com/yourusername/solana-token-creation-platform.git
cd solana-token-creation-platform
```

2. **Install dependencies**:
```bash
npm run install-all
```

3. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other settings
```

4. **Start development server**:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Deployment

For production deployment to Vercel, see the comprehensive [**DEPLOYMENT_GUIDE.md**](./DEPLOYMENT_GUIDE.md).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/solana-token-creation-platform)

## 🌐 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `development` |
| `PORT` | Server port | No | `5000` |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `SOLANA_NETWORK` | Default Solana network | No | `devnet` |
| `SOLANA_DEVNET_URL` | Devnet RPC endpoint | No | `https://api.devnet.solana.com` |
| `SOLANA_TESTNET_URL` | Testnet RPC endpoint | No | `https://api.testnet.solana.com` |
| `SOLANA_MAINNET_URL` | Mainnet RPC endpoint | No | `https://api.mainnet-beta.solana.com` |
| `CLIENT_URL` | Frontend URL for CORS | Yes (Production) | `http://localhost:3000` |

## 📖 Usage Guide

### Creating a Token

1. **Connect Wallet**: Click "Connect Wallet" and select your preferred Solana wallet
2. **Token Details**: Enter basic information (name, symbol, decimals, supply)
3. **Advanced Settings** (Optional): Configure mint and freeze authorities
4. **Social & Metadata** (Optional): Add description, image, and social links
5. **Review & Deploy**: Review all details and deploy to the blockchain

### Managing Tokens

- **Dashboard**: View all your created tokens
- **Token Details**: Click on any token to view detailed information
- **Transaction History**: Track all token-related transactions
- **Token Operations**: Mint, transfer, or burn tokens (if you have authority)

## 🏗 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   └── build/              # Production build
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── utils/              # Server utilities
│   └── index.js            # Server entry point
├── .env                    # Environment variables
├── vercel.json             # Vercel configuration
└── package.json            # Root package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server (both client and server)
- `npm run client` - Start only the React client
- `npm run server` - Start only the Node.js server
- `npm run build` - Build the application for production
- `npm run install-all` - Install dependencies for both client and server
- `npm run vercel-build` - Build for Vercel deployment

## 🔌 API Endpoints

### Token Management
- `GET /api/health` - Health check endpoint
- `GET /api/tokens/:address` - Get token information
- `GET /api/tokens/:address/holders` - Get detailed token holders information
- `GET /api/tokens/:address/transactions` - Get transaction history for a token
- `GET /api/tokens/owner/:address` - Get token accounts for a specific owner
- `POST /api/tokens` - Create a new token
- `POST /api/tokens/transfer` - Prepare token transfer transaction
- `POST /api/tokens/mint` - Mint additional tokens
- `POST /api/tokens/burn` - Burn tokens
- `POST /api/tokens/transactions/confirm` - Confirm transaction with signature

### Wallet Management
- `GET /api/wallet/balance/:address` - Get wallet SOL balance
- `POST /api/wallet/airdrop` - Request SOL airdrop (devnet/testnet only)

## 🔒 Security Features

- **Client-side Signing**: All transactions are signed on the client side
- **No Private Key Storage**: Private keys never leave the user's wallet
- **Input Validation**: Comprehensive server-side validation
- **CORS Protection**: Proper CORS configuration for production
- **Environment Security**: Sensitive data stored in environment variables
- **Error Handling**: Robust error handling with retry logic

## 🌟 Production Features

- **Multi-Network Support**: Switch between devnet, testnet, and mainnet
- **Token Metadata**: Rich metadata support with social links
- **Authority Management**: Configure mint and freeze authorities
- **Transaction Retry Logic**: Robust transaction handling with retries
- **Rate Limiting Protection**: Built-in protection against API rate limits
- **Database Optimization**: Efficient MongoDB queries with proper indexing
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Deployment

This application is production-ready and optimized for Vercel deployment. The deployment includes:

- **Serverless Functions**: Optimized for Vercel's serverless architecture
- **Static Site Generation**: Pre-built React application for fast loading
- **Environment Management**: Secure environment variable handling
- **Database Integration**: MongoDB Atlas integration
- **CORS Configuration**: Proper cross-origin resource sharing setup

Follow the detailed [**DEPLOYMENT_GUIDE.md**](./DEPLOYMENT_GUIDE.md) for step-by-step deployment instructions.

## 🔧 Performance Optimizations

- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Smart caching for frequently accessed data
- **Bundle Optimization**: Optimized React build with code splitting
- **RPC Load Balancing**: Multiple Solana RPC endpoints for reliability
- **Error Recovery**: Automatic retry mechanisms for failed requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Issues**: Report bugs or request features via GitHub Issues
- **Solana Docs**: [Solana Documentation](https://docs.solana.com/)
- **SPL Token**: [SPL Token Documentation](https://spl.solana.com/token)

## 🙏 Acknowledgments

- Solana Foundation for the excellent blockchain infrastructure
- Material-UI team for the beautiful component library
- Solana Wallet Adapter team for seamless wallet integration
- MongoDB for reliable database services
- Vercel for excellent deployment platform

---

**Ready for Production** ✅ | **Vercel Optimized** ⚡ | **Security First** 🔒