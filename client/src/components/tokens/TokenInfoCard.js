import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Divider,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Launch as LaunchIcon,
  Send as SendIcon,
  Add as MintIcon,
  Remove as BurnIcon,
} from '@mui/icons-material';

/**
 * TokenInfoCard component for displaying token information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.token - Token data
 * @param {Function} props.onTransfer - Transfer handler
 * @param {Function} props.onMint - Mint handler
 * @param {Function} props.onBurn - Burn handler
 * @param {Function} props.onCopy - Copy handler
 * @param {boolean} props.isMintAuthority - Whether user is mint authority
 * @param {boolean} props.isFreezeAuthority - Whether user is freeze authority
 */
const TokenInfoCard = ({
  token,
  onTransfer,
  onMint,
  onBurn,
  onCopy,
  isMintAuthority = false,
  isFreezeAuthority = false,
}) => {
  const formatSupply = (supply) => {
    if (!supply) return '0';
    return new Intl.NumberFormat().format(supply);
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (onCopy) onCopy(`${label} copied to clipboard`);
  };

  const openExplorer = (address) => {
    const explorerUrl = `https://explorer.solana.com/address/${address}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <Card elevation={2}>
      <CardContent>
        {/* Token Header */}
        <Box display="flex" alignItems="center" mb={3}>
          <Avatar
            src={token?.image}
            sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}
          >
            {token?.symbol?.charAt(0) || 'T'}
          </Avatar>
          <Box flex={1}>
            <Typography variant="h4" component="h1" gutterBottom>
              {token?.name || 'Unknown Token'}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip label={token?.symbol || 'N/A'} color="primary" size="small" />
              <Chip 
                label={`${token?.decimals || 0} decimals`} 
                variant="outlined" 
                size="small" 
              />
            </Box>
          </Box>
        </Box>

        {/* Token Description */}
        {token?.description && (
          <Typography variant="body1" color="text.secondary" mb={3}>
            {token.description}
          </Typography>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Token Details */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Token Details
            </Typography>
            
            {/* Token Address */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Token Address
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {token?.address || 'N/A'}
                </Typography>
                <Tooltip title="Copy Address">
                  <IconButton 
                    size="small" 
                    onClick={() => copyToClipboard(token?.address, 'Token address')}
                  >
                    <CopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="View on Explorer">
                  <IconButton 
                    size="small" 
                    onClick={() => openExplorer(token?.address)}
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Total Supply */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Total Supply
              </Typography>
              <Typography variant="h6">
                {formatSupply(token?.supply)} {token?.symbol}
              </Typography>
            </Box>

            {/* Mint Authority */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Mint Authority
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {token?.mintAuthority || 'None'}
                </Typography>
                {token?.mintAuthority && (
                  <Tooltip title="Copy Mint Authority">
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(token?.mintAuthority, 'Mint authority')}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Freeze Authority */}
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary">
                Freeze Authority
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {token?.freezeAuthority || 'None'}
                </Typography>
                {token?.freezeAuthority && (
                  <Tooltip title="Copy Freeze Authority">
                    <IconButton 
                      size="small" 
                      onClick={() => copyToClipboard(token?.freezeAuthority, 'Freeze authority')}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={onTransfer}
                fullWidth
              >
                Transfer Tokens
              </Button>
              
              {isMintAuthority && (
                <Button
                  variant="outlined"
                  startIcon={<MintIcon />}
                  onClick={onMint}
                  fullWidth
                >
                  Mint Tokens
                </Button>
              )}
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<BurnIcon />}
                onClick={onBurn}
                fullWidth
              >
                Burn Tokens
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Social Links */}
        {(token?.website || token?.twitter || token?.telegram || token?.discord) && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Social Links
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {token?.website && (
                <Button
                  variant="outlined"
                  size="small"
                  href={token.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </Button>
              )}
              {token?.twitter && (
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://twitter.com/${token.twitter}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter
                </Button>
              )}
              {token?.telegram && (
                <Button
                  variant="outlined"
                  size="small"
                  href={`https://t.me/${token.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Telegram
                </Button>
              )}
              {token?.discord && (
                <Button
                  variant="outlined"
                  size="small"
                  href={token.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Discord
                </Button>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenInfoCard;