import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Tooltip,
  Fab,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  Token as TokenIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Add as AddIcon,
  Send as SendIcon,
  LocalFireDepartment as BurnIcon,
  AccountBalance as MintIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  AddCircleOutline as AddCircleOutlineIcon,
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { getAssociatedTokenAccount } from '../utils/tokenUtils';
import { Connection } from '@solana/web3.js';

// Components
import TokenList from '../components/token/TokenList';
import ConnectWallet from '../components/common/ConnectWallet';
import PageHeader from '../components/common/PageHeader';
import TokenTransferDialog from '../components/token/TokenTransferDialog';
import TokenMintDialog from '../components/token/TokenMintDialog';
import TokenBurnDialog from '../components/token/TokenBurnDialog';

// Token Card Component
const TokenCard = ({ token, onMenuClick, onAction }) => {
  const navigate = useNavigate();

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatSupply = (supply, decimals = 9) => {
    if (!supply) return '0';
    const actualSupply = supply / Math.pow(10, decimals);
    return actualSupply.toLocaleString();
  };

  const getTokenInitials = (name, symbol) => {
    if (symbol) return symbol.slice(0, 2).toUpperCase();
    if (name) return name.slice(0, 2).toUpperCase();
    return 'TK';
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            sx={{ 
              bgcolor: 'primary.main',
              width: 48,
              height: 48,
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
            src={token.image}
          >
            {getTokenInitials(token.name, token.symbol)}
          </Avatar>
          <IconButton 
            size="small" 
            onClick={(e) => onMenuClick(e, token)}
            sx={{ 
              '&:hover': { 
                bgcolor: 'action.hover' 
              } 
            }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>
        
        <Typography 
          variant="h6" 
          component="h2" 
          gutterBottom
          sx={{ 
            cursor: 'pointer',
            '&:hover': { color: 'primary.main' }
          }}
          onClick={() => navigate(`/token/${token.address}`)}
        >
          {token.name || 'Unnamed Token'}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Chip 
            label={token.symbol || 'N/A'} 
            size="small" 
            color="primary"
            variant="outlined"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={`${token.decimals || 9} decimals`} 
            size="small" 
            variant="outlined" 
          />
        </Box>
        
        {token.description && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {token.description}
          </Typography>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Supply:</strong> {formatSupply(token.supply, token.decimals)}
          </Typography>
          {token.balance && (
            <Typography variant="body2" color="text.secondary">
              <strong>Your Balance:</strong> {formatSupply(token.balance, token.decimals)}
            </Typography>
          )}
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            bgcolor: 'grey.100',
            p: 1,
            borderRadius: 1,
          }}
        >
          {token.address?.slice(0, 8)}...{token.address?.slice(-8)}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, pb: 2 }}>
        <Button 
          size="small" 
          onClick={() => copyToClipboard(token.address)}
          startIcon={<CopyIcon />}
        >
          Copy
        </Button>
        <Box>
          <Tooltip title="View on Explorer">
            <IconButton 
              size="small" 
              onClick={() => window.open(`https://explorer.solana.com/address/${token.address}`, '_blank')}
            >
              <LaunchIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
  );
};

// Simple in-memory cache
const tokenCache = new Map();
const CACHE_EXPIRATION = 5 * 60 * 1000; // 5 minutes

const TokenDashboard = () => {
  const { connected, publicKey, wallet, network } = useWallet();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedToken, setSelectedToken] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', token: null });
  const [anchorEl, setAnchorEl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredTokens, setFilteredTokens] = useState([]);
  
  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [burnDialogOpen, setBurnDialogOpen] = useState(false);
  const [transferData, setTransferData] = useState({ recipient: '', amount: '' });
  const [mintData, setMintData] = useState({ amount: '', recipient: '' });
  const [burnData, setBurnData] = useState({ amount: '' });
  const { setVisible } = useWalletModal();

  // Fetch user's tokens
  const fetchUserTokens = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    setError('');

    try {
      console.log(`Fetching tokens for owner: ${publicKey.toString()} on network: ${network}`);
      
      const response = await axios.get(`/api/tokens/owner/${publicKey.toString()}?network=${network}`, {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Token accounts response:', response.status, response.data);
      const tokens = response.data.tokens || [];
      console.log(`Found ${tokens.length} token accounts`);

      if (tokens.length === 0) {
        console.log('No tokens found for this wallet');
        setTokens([]);
        setFilteredTokens([]);
        return;
      }

      // Fetch mint info for each token with better error handling
      const tokensWithMintInfo = await Promise.allSettled(tokens.map(async (token) => {
        if (!token.mint || token.mint.length < 32) {
          console.warn('Skipping invalid token:', token);
          return null;
        }
        
        // Check cache first
        const cacheKey = `${token.mint}-${network}`;
        const cached = tokenCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRATION)) {
          console.log(`Using cached data for: ${token.mint}`);
          return { ...token, ...cached.data, address: token.mint, balance: token.amount };
        }

        try {
          console.log(`Fetching mint info for: ${token.mint}`);
          const mintInfoRes = await axios.get(`/api/tokens/${token.mint}?network=${network}`, {
            timeout: 15000, // 15 second timeout
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (mintInfoRes.data) {
            console.log(`Mint info fetched successfully for: ${token.mint}`);
            const mergedToken = { ...token, ...mintInfoRes.data, address: token.mint, balance: token.amount };
            tokenCache.set(cacheKey, { data: mergedToken, timestamp: Date.now() });
            return mergedToken;
          } else {
            console.warn(`Empty response for mint info: ${token.mint}`);
            return { ...token, address: token.mint, balance: token.amount };
          }
        } catch (e) {
          console.error(`Failed to fetch mint info for ${token.mint}:`, {
            message: e.message || 'Unknown error',
            status: e.response?.status,
            statusText: e.response?.statusText,
            data: e.response?.data,
            code: e.code
          });
          
          // Return basic token info as fallback
          return {
            ...token,
            address: token.mint,
            balance: token.amount,
            name: token.name || 'Unknown Token',
            symbol: token.symbol || 'UNKNOWN',
            decimals: token.decimals || 9
          };
        }
      }));

      // Process results from Promise.allSettled
      const validTokens = tokensWithMintInfo
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      console.log(`Processed ${validTokens.length} valid tokens out of ${tokens.length} total`);
      setTokens(validTokens);
      setFilteredTokens(validTokens);
      
    } catch (error) {
      console.error('Error fetching tokens:', {
        message: error.message || 'Unknown error',
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code,
        stack: error.stack
      });
      
      let errorMessage = 'Failed to fetch tokens. Please try again.';
      
      if (error.response) {
        const status = error.response.status;
        if (status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (status === 408) {
          errorMessage = 'Request timeout. Please check your connection and try again.';
        } else if (status === 500) {
          errorMessage = 'Server error. Please try again in a moment.';
        } else if (status === 400) {
          errorMessage = 'Invalid wallet address. Please check your wallet connection.';
        }
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Request timeout. Please check your connection and try again.';
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey, network]);

  // Refresh tokens
  const handleRefresh = async () => {
    setRefreshing(true);
    tokenCache.clear(); // Clear cache on manual refresh
    await fetchUserTokens();
    setRefreshing(false);
  };

  // Fetch user's tokens when wallet is connected
  useEffect(() => {
    if (connected && publicKey) {
      fetchUserTokens();
    } else {
      setTokens([]);
      setFilteredTokens([]);
    }
  }, [connected, publicKey, fetchUserTokens]);

  // Filter tokens based on search query
  const handleSearch = (e) => {
    const searchTerm = e.target.value;
    setSearchTerm(searchTerm);
    
    if (searchTerm.trim() === '') {
      setFilteredTokens(tokens);
    } else {
      const filtered = tokens.filter(token => 
        token.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.symbol?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredTokens(filtered);
    }
  };

  // Handle menu actions
  const handleMenuClick = (event, token) => {
    setAnchorEl(event.currentTarget);
    setSelectedToken(token);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedToken(null);
  };

  // Handle token actions
  const handleTokenAction = (type, token) => {
    setSelectedToken(token);
    if (type === 'transfer') {
      // Only allow transfer if the connected wallet owns the token
      if (token.owner && publicKey && token.owner !== publicKey.toString()) {
        alert('You can only transfer tokens you own with your connected wallet.');
        return;
      }
      setTransferData({ recipient: '', amount: '' });
      setTransferDialogOpen(true);
    } else if (type === 'mint') {
      setMintData({ amount: '', recipient: '' });
      setMintDialogOpen(true);
    } else if (type === 'burn') {
      setBurnData({ amount: '' });
      setBurnDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCloseDialog = () => {
    setTransferDialogOpen(false);
    setMintDialogOpen(false);
    setBurnDialogOpen(false);
    setSelectedToken(null);
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const confirmTransaction = async (signature, type, amount, tokenAddress) => {
    try {
      await fetch('/api/tokens/transactions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: tokenAddress,
          signature,
          type,
          amount: amount.toString(),
          network,
          meta: { confirmedAt: new Date().toISOString() }
        })
      });
    } catch (err) {
      console.error('Error confirming transaction:', err);
    }
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    setVisible(true);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Format token supply with decimals
  const formatTokenSupply = (supply, decimals) => {
    if (!supply) return '0';
    const divisor = Math.pow(10, decimals);
    return (supply / divisor).toLocaleString('en-US', {
      maximumFractionDigits: decimals,
    });
  };

  // Handle mint submission
  const handleMintSubmit = async (mintData) => {
    if (!publicKey || !selectedToken) return alert('Wallet not connected or no token selected.');
    try {
      const destinationAccount = await getAssociatedTokenAccount(selectedToken.address, publicKey.toString());
      const { data } = await axios.post('/api/tokens/mint', {
        ...mintData,
        tokenMint: selectedToken.address,
        destinationAccount,
        decimals: selectedToken.decimals,
        mintAuthority: publicKey.toString(),
        network,
      });
      const txBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(txBuffer);
      const connection = new Connection(
        network === 'mainnet-beta' 
          ? 'https://api.mainnet-beta.solana.com' 
          : network === 'testnet'
            ? 'https://api.testnet.solana.com'
            : 'https://api.devnet.solana.com'
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      const signedTx = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Confirm the transaction in our database
      await confirmTransaction(signature, 'mint', parseFloat(mintData.amount), selectedToken.address);
      
      alert(`Mint successful! Signature: ${signature}`);
      handleCloseDialog();
      tokenCache.clear(); // Force cache clear
      await fetchUserTokens(); // Force fresh fetch
    } catch (error) {
      alert(`Mint failed: ${error.message}`);
    }
  };

  // Handle burn submission
  const handleBurnSubmit = async (burnData) => {
    if (!publicKey || !selectedToken) return alert('Wallet not connected or no token selected.');
    try {
      const tokenAccount = await getAssociatedTokenAccount(selectedToken.address, publicKey.toString());
      const { data } = await axios.post('/api/tokens/burn', {
        ...burnData,
        tokenMint: selectedToken.address,
        tokenAccount,
        decimals: selectedToken.decimals,
        owner: publicKey.toString(),
        network,
      });
      const txBuffer = Buffer.from(data.transaction, 'base64');
      const transaction = Transaction.from(txBuffer);
      const connection = new Connection(
        network === 'mainnet-beta' 
          ? 'https://api.mainnet-beta.solana.com' 
          : network === 'testnet'
            ? 'https://api.testnet.solana.com'
            : 'https://api.devnet.solana.com'
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      const signedTx = await window.solana.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Confirm the transaction in our database
      await confirmTransaction(signature, 'burn', parseFloat(burnData.amount), selectedToken.address);
      
      alert(`Burn successful! Signature: ${signature}`);
      handleCloseDialog();
      tokenCache.clear(); // Force cache clear
      await fetchUserTokens(); // Force fresh fetch
    } catch (error) {
      alert(`Burn failed: ${error.message}`);
    }
  };

  // Unified transfer handler for dashboard
  const handleTransferSubmit = async (transferData) => {
    if (!publicKey || !selectedToken) {
      alert('Wallet not connected or no token selected.');
      return;
    }
    // Only allow transfer if the connected wallet owns the token
    if (selectedToken.owner && publicKey && selectedToken.owner !== publicKey.toString()) {
      alert('You can only transfer tokens you own with your connected wallet.');
      return;
    }
    try {
      // 1. Prepare transaction on the server
      const { data } = await axios.post('/api/tokens/transfer', {
        ...transferData,
        sender: publicKey.toString(),
        tokenMint: selectedToken.address,
        decimals: selectedToken.decimals,
        network,
      });
      // 2. Deserialize and sign/send the transaction using wallet adapter
      const txBuffer = Buffer.from(data.transaction, 'base64');
      const { Transaction } = await import('@solana/web3.js');
      const transaction = Transaction.from(txBuffer);
      const connection = new Connection(
        network === 'mainnet-beta' 
          ? 'https://api.mainnet-beta.solana.com' 
          : network === 'testnet'
            ? 'https://api.testnet.solana.com'
            : 'https://api.devnet.solana.com'
      );
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      // Use wallet adapter's sendTransaction
      const signature = await wallet.sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'finalized'); // Wait for full finalization
      
      // Confirm the transaction in our database
      await confirmTransaction(signature, 'transfer', parseFloat(transferData.amount), selectedToken.address);
      
      alert(`Transfer successful! Signature: ${signature}`);
      handleCloseDialog();
      setTimeout(async () => {
        tokenCache.clear(); // Force cache clear
        await fetchUserTokens(); // Force fresh fetch
      }, 3000);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        alert('Rate limit exceeded. Please try again in a few seconds.');
      } else {
        alert(`Transfer failed: ${error.message}`);
      }
    }
  };

  // Render wallet connection prompt
  const renderWalletPrompt = () => (
    <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
      <AccountBalanceWalletIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Connect Your Wallet
      </Typography>
      <Typography variant="body1" paragraph>
        Connect your Solana wallet to view your tokens and manage them.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleConnectWallet}
        sx={{ mt: 2 }}
      >
        Connect Wallet
      </Button>
    </Paper>
  );

  // Render token cards
  const renderTokenCards = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      );
    }

    if (filteredTokens.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            No Tokens Found
          </Typography>
          <Typography variant="body1" paragraph>
            {searchTerm.trim() !== '' 
              ? 'No tokens match your search criteria.'
              : 'You haven\'t created any tokens yet.'}
          </Typography>
          <Button
            component={Link}
            to="/create-token"
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            sx={{ mt: 2 }}
          >
            Create New Token
          </Button>
        </Paper>
      );
    }

    return (
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {filteredTokens.map((token) => (
          <Grid item xs={12} sm={6} md={4} key={token.address || token.tokenAddress}>
            <TokenCard 
              token={{ ...token, address: token.address || token.tokenAddress, balance: token.balance }} 
              onMenuClick={handleMenuClick}
              onAction={handleTokenAction}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  // Defensive dialog openers
  const handleTransfer = (token) => {
    if (!token || token.decimals == null) {
      alert('Token mint info is missing. Please try again later.');
      return;
    }
    setSelectedToken(token);
    setTransferDialogOpen(true);
  };
  const handleMint = (token) => {
    if (!token || token.decimals == null) {
      alert('Token mint info is missing. Please try again later.');
      return;
    }
    setSelectedToken(token);
    setMintDialogOpen(true);
  };
  const handleBurn = (token) => {
    if (!token || token.decimals == null) {
      alert('Token mint info is missing. Please try again later.');
      return;
    }
    setSelectedToken(token);
    setBurnDialogOpen(true);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Token Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your Solana tokens and track your portfolio
            </Typography>
          </Box>
          {connected && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Refresh tokens">
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Badge badgeContent={tokens.length} color="primary">
                <TokenIcon />
              </Badge>
            </Box>
          )}
        </Box>

        {!connected ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <TokenIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Please connect your wallet to view and manage your tokens.
            </Typography>
            <Button variant="contained" color="primary" size="large">
              Connect Wallet
            </Button>
          </Paper>
        ) : (
          <>
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Search tokens by name, symbol, or address..."
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ flex: 1, minWidth: 300 }}
              />
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-token')}
                size="large"
              >
                Create Token
              </Button>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={60} />
              </Box>
            ) : filteredTokens.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <TokenIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {searchTerm ? 'No Tokens Found' : 'No Tokens Yet'}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {searchTerm
                    ? 'No tokens match your search criteria. Try adjusting your search terms.'
                    : 'You haven\'t created any tokens yet. Create your first token to get started!'}
                </Typography>
                {!searchTerm && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/create-token')}
                    size="large"
                  >
                    Create Your First Token
                  </Button>
                )}
              </Paper>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredTokens.length} of {tokens.length} tokens
                  </Typography>
                </Box>
                <Grid container spacing={3}>
                  {filteredTokens.map((token) => (
                    <Grid item xs={12} sm={6} md={4} key={token.address || token.tokenAddress}>
                      <TokenCard 
                        token={{ ...token, address: token.address || token.tokenAddress, balance: token.balance }} 
                        onMenuClick={handleMenuClick}
                        onAction={handleTokenAction}
                      />
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </>
        )}

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => copyToClipboard(selectedToken?.address)}>
            <CopyIcon sx={{ mr: 1 }} />
            Copy Address
          </MenuItem>
          <MenuItem onClick={() => handleTokenAction('transfer', selectedToken)}>
            <SendIcon sx={{ mr: 1 }} />
            Transfer
          </MenuItem>
          <MenuItem onClick={() => handleTokenAction('mint', selectedToken)}>
            <MintIcon sx={{ mr: 1 }} />
            Mint More
          </MenuItem>
          <MenuItem onClick={() => handleTokenAction('burn', selectedToken)}>
            <BurnIcon sx={{ mr: 1 }} />
            Burn Tokens
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => window.open(`https://explorer.solana.com/address/${selectedToken?.address}${network === 'mainnet-beta' ? '' : `?cluster=${network}`}`, '_blank')}>
            <LaunchIcon sx={{ mr: 1 }} />
            View on Explorer
          </MenuItem>
        </Menu>

        {/* Action Dialogs */}
        {/* Transfer Dialog */}
        <TokenTransferDialog
          open={transferDialogOpen}
          onClose={handleCloseDialog}
          token={selectedToken}
          onTransfer={handleTransferSubmit}
        />
        
        {/* Mint Dialog */}
        <TokenMintDialog
          open={mintDialogOpen}
          onClose={() => setMintDialogOpen(false)}
          token={selectedToken}
          onMint={handleMintSubmit}
          mintData={mintData}
          setMintData={setMintData}
        />
        
        {/* Burn Dialog */}
        <TokenBurnDialog
          open={burnDialogOpen}
          onClose={() => setBurnDialogOpen(false)}
          token={selectedToken}
          onBurn={handleBurnSubmit}
          burnData={burnData}
          setBurnData={setBurnData}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="create token"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => navigate('/create-token')}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
};

export default TokenDashboard;