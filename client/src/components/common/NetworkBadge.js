import React from 'react';
import { Chip, Tooltip } from '@mui/material';
import { useWallet } from '../../contexts/WalletContext';

/**
 * NetworkBadge component to display the current Solana network
 * 
 * @param {Object} props - Component props
 * @param {Object} props.sx - Additional styles
 */
const NetworkBadge = ({ sx = {} }) => {
  const { network } = useWallet();

  // Network color mapping
  const getNetworkColor = () => {
    switch (network) {
      case 'mainnet-beta':
        return 'success';
      case 'testnet':
        return 'warning';
      case 'devnet':
        return 'info';
      default:
        return 'default';
    }
  };

  // Network display name
  const getNetworkName = () => {
    switch (network) {
      case 'mainnet-beta':
        return 'Mainnet';
      case 'testnet':
        return 'Testnet';
      case 'devnet':
        return 'Devnet';
      default:
        return network;
    }
  };

  return (
    <Tooltip title={`Connected to Solana ${getNetworkName()}`}>
      <Chip
        label={getNetworkName()}
        color={getNetworkColor()}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 'medium',
          ...sx
        }}
      />
    </Tooltip>
  );
};

export default NetworkBadge;