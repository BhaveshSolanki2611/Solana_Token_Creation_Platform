import React from 'react';
import { Grid, Typography, Box, CircularProgress } from '@mui/material';
import TokenCard from './TokenCard';

/**
 * TokenList component to display a list of tokens in a grid layout
 * 
 * @param {Object} props - Component props
 * @param {Array} props.tokens - Array of token objects
 * @param {boolean} props.loading - Whether tokens are loading
 * @param {string} props.error - Error message if any
 * @param {string} props.emptyMessage - Message to display when no tokens are found
 */
const TokenList = ({ tokens, loading, error, emptyMessage = 'No tokens found' }) => {
  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        py={4}
        sx={{ color: 'error.main' }}
      >
        <Typography variant="body1">
          {error}
        </Typography>
      </Box>
    );
  }

  // Show empty state
  if (!tokens || tokens.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  // Show tokens grid
  return (
    <Grid container spacing={3}>
      {tokens.map((token) => (
        <Grid item xs={12} sm={6} md={4} key={token.address || token.tokenAddress}>
          <TokenCard token={token} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TokenList;