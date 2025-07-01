import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useWallet } from '../../contexts/WalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';

const Navbar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { setVisible } = useWalletModal();
  const { publicKey, disconnect } = useSolanaWallet();
  const { walletBalance, getWalletBalance, setConnected, setPublicKey, network, switchNetwork } = useWallet();
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [networkMenuAnchorEl, setNetworkMenuAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNetworkMenu = (event) => {
    setNetworkMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNetworkClose = () => {
    setNetworkMenuAnchorEl(null);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleNetworkSwitch = (newNetwork) => {
    switchNetwork(newNetwork);
    handleNetworkClose();
  };

  const handleConnectWallet = () => {
    setVisible(true);
  };

  const handleDisconnectWallet = () => {
    if (disconnect) {
      disconnect();
    }
    setConnected(false);
    setPublicKey(null);
    handleClose();
  };

  // Update wallet connection status when publicKey changes
  useEffect(() => {
    if (publicKey) {
      setConnected(true);
      setPublicKey(publicKey.toString());
      getWalletBalance(publicKey.toString());
    } else {
      setConnected(false);
      setPublicKey(null);
    }
  }, [publicKey, setConnected, setPublicKey, getWalletBalance]);

  const networkColor = {
    'devnet': '#14F195', // Green
    'testnet': '#9945FF', // Purple
    'mainnet-beta': '#00C2FF', // Blue
  };

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Create Token', path: '/create-token' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <img 
              src="/solana-logo.svg" 
              alt="Solana Logo" 
              style={{ height: '32px', marginRight: '10px' }} 
            />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'inherit',
                fontWeight: 700,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              Token Creation Platform
            </Typography>
          </Box>

          {/* Mobile Menu */}
          {isMobile && (
            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMobileMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={mobileMenuAnchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(mobileMenuAnchorEl)}
                onClose={handleMobileMenuClose}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {navItems.map((item) => (
                  <MenuItem 
                    key={item.name} 
                    component={RouterLink} 
                    to={item.path}
                    onClick={handleMobileMenuClose}
                    selected={location.pathname === item.path}
                  >
                    <Typography textAlign="center">{item.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {navItems.map((item) => (
              <Button
                key={item.name}
                component={RouterLink}
                to={item.path}
                sx={{ 
                  my: 2, 
                  color: 'text.primary',
                  display: 'block',
                  fontWeight: location.pathname === item.path ? 700 : 400,
                  borderBottom: location.pathname === item.path ? '2px solid' : 'none',
                  borderRadius: 0,
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>

          {/* Network Selector */}
          <Box sx={{ mr: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleNetworkMenu}
              sx={{ 
                borderColor: networkColor[network],
                color: networkColor[network],
                textTransform: 'capitalize',
              }}
            >
              {network}
            </Button>
            <Menu
              anchorEl={networkMenuAnchorEl}
              open={Boolean(networkMenuAnchorEl)}
              onClose={handleNetworkClose}
            >
              <MenuItem 
                onClick={() => handleNetworkSwitch('devnet')}
                selected={network === 'devnet'}
              >
                Devnet
              </MenuItem>
              <MenuItem 
                onClick={() => handleNetworkSwitch('testnet')}
                selected={network === 'testnet'}
              >
                Testnet
              </MenuItem>
              <MenuItem 
                onClick={() => handleNetworkSwitch('mainnet-beta')}
                selected={network === 'mainnet-beta'}
              >
                Mainnet
              </MenuItem>
            </Menu>
          </Box>

          {/* Wallet Connection */}
          <Box>
            {publicKey ? (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip
                  icon={<AccountBalanceWalletIcon />}
                  label={`${walletBalance.toFixed(2)} SOL`}
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleMenu}
                  size="small"
                >
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleDisconnectWallet}>Disconnect</MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConnectWallet}
                startIcon={<AccountBalanceWalletIcon />}
              >
                Connect Wallet
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;