import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import TokenIcon from '@mui/icons-material/Token';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const Home = () => {
  return (
    <Box>
      {/* Hero Section */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          py: 8,
          backgroundImage: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom>
                Create Your Own Solana Token
              </Typography>
              <Typography variant="h5" paragraph>
                Launch your custom SPL token on the Solana blockchain in minutes.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="contained" 
                  size="large" 
                  component={RouterLink} 
                  to="/create-token"
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    },
                    mr: 2,
                    mb: { xs: 2, sm: 0 },
                  }}
                >
                  Create Token
                </Button>
                <Button 
                  variant="outlined" 
                  size="large"
                  component={RouterLink}
                  to="/dashboard"
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                    } 
                  }}
                >
                  View Dashboard
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box 
                component="img"
                src="/solana-logo.svg"
                alt="Solana Logo"
                sx={{ 
                  width: '100%',
                  maxWidth: '400px',
                  display: 'block',
                  mx: 'auto',
                  filter: 'drop-shadow(0px 4px 20px rgba(0, 0, 0, 0.15))',
                }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom>
          Features
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" paragraph>
          Everything you need to create and manage your Solana tokens
        </Typography>
        
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <TokenIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h5" component="h3" align="center" gutterBottom>
                  Token Creation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create custom SPL tokens with configurable parameters like name, symbol, decimals, and initial supply.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <AccountBalanceWalletIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h5" component="h3" align="center" gutterBottom>
                  Wallet Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect with popular Solana wallets like Phantom, Solflare, and more to manage your tokens securely.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <SpeedIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h5" component="h3" align="center" gutterBottom>
                  Fast Deployment
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deploy your tokens to the Solana blockchain in seconds with our streamlined process.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <SecurityIcon fontSize="large" color="primary" />
                </Box>
                <Typography variant="h5" component="h3" align="center" gutterBottom>
                  Secure Management
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Manage your tokens securely with full control over mint and freeze authorities.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" component="h2" align="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" paragraph>
            Create your token in just a few simple steps
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 4 }}>
            <Grid item xs={12} md={6}>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Connect Your Wallet" 
                    secondary="Link your Solana wallet to get started. We support Phantom, Solflare, and other popular wallets."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Configure Token Parameters" 
                    secondary="Set your token's name, symbol, decimals, and initial supply according to your needs."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Deploy to Blockchain" 
                    secondary="With a single click, deploy your token to the Solana blockchain (devnet, testnet, or mainnet)."
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <CheckCircleOutlineIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Manage Your Token" 
                    secondary="Use our dashboard to view and manage your tokens, including minting additional supply if needed."
                  />
                </ListItem>
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="h3" gutterBottom>
                    Ready to create your token?
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Our platform makes it easy to launch your own Solana token without any technical knowledge. Perfect for:
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="Community tokens and social currencies" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="Reward and loyalty programs" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="Gaming and NFT projects" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleOutlineIcon color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary="Decentralized applications (dApps)" />
                    </ListItem>
                  </List>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    size="large"
                    component={RouterLink}
                    to="/create-token"
                  >
                    Create Your Token Now
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;