import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  Stack
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Send as SendIcon,
  LocalFireDepartment as BurnIcon,
  Add as MintIcon,
  Refresh as RefreshIcon,
  Language as WebsiteIcon,
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
  SwapHoriz as TransferIcon,
  History as HistoryIcon,
  Error as ErrorIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useWallet } from '../contexts/WalletContext';
import { getAssociatedTokenAccount } from '../utils/tokenUtils';
import axios from 'axios';
import { Transaction, Connection } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

const TokenDetails = () => {
  const { address } = useParams();
  const navigate = useNavigate();
  const { publicKey, connected, network, wallet } = useWallet();
  
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [holders, setHolders] = useState([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPagination, setTransactionPagination] = useState(null);
  
  // Dialog states
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [burnDialogOpen, setBurnDialogOpen] = useState(false);
  
  // Form data
  const [transferData, setTransferData] = useState({ recipient: '', amount: '' });
  const [mintData, setMintData] = useState({ amount: '', recipient: '' });
  const [burnData, setBurnData] = useState({ amount: '' });

  const [userTokenBalance, setUserTokenBalance] = useState(null);

  useEffect(() => {
    if (address && publicKey) {
      fetchTokenDetails();
      fetchUserTokenBalance();
      fetchTransactionHistory();
    }
  }, [address, publicKey, network]);

  const fetchTokenDetails = async () => {
    try {
      setLoading(true);
      setError(''); // Reset error state on new fetch
      const response = await fetch(`/api/tokens/${address}?network=${network}`);
      
      if (response.status === 404) {
        // Handle the specific "Not Found" case
        setError('Token not found. Please check the address and try again.');
        setToken(null); // Clear any old token data
        return;
      }

      if (response.status === 429) {
        // Handle rate limiting
        setError('Too many requests to the Solana network. Please wait a moment and try again.');
        return;
      }

      if (!response.ok) {
        // Handle other server errors (like 500)
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const tokenData = await response.json();
      setToken(tokenData);
      
      // Fetch holders data separately
      await fetchTokenHolders();
    } catch (err) {
      console.error('Error fetching token details:', err);
      // Set a generic error for network issues or other unexpected errors
      setError('An error occurred while fetching token details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTokenHolders = async () => {
    try {
      setHoldersLoading(true);
      const response = await fetch(`/api/tokens/${address}/holders?network=${network}`);
      if (response.ok) {
        const data = await response.json();
        setHolders(data.holders || []);
      } else {
        console.error('Failed to fetch holders:', response.status);
        setHolders([]);
        // Don't show error to user for holders, just log it
      }
    } catch (err) {
      console.error('Error fetching token holders:', err);
      setHolders([]);
      // Don't show error to user for holders, just log it
    } finally {
      setHoldersLoading(false);
    }
  };

  const fetchTransactionHistory = async (page = 1) => {
    try {
      setTransactionsLoading(true);
      console.log(`Fetching transaction history for ${address} on network ${network}, page ${page}`);
      
      const response = await fetch(`/api/tokens/${address}/transactions?page=${page}&limit=20&network=${network}`);
      
      if (response.status === 404) {
        console.log('No transaction history found');
        setTransactions([]);
        setTransactionPagination({ page: 1, pages: 0, total: 0 });
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.transactions?.length || 0} transactions`);
      
      setTransactions(data.transactions || []);
      setTransactionPagination(data.pagination || { page: 1, pages: 0, total: 0 });
      setTransactionPage(page);
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setTransactions([]);
      setTransactionPagination({ page: 1, pages: 0, total: 0 });
    } finally {
      setTransactionsLoading(false);
    }
  };

  const fetchUserTokenBalance = async () => {
    try {
      if (!address || !publicKey) return;
      const tokenAccount = await getAssociatedTokenAccount(address, publicKey.toString());
      // Use getTokenInfo to fetch all token accounts for the user and find the balance for this mint
      const res = await fetch(`/api/tokens/owner/${publicKey.toString()}?network=${network}`);
      const data = await res.json();
      const account = data.tokens.find(t => t.mint === address && t.address === tokenAccount);
      setUserTokenBalance(account ? parseFloat(account.amount) / Math.pow(10, account.decimals) : 0);
    } catch (err) {
      setUserTokenBalance(0);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const openExplorer = (address) => {
    const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
    window.open(`https://explorer.solana.com/address/${address}${clusterParam}`, '_blank');
  };

  const confirmTransaction = async (signature, type, amount) => {
    try {
      console.log(`Confirming transaction: ${signature}, type: ${type}, amount: ${amount}, network: ${network}`);
      
      const response = await fetch('/api/tokens/transactions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mint: address,
          signature,
          type,
          amount: amount.toString(),
          network,
          meta: { confirmedAt: new Date().toISOString() }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to confirm transaction: ${errorData.error || response.statusText}`);
      }
      
      console.log('Transaction confirmed successfully');
      
      // Refresh transaction history after confirmation
      setTimeout(() => fetchTransactionHistory(), 2000);
    } catch (err) {
      console.error('Error confirming transaction:', err);
      // Try to refresh transaction history anyway
      setTimeout(() => fetchTransactionHistory(), 2000);
    }
  };

  const formatSupply = (supply, decimals = 9) => {
    if (!supply) return '0';
    const actualSupply = supply / Math.pow(10, decimals);
    return actualSupply.toLocaleString();
  };

  const formatAddress = (addr, length = 8) => {
    if (!addr) return '';
    return `${addr.slice(0, length)}...${addr.slice(-length)}`;
  };

  const formatTransactionAmount = (amount, decimals, symbol) => {
    try {
      if (!amount || decimals === undefined) return 'N/A';
      
      // Handle both string and number amounts
      const rawAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      const decimalValue = typeof decimals === 'string' ? parseInt(decimals) : decimals;
      
      if (isNaN(rawAmount) || isNaN(decimalValue)) return 'N/A';
      
      const calculatedAmount = rawAmount / Math.pow(10, decimalValue);
      
      if (calculatedAmount <= 0) return 'N/A';
      
      return `${calculatedAmount.toLocaleString()} ${symbol}`;
    } catch (error) {
      console.error('Error formatting transaction amount:', error);
      return amount ? `${amount} (raw)` : 'N/A';
    }
  };

  // Handler for minting tokens
  const handleMint = async () => {
    try {
      if (!token || !publicKey) throw new Error('Token or wallet not available');
      if (!wallet) throw new Error('Wallet not connected. Please connect your wallet and try again.');
      
      const mintAmount = parseFloat(mintData.amount);
      if (isNaN(mintAmount) || mintAmount <= 0) throw new Error('Invalid amount');
      
      // Get destination account (either specified or default to current wallet)
      const destinationAddress = mintData.recipient || publicKey.toString();
      const destinationAccount = await getAssociatedTokenAccount(token.address, destinationAddress);
      
      // Prepare mint transaction on backend
      const response = await axios.post('/api/tokens/mint', {
        tokenMint: token.address,
        destinationAccount,
        amount: mintAmount,
        decimals: token.decimals,
        mintAuthority: publicKey.toString(),
        network,
      });
      
      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(response.data.transaction, 'base64')
      );
      
      // Get connection from wallet context
      const connection = new Connection(clusterApiUrl(network));
      
      // Set fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Sign and send transaction with retry logic
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing. Please use a compatible wallet.');
      }
      
      const signedTx = await wallet.signTransaction(transaction);
      
      let signature;
      let retries = 3;
      
      while (retries > 0) {
        try {
          // Get a fresh blockhash for each retry
          if (retries < 3) {
            const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = newBlockhash;
            if (!wallet.signTransaction) {
              throw new Error('Wallet does not support transaction signing.');
            }
            const newSignedTx = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(newSignedTx.serialize());
          } else {
            signature = await connection.sendRawTransaction(signedTx.serialize());
          }
          
          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');
          
          // Success - break out of retry loop
          break;
        } catch (err) {
          retries--;
          console.log(`Transaction attempt failed, retries left: ${retries}`);
          
          // If it's already processed or we're out of retries, throw the error
          if (retries === 0 || !err.message.includes('already been processed')) {
            throw err;
          }
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update UI
      setMintDialogOpen(false);
      setMintData({ amount: '', recipient: '' });
      
      // Confirm transaction in backend
      await confirmTransaction(signature, 'mint', mintAmount);
      
      // Refresh token details
      await fetchTokenDetails();
      await fetchUserTokenBalance();
      
      // Show success message
      alert(`Successfully minted ${mintAmount} ${token.symbol}`);
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert(`Error: ${error.message || 'Failed to mint tokens'}`);
    }
  };

  // Handler for burning tokens
  const handleBurn = async () => {
    try {
      if (!token || !publicKey) throw new Error('Token or wallet not available');
      if (!wallet) throw new Error('Wallet not connected. Please connect your wallet and try again.');
      
      const burnAmount = parseFloat(burnData.amount);
      if (isNaN(burnAmount) || burnAmount <= 0) throw new Error('Invalid amount');
      
      // Get token account
      const tokenAccount = await getAssociatedTokenAccount(token.address, publicKey.toString());
      
      // Prepare burn transaction on backend
      const response = await axios.post('/api/tokens/burn', {
        tokenMint: token.address,
        tokenAccount,
        amount: burnAmount,
        decimals: token.decimals,
        owner: publicKey.toString(),
        network,
      });
      
      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(response.data.transaction, 'base64')
      );
      
      // Get connection from wallet context
      const connection = new Connection(clusterApiUrl(network));
      
      // Set fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Sign and send transaction with retry logic
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing. Please use a compatible wallet.');
      }
      
      const signedTx = await wallet.signTransaction(transaction);
      
      let signature;
      let retries = 3;
      
      while (retries > 0) {
        try {
          // Get a fresh blockhash for each retry
          if (retries < 3) {
            const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = newBlockhash;
            if (!wallet.signTransaction) {
              throw new Error('Wallet does not support transaction signing.');
            }
            const newSignedTx = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(newSignedTx.serialize());
          } else {
            signature = await connection.sendRawTransaction(signedTx.serialize());
          }
          
          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');
          
          // Success - break out of retry loop
          break;
        } catch (err) {
          retries--;
          console.log(`Transaction attempt failed, retries left: ${retries}`);
          
          // If it's already processed or we're out of retries, throw the error
          if (retries === 0 || !err.message.includes('already been processed')) {
            throw err;
          }
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update UI
      setBurnDialogOpen(false);
      setBurnData({ amount: '' });
      
      // Confirm transaction in backend
      await confirmTransaction(signature, 'burn', burnAmount);
      
      // Refresh token details
      await fetchTokenDetails();
      await fetchUserTokenBalance();
      
      // Show success message
      alert(`Successfully burned ${burnAmount} ${token.symbol}`);
    } catch (error) {
      console.error('Error burning tokens:', error);
      alert(`Error: ${error.message || 'Failed to burn tokens'}`);
    }
  };

  // Handler for transferring tokens
  const handleTransfer = async () => {
    try {
      if (!token || !publicKey) throw new Error('Token or wallet not available');
      if (!wallet) throw new Error('Wallet not connected. Please connect your wallet and try again.');
      
      const transferAmount = parseFloat(transferData.amount);
      const recipient = transferData.recipient;
      
      if (isNaN(transferAmount) || transferAmount <= 0) throw new Error('Invalid amount');
      if (!recipient) throw new Error('Recipient address is required');
      
      // Prepare transfer transaction on backend
      const response = await axios.post('/api/tokens/transfer', {
        tokenMint: token.address,
        sender: publicKey.toString(),
        recipient,
        amount: transferAmount,
        decimals: token.decimals,
        network,
      });
      
      // Deserialize transaction
      const transaction = Transaction.from(
        Buffer.from(response.data.transaction, 'base64')
      );
      
      // Get connection from wallet context
      const connection = new Connection(clusterApiUrl(network));
      
      // Set fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      
      // Sign and send transaction with retry logic
      if (!wallet.signTransaction) {
        throw new Error('Wallet does not support transaction signing. Please use a compatible wallet.');
      }
      
      const signedTx = await wallet.signTransaction(transaction);
      
      let signature;
      let retries = 3;
      
      while (retries > 0) {
        try {
          // Get a fresh blockhash for each retry
          if (retries < 3) {
            const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = newBlockhash;
            if (!wallet.signTransaction) {
              throw new Error('Wallet does not support transaction signing.');
            }
            const newSignedTx = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(newSignedTx.serialize());
          } else {
            signature = await connection.sendRawTransaction(signedTx.serialize());
          }
          
          // Wait for confirmation
          await connection.confirmTransaction(signature, 'confirmed');
          
          // Success - break out of retry loop
          break;
        } catch (err) {
          retries--;
          console.log(`Transaction attempt failed, retries left: ${retries}`);
          
          // If it's already processed or we're out of retries, throw the error
          if (retries === 0 || !err.message.includes('already been processed')) {
            throw err;
          }
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Update UI
      setTransferDialogOpen(false);
      setTransferData({ recipient: '', amount: '' });
      
      // Confirm transaction in backend
      await confirmTransaction(signature, 'transfer', transferAmount);
      
      // Refresh token details
      await fetchTokenDetails();
      await fetchUserTokenBalance();
      
      // Show success message
      alert(`Successfully transferred ${transferAmount} ${token.symbol} to ${recipient}`);
    } catch (error) {
      console.error('Error transferring tokens:', error);
      alert(`Error: ${error.message || 'Failed to transfer tokens'}`);
    }
  };

  // Retry handler for rate limited requests
  const handleRetry = () => {
    setError('');
    fetchTokenDetails();
    fetchTransactionHistory();
  };

  const TabPanel = ({ children, value, index, ...other }) => {
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`token-tabpanel-${index}`}
        aria-labelledby={`token-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  };

  // Defensive dialog openers
  const openTransferDialog = () => {
    if (!token || token.decimals == null) {
      setError('Token mint info is missing. Please try again later.');
      return;
    }
    setTransferDialogOpen(true);
  };
  const openMintDialog = () => {
    if (!token || token.decimals == null) {
      setError('Token mint info is missing. Please try again later.');
      return;
    }
    setMintDialogOpen(true);
  };
  const openBurnDialog = () => {
    if (!token || token.decimals == null) {
      setError('Token mint info is missing. Please try again later.');
      return;
    }
    setBurnDialogOpen(true);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {error.includes('Too many requests') ? 
            'The Solana network is experiencing high traffic. Please try again in a moment.' : 
            'Please check the token address and try again.'}
        </Typography>
        <Button 
          variant="contained" 
          onClick={handleRetry}
          startIcon={<RefreshIcon />}
        >
          Retry
        </Button>
      </Paper>
    );
  }

  if (!token) {
    return (
      <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
        <Typography variant="h5">Token not found</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          The token you are looking for could not be found.
        </Typography>
        <Button 
          variant="contained" 
          component={Link} 
          to="/"
          startIcon={<HomeIcon />}
        >
          Go Home
        </Button>
      </Paper>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        
        <Paper sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{ width: 80, height: 80, fontSize: '2rem' }}
                src={token.image}
              >
                {token.symbol?.slice(0, 2).toUpperCase() || 'TK'}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {token.name || 'Unnamed Token'}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Chip label={token.symbol} color="primary" sx={{ mr: 1 }} />
                <Chip label={`${token.decimals} decimals`} variant="outlined" sx={{ mr: 1 }} />
                <Chip label={(token.network || process.env.REACT_APP_SOLANA_NETWORK || 'devnet')} variant="outlined" />
              </Box>
              <Typography variant="body1" color="text.secondary">
                {token.description || 'No description available'}
              </Typography>
            </Grid>
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Refresh">
                  <IconButton onClick={fetchTokenDetails}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy Address">
                  <IconButton onClick={() => copyToClipboard(address)}>
                    <CopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View on Explorer">
                  <IconButton onClick={() => openExplorer(address)}>
                    <LaunchIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Token Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Supply
              </Typography>
              <Typography variant="h5">
                {formatSupply(token.supply, token.decimals)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Your Balance
              </Typography>
              <Typography variant="h5">
                {userTokenBalance !== null ? userTokenBalance : 0} {token.symbol}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Holders
              </Typography>
              <Typography variant="h5">
                {holders.length || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Market Cap
              </Typography>
              <Typography variant="h5">
                N/A
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      {connected && (
        <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={openTransferDialog}
            disabled={!token || token.decimals == null}
          >
            Transfer
          </Button>
          <Button
            variant="outlined"
            startIcon={<MintIcon />}
            onClick={openMintDialog}
            disabled={!token || token.decimals == null}
          >
            Mint
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<BurnIcon />}
            onClick={openBurnDialog}
            disabled={!token || token.decimals == null}
          >
            Burn
          </Button>
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Overview" />
          <Tab label="Holders" />
          <Tab label="Transactions" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Token Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Contract Address"
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {address}
                        </Typography>
                        <IconButton size="small" onClick={() => copyToClipboard(address)}>
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Decimals" secondary={token.decimals} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Network" secondary={token.network || 'devnet'} />
                </ListItem>
                {token.mintAuthority && (
                  <ListItem>
                    <ListItemText
                      primary="Mint Authority"
                      secondary={formatAddress(token.mintAuthority)}
                    />
                  </ListItem>
                )}
                {token.freezeAuthority && (
                  <ListItem>
                    <ListItemText
                      primary="Freeze Authority"
                      secondary={formatAddress(token.freezeAuthority)}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Social Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {token.website && (
                  <Link href={token.website} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WebsiteIcon />
                    Website
                  </Link>
                )}
                {token.twitter && (
                  <Link href={token.twitter} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TwitterIcon />
                    Twitter
                  </Link>
                )}
                {token.telegram && (
                  <Link href={token.telegram} target="_blank" rel="noopener" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TelegramIcon />
                    Telegram
                  </Link>
                )}
              </Box>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Token Holders ({holders.length})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchTokenHolders}
              disabled={holdersLoading}
            >
              Refresh
            </Button>
          </Box>
          {holdersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : holders.length > 0 ? (
            <>
              {/* Holders Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Holders
                    </Typography>
                    <Typography variant="h6">
                      {holders.length.toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Total Supply
                    </Typography>
                    <Typography variant="h6">
                      {formatSupply(token.supply, token.decimals)} {token.symbol}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Largest Holder
                    </Typography>
                    <Typography variant="h6">
                      {holders.length > 0 ? `${((parseFloat(holders[0].balance) / parseFloat(token.supply)) * 100).toFixed(2)}%` : 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Rank</TableCell>
                      <TableCell>Address</TableCell>
                      <TableCell align="right">Balance</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holders.map((holder, index) => {
                      const balance = parseFloat(holder.balance) / Math.pow(10, token.decimals);
                      const percentage = ((parseFloat(holder.balance) / parseFloat(token.supply)) * 100).toFixed(2);
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              #{index + 1}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatAddress(holder.address)}
                              </Typography>
                              <IconButton size="small" onClick={() => copyToClipboard(holder.address)}>
                                <CopyIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small" onClick={() => openExplorer(holder.address)}>
                                <LaunchIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {balance.toLocaleString()} {token.symbol}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {percentage}%
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" variant="body1">
                No holder information available
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                This token may not have any holders yet or the data is being loaded.
              </Typography>
            </Box>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Transaction History ({transactionPagination?.total || 0})
            </Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => fetchTransactionHistory(1)}
              disabled={transactionsLoading}
            >
              Refresh
            </Button>
          </Box>
          
          {transactionsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : transactions.length > 0 ? (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => {
                      const date = new Date(tx.timestamp).toLocaleString();
                      
                      const getTypeIcon = (type) => {
                        switch (type) {
                          case 'mint': return <MintIcon fontSize="small" />;
                          case 'burn': return <BurnIcon fontSize="small" />;
                          case 'transfer': return <TransferIcon fontSize="small" />;
                          default: return <HistoryIcon fontSize="small" />;
                        }
                      };

                      const getStatusChip = (signature) => {
                        if (signature) {
                          return <Chip label="Confirmed" color="success" size="small" />;
                        } else {
                          return <Chip label="Pending" color="warning" size="small" />;
                        }
                      };

                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getTypeIcon(tx.type)}
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {tx.type}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            {tx.from ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {formatAddress(tx.from)}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(tx.from)}>
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {tx.to ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                  {formatAddress(tx.to)}
                                </Typography>
                                <IconButton size="small" onClick={() => copyToClipboard(tx.to)}>
                                  <CopyIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {formatTransactionAmount(tx.amount, tx.decimals, token.symbol)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getStatusChip(tx.signature)}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {date}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {tx.signature && (
                                <Tooltip title="View on Explorer">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => openExplorer(tx.signature)}
                                  >
                                    <LaunchIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {tx.signature && (
                                <Tooltip title="Copy Signature">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => copyToClipboard(tx.signature)}
                                  >
                                    <CopyIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination */}
              {transactionPagination && transactionPagination.pages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Stack spacing={2}>
                    <Pagination 
                      count={transactionPagination.pages}
                      page={transactionPage}
                      onChange={(e, page) => fetchTransactionHistory(page)}
                      color="primary"
                    />
                  </Stack>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary" variant="body1">
                No transaction history available
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                This token has no recorded transactions yet. Transactions will appear here after minting, burning, or transferring tokens.
              </Typography>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => fetchTransactionHistory(1)}
                sx={{ mt: 2 }}
              >
                Refresh
              </Button>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onClose={() => setTransferDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transfer {token.symbol} Tokens</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Recipient Address"
            fullWidth
            variant="outlined"
            value={transferData.recipient}
            onChange={(e) => setTransferData({ ...transferData, recipient: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={transferData.amount}
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>

      {/* Mint Dialog */}
      <Dialog open={mintDialogOpen} onClose={() => setMintDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Mint {token.symbol} Tokens</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Mint"
            type="number"
            fullWidth
            variant="outlined"
            value={mintData.amount}
            onChange={(e) => setMintData({ ...mintData, amount: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Recipient Address (optional)"
            fullWidth
            variant="outlined"
            value={mintData.recipient}
            onChange={(e) => setMintData({ ...mintData, recipient: e.target.value })}
            helperText="Leave empty to mint to your wallet"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMintDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMint} variant="contained">Mint</Button>
        </DialogActions>
      </Dialog>

      {/* Burn Dialog */}
      <Dialog open={burnDialogOpen} onClose={() => setBurnDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Burn {token.symbol} Tokens</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Your Balance: {userTokenBalance !== null ? userTokenBalance : '...'} {token.symbol}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount to Burn"
            type="number"
            fullWidth
            variant="outlined"
            value={burnData.amount}
            onChange={(e) => setBurnData({ ...burnData, amount: e.target.value })}
          />
          <Alert severity="warning" sx={{ mt: 2 }}>
            Warning: Burning tokens permanently removes them from circulation. This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBurnDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBurn} variant="contained" color="error"
            disabled={
              !burnData.amount ||
              userTokenBalance === null ||
              parseFloat(burnData.amount) > userTokenBalance ||
              userTokenBalance === 0
            }
          >
            Burn
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TokenDetails;