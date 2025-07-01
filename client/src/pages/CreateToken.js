import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Info as InfoIcon,
  Security as SecurityIcon,
  Token as TokenIcon,
  Language as WebsiteIcon,
  Twitter as TwitterIcon,
  Telegram as TelegramIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import DiscordIcon from '../components/icons/DiscordIcon';
import { useWallet } from '../contexts/WalletContext';
import { useConnection, useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import axios from 'axios';
import { Transaction, Keypair } from '@solana/web3.js';

// Token creation steps
const steps = ['Connect Wallet', 'Token Details', 'Social & Metadata', 'Review & Deploy'];

const CreateToken = () => {
  const navigate = useNavigate();
  const { network } = useWallet();
  const { setVisible } = useWalletModal();
  
  const { connection } = useConnection();
  const wallet = useSolanaWallet();
  const { connected, publicKey } = wallet;

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    supply: 1000000,
    ownerWallet: '',
    mintAuthority: '',
    freezeAuthority: '',
    description: '',
    image: '',
    website: '',
    twitter: '',
    telegram: '',
    discord: '',
  });
  const [advancedMode, setAdvancedMode] = useState(false);

  // Update owner wallet when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      setTokenData(prev => ({
        ...prev,
        ownerWallet: publicKey.toString()
      }));
    }
  }, [connected, publicKey]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setTokenData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Navigation handlers
  const handleNext = () => {
    setError('');
    
    // Validation for each step
    if (activeStep === 0 && !connected) {
      setError('Please connect your wallet to continue');
      return;
    }
    
    if (activeStep === 1) {
      if (!tokenData.name || !tokenData.symbol || !tokenData.supply) {
        setError('Please fill in all required fields');
        return;
      }
      if (tokenData.symbol.length > 10) {
        setError('Token symbol must be 10 characters or less');
        return;
      }
    }
    
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  // Connect wallet handler
  const handleConnectWallet = () => {
    setVisible(true);
  };

  // Create token handler
  const handleCreateToken = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Generate the mint keypair on the frontend
      const mintKeypair = Keypair.generate();
      const mintPublicKey = mintKeypair.publicKey.toString();

      // 2. Get the prepared transaction from the backend (send mintPublicKey)
      const apiResponse = await axios.post('/api/tokens', {
        ...tokenData,
        ownerWallet: publicKey.toString(),
        mintAuthority: tokenData.mintAuthority || publicKey.toString(),
        freezeAuthority: tokenData.freezeAuthority || null,
        mintPublicKey, // send the mint public key to the backend
        network, // Include the current network
      });

      const { transaction: base64Transaction, mintAddress } = apiResponse.data;

      // 3. Deserialize the transaction
      const transaction = Transaction.from(Buffer.from(base64Transaction, 'base64'));

      // 4. Set a fresh blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;

      // 5. Partially sign with the mint keypair
      transaction.partialSign(mintKeypair);

      // 6. Sign and send with the wallet
      const signedTx = await wallet.signTransaction(transaction);

      // 7. Send with retry logic
      let signature;
      let retries = 3;
      
      while (retries > 0) {
        try {
          // Get a fresh blockhash for each retry
          if (retries < 3) {
            const { blockhash: newBlockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = newBlockhash;
            // Need to re-sign with new blockhash
            transaction.partialSign(mintKeypair);
            const newSignedTx = await wallet.signTransaction(transaction);
            signature = await connection.sendRawTransaction(newSignedTx.serialize());
          } else {
            signature = await connection.sendRawTransaction(signedTx.serialize());
          }
          
          // Wait for confirmation
          const confirmation = await connection.confirmTransaction(signature, 'confirmed');
          
          if (confirmation.value.err) {
            throw new Error(`Transaction failed: ${confirmation.value.err}`);
          }
          
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

      setSuccess(`Token created successfully! Signature: ${signature}`);

      // 8. Navigate to the new token's page after a delay
      setTimeout(() => {
        navigate(`/token/${mintAddress}`);
      }, 3000);

    } catch (error) {
      console.error('Error creating token:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create token. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Validation helpers
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getValidationStatus = () => {
    const required = tokenData.name && tokenData.symbol && tokenData.supply;
    const validUrls = !tokenData.website || isValidUrl(tokenData.website);
    return { required, validUrls };
  };

  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TokenIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Connect your Solana wallet to create and deploy your token
            </Typography>
            {!connected ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleConnectWallet}
                sx={{ minWidth: 200 }}
              >
                Connect Wallet
              </Button>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SecurityIcon fontSize="small" />
                    Wallet connected: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}
                  </Box>
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Balance: {wallet.balance} SOL | Network: {network}
                </Typography>
              </Box>
            )}
          </Box>
        );
      case 1:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TokenIcon color="primary" />
              Token Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Configure the basic properties of your token
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token Name"
                  name="name"
                  value={tokenData.name}
                  onChange={handleChange}
                  placeholder="e.g., My Awesome Token"
                  required
                  helperText="The full name of your token"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Token Symbol"
                  name="symbol"
                  value={tokenData.symbol}
                  onChange={(e) => setTokenData({ ...tokenData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., MAT"
                  inputProps={{ maxLength: 10 }}
                  required
                  helperText="Short identifier for your token (max 10 chars)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={tokenData.description}
                  onChange={handleChange}
                  placeholder="Describe your token's purpose and utility..."
                  multiline
                  rows={3}
                  helperText="A detailed description of your token"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Decimals</InputLabel>
                  <Select
                    value={tokenData.decimals}
                    label="Decimals"
                    name="decimals"
                    onChange={handleChange}
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((decimal) => (
                      <MenuItem key={decimal} value={decimal}>
                        {decimal} {decimal === 9 && '(Recommended)'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Initial Supply"
                  name="supply"
                  type="number"
                  value={tokenData.supply}
                  onChange={handleChange}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">tokens</InputAdornment>,
                  }}
                  required
                  helperText="Total number of tokens to create"
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={advancedMode}
                      onChange={(e) => setAdvancedMode(e.target.checked)}
                    />
                  }
                  label="Advanced Settings"
                />
              </Grid>
              
              {advancedMode && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SecurityIcon color="primary" />
                      Authority Settings
                      <Tooltip title="These settings control who can mint additional tokens or freeze accounts">
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mint Authority"
                      name="mintAuthority"
                      value={tokenData.mintAuthority}
                      onChange={handleChange}
                      placeholder="Leave empty to use connected wallet"
                      helperText="Address that can mint additional tokens"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Freeze Authority"
                      name="freezeAuthority"
                      value={tokenData.freezeAuthority}
                      onChange={handleChange}
                      placeholder="Leave empty to disable freeze authority"
                      helperText="Address that can freeze token accounts"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WebsiteIcon color="primary" />
              Social & Metadata
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add social links and metadata to make your token more discoverable (optional)
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Token Image URL"
                  name="image"
                  value={tokenData.image}
                  onChange={handleChange}
                  placeholder="https://example.com/token-logo.png"
                  helperText="URL to your token's logo image (PNG, JPG, or SVG)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Website"
                  name="website"
                  value={tokenData.website}
                  onChange={handleChange}
                  placeholder="https://yourproject.com"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WebsiteIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Your project's official website"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Twitter"
                  name="twitter"
                  value={tokenData.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourproject"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TwitterIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Your project's Twitter profile"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Telegram"
                  name="telegram"
                  value={tokenData.telegram}
                  onChange={handleChange}
                  placeholder="https://t.me/yourproject"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TelegramIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Your project's Telegram group"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Discord"
                  name="discord"
                  value={tokenData.discord}
                  onChange={handleChange}
                  placeholder="https://discord.gg/yourproject"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DiscordIcon />
                      </InputAdornment>
                    ),
                  }}
                  helperText="Your project's Discord server"
                />
              </Grid>
            </Grid>
          </Box>
        );
      case 3:
        const validation = getValidationStatus();
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="primary" />
              Review & Deploy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Review your token details before deploying to the Solana {network}
            </Typography>
            
            {/* Validation Status */}
            <Card sx={{ mb: 3, bgcolor: validation.required && validation.validUrls ? 'success.light' : 'warning.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  {validation.required && validation.validUrls ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <WarningIcon color="warning" />
                  )}
                  <Typography variant="h6">
                    {validation.required && validation.validUrls ? 'Ready to Deploy' : 'Validation Issues'}
                  </Typography>
                </Box>
                {!validation.required && (
                  <Typography variant="body2" color="error">
                    • Please fill in all required fields (Name, Symbol, Supply)
                  </Typography>
                )}
                {!validation.validUrls && (
                  <Typography variant="body2" color="error">
                    • Please check your URL formats
                  </Typography>
                )}
              </CardContent>
            </Card>
            
            {/* Token Preview */}
            <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TokenIcon />
                Token Preview
              </Typography>
              
              <Grid container spacing={2}>
                {tokenData.image && (
                  <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar
                      src={tokenData.image}
                      sx={{ width: 64, height: 64, mx: 'auto' }}
                    >
                      {tokenData.symbol?.charAt(0)}
                    </Avatar>
                  </Grid>
                )}
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Name</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{tokenData.name || 'Not set'}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Symbol</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{tokenData.symbol || 'Not set'}</Typography>
                </Grid>
                
                {tokenData.description && (
                  <>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Description</Typography>
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="body2">{tokenData.description}</Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Decimals</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">{tokenData.decimals}</Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Initial Supply</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {tokenData.supply?.toLocaleString()} {tokenData.symbol}
                  </Typography>
                </Grid>
                
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Network</Typography>
                </Grid>
                <Grid item xs={8}>
                  <Chip label={network} color="primary" size="small" />
                </Grid>
                
                {/* Social Links */}
                {(tokenData.website || tokenData.twitter || tokenData.telegram || tokenData.discord) && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary">Social Links</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {tokenData.website && (
                          <Chip icon={<WebsiteIcon />} label="Website" size="small" />
                        )}
                        {tokenData.twitter && (
                          <Chip icon={<TwitterIcon />} label="Twitter" size="small" />
                        )}
                        {tokenData.telegram && (
                          <Chip icon={<TelegramIcon />} label="Telegram" size="small" />
                        )}
                        {tokenData.discord && (
                          <Chip icon={<DiscordIcon />} label="Discord" size="small" />
                        )}
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            </Paper>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                By clicking "Create Token", you will sign a transaction to deploy this token to the Solana blockchain.
                This action cannot be undone and will cost a small amount of SOL for transaction fees.
              </Typography>
            </Alert>
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Create Your Solana Token
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Launch your own SPL token on Solana in just a few steps
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0 || loading ? true : false}
            onClick={handleBack}
            size="large"
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCreateToken}
                disabled={loading || success || !getValidationStatus().required ? true : false}
                startIcon={loading && <CircularProgress size={20} color="inherit" />}
              >
                {loading ? 'Creating Token...' : 'Create Token'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleNext}
                disabled={loading ? true : false}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateToken;