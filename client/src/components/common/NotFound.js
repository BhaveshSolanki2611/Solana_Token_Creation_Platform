import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';

/**
 * NotFound component for 404 pages
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Custom title
 * @param {string} props.message - Custom message
 */
const NotFound = ({ 
  title = 'Page Not Found', 
  message = 'The page you are looking for does not exist or has been moved.' 
}) => {
  return (
    <Container maxWidth="md">
      <Paper 
        elevation={2}
        sx={{
          p: 4,
          mt: 4,
          textAlign: 'center',
          borderRadius: 2,
        }}
      >
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center"
          py={4}
        >
          <ErrorOutlineIcon 
            color="error" 
            sx={{ fontSize: 80, mb: 2 }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            {title}
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            {message}
          </Typography>
          
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            color="primary"
            startIcon={<HomeIcon />}
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;