import React from 'react';
import { Typography, Box, Breadcrumbs, Link as MuiLink, useTheme, useMediaQuery } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * PageHeader component for consistent page headers
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Optional subtitle
 * @param {React.ReactNode} props.action - Optional action button/component
 * @param {Array} props.breadcrumbs - Optional breadcrumbs array of {label, path} objects
 */
const PageHeader = ({ title, subtitle, action, breadcrumbs }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box mb={4}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 2 }}>
          <MuiLink 
            component={RouterLink} 
            to="/"
            underline="hover"
            color="inherit"
          >
            Home
          </MuiLink>
          
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography color="text.primary" key={index}>
                {crumb.label}
              </Typography>
            ) : (
              <MuiLink
                component={RouterLink}
                to={crumb.path}
                underline="hover"
                color="inherit"
                key={index}
              >
                {crumb.label}
              </MuiLink>
            );
          })}
        </Breadcrumbs>
      )}
      
      {/* Header with title and action */}
      <Box 
        display="flex" 
        flexDirection={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems={isMobile ? 'flex-start' : 'center'}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1"
            gutterBottom={!!subtitle}
          >
            {title}
          </Typography>
          
          {subtitle && (
            <Typography variant="subtitle1" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box mt={isMobile ? 2 : 0}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;