import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Chip,
  Link as MuiLink,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatTokenAmount } from '../../utils/tokenUtils';

/**
 * TokenInfoCard component to display detailed token information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.token - Token data
 * @param {string} props.network - Solana network (devnet, testnet, mainnet-beta)
 */
const TokenInfoCard = ({ token, network }) => {
  if (!token) return null;

  const {
    address,
    name,
    symbol,
    decimals,
    supply,
    owner,
    mintAuthority,
    freezeAuthority,
  } = token;

  // Format token supply with proper decimals
  const formattedSupply = formatTokenAmount(supply, decimals);

  // Get explorer URL based on network
  const getExplorerUrl = (address) => {
    const baseUrl = network === 'mainnet-beta'
      ? 'https://explorer.solana.com'
      : `https://explorer.solana.com/?cluster=${network}`;
    
    return `${baseUrl}/address/${address}`;
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Render address with copy button
  const renderAddress = (address, label) => (
    <Box display="flex" alignItems="center">
      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
        {address}
      </Typography>
      <Tooltip title={`Copy ${label} address`}>
        <IconButton 
          size="small" 
          onClick={() => copyToClipboard(address)}
          sx={{ ml: 1 }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2">
            {name}
          </Typography>
          <Chip 
            label={symbol} 
            color="primary" 
            size="medium" 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Token Address
            </Typography>
            {renderAddress(address, 'token')}
            <Box mt={0.5}>
              <MuiLink 
                href={getExplorerUrl(address)} 
                target="_blank" 
                rel="noopener noreferrer"
                underline="hover"
                fontSize="small"
              >
                View on Solana Explorer
              </MuiLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Total Supply
            </Typography>
            <Typography variant="body1">
              {formattedSupply} {symbol}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Decimals
            </Typography>
            <Typography variant="body1">
              {decimals}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Owner
            </Typography>
            {renderAddress(owner, 'owner')}
          </Grid>
          
          {mintAuthority && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Mint Authority
              </Typography>
              {renderAddress(mintAuthority, 'mint authority')}
            </Grid>
          )}
          
          {freezeAuthority && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Freeze Authority
              </Typography>
              {renderAddress(freezeAuthority, 'freeze authority')}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default TokenInfoCard;