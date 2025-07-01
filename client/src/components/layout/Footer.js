import React from 'react';
import { Box, Container, Typography, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper' }}>
      <Divider />
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
            <img 
              src="/solana-logo.svg" 
              alt="Solana Logo" 
              style={{ height: '24px', marginRight: '10px' }} 
            />
            <Typography variant="body2" color="text.secondary">
              Solana Token Creation Platform
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="https://solana.com" target="_blank" rel="noopener" color="text.secondary" underline="hover">
              Solana
            </Link>
            <Link href="https://spl.solana.com/token" target="_blank" rel="noopener" color="text.secondary" underline="hover">
              SPL Token
            </Link>
            <Link href="https://docs.solana.com" target="_blank" rel="noopener" color="text.secondary" underline="hover">
              Documentation
            </Link>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          © {new Date().getFullYear()} Token Creation Platform. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;