import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import { formatTokenAmount } from '../../utils/tokenUtils';
import { shortenAddress } from '../../utils/walletUtils';

/**
 * TokenCard component to display token information in a card format
 * 
 * @param {Object} props - Component props
 * @param {Object} props.token - Token data
 * @param {string} props.token.address - Token mint address
 * @param {string} props.token.name - Token name
 * @param {string} props.token.symbol - Token symbol
 * @param {number} props.token.decimals - Token decimals
 * @param {string} props.token.supply - Token supply (raw amount)
 * @param {string} props.token.owner - Token owner address
 */
const TokenCard = ({ token }) => {
  if (!token) return null;

  // Support both 'address' and 'tokenAddress' for compatibility
  const address = token.address || token.tokenAddress;
  const name = token.name;
  const symbol = token.symbol;
  const decimals = token.decimals;
  const supply = token.supply;
  const owner = token.owner;
  const balance = token.balance;

  // Format token supply with proper decimals
  const formattedSupply = formatTokenAmount(supply, decimals);

  return (
    <Card 
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" component="h2" noWrap>
            {name}
          </Typography>
          <Chip 
            label={symbol} 
            color="primary" 
            size="small" 
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box my={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Token Address
          </Typography>
          <Typography variant="body2" noWrap>
            {shortenAddress(address, 6)}
          </Typography>
        </Box>
        
        <Box my={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Supply
          </Typography>
          <Typography variant="body1">
            {formattedSupply} {symbol}
          </Typography>
        </Box>
        {balance !== undefined && (
          <Box my={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Your Balance
            </Typography>
            <Typography variant="body1">
              {formatTokenAmount(balance, decimals)} {symbol}
            </Typography>
          </Box>
        )}
        
        <Box my={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Decimals
          </Typography>
          <Typography variant="body1">
            {decimals}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          component={Link} 
          to={`/token/${address}`} 
          variant="contained" 
          color="primary"
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default TokenCard;