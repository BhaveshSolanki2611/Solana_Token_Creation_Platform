import React from 'react';
import { Button, CircularProgress } from '@mui/material';

/**
 * LoadingButton component that shows a loading spinner when in loading state
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Whether button is in loading state
 * @param {string} props.loadingText - Text to show when loading (optional)
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.rest - Other Button props
 */
const LoadingButton = ({ loading, loadingText, children, ...rest }) => {
  return (
    <Button
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress 
            size={24} 
            color="inherit" 
            sx={{ mr: loadingText ? 1 : 0 }} 
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
};

export default LoadingButton;