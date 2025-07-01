import React from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useWallet } from '../../contexts/WalletContext';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

/**
 * ConnectWallet component to prompt users to connect their wallet
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Custom message to display
 * @param {string} props.buttonText - Custom button text
 * @param {Object} props.sx - Additional styles for the container
 */
const ConnectWallet = ({ 
  message = 'Connect your wallet to get started', 
  buttonText = 'Connect Wallet',
  sx = {}
}) => {
  const theme = useTheme();
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  // If wallet is already connected, don't show this component
  if (connected) return null;

  return (
    <Paper 
      elevation={2} 
      sx={{
        p: 4,
        textAlign: 'center',
        borderRadius: 2,
        ...sx
      }}
    >
      <Box 
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3
        }}
      >
        <Box 
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: '50%',
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AccountBalanceWalletIcon fontSize="large" />
        </Box>
        
        <Typography variant="h6">
          {message}
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={() => setVisible(true)}
          startIcon={<AccountBalanceWalletIcon />}
        >
          {buttonText}
        </Button>
      </Box>
    </Paper>
  );
};

export default ConnectWallet;