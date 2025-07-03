import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import axios from 'axios';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

const WalletContext = createContext();

export const useWallet = () => useContext(WalletContext);

// Inner provider that has access to the Solana wallet adapter
const InnerWalletProvider = ({ children, network, setNetwork }) => {
  // State for wallet connection
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [wallet, setWallet] = useState(null);
  
  // Access the wallet modal
  const { setVisible } = useWalletModal();

  // Enhanced function to get wallet balance with better error handling
  const getWalletBalance = async (address) => {
    if (!address) return 0;
    
    let retries = 2; // Reduce from 3 to 2 retries to fail faster
    let lastError = null;
    
    console.log(`Fetching balance for address: ${address}, network: ${network}`);
    
    while (retries > 0) {
      try {
        const response = await axios.get(`/api/wallet/balance/${address}`, {
          params: { network },
          timeout: 10000, // Reduced timeout from 15000 to 10000 ms
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // Handle both success cases and graceful fallbacks from the server
        if (response.data.balance !== undefined) {
          const balance = response.data.balance || 0;
          console.log(`Balance fetched successfully: ${balance} SOL`);
          setWalletBalance(balance);
          return balance;
        } else {
          throw new Error('Invalid response format - missing balance field');
        }
      } catch (error) {
        lastError = error;
        
        // Log error but simplified to reduce log noise
        console.error(`Error fetching wallet balance:`, {
          message: error.message,
          status: error.response?.status,
          timeout: error.code === 'ECONNABORTED'
        });
        
        // Handle different error types
        if (error.response) {
          // Server responded with error - don't retry client errors except timeout
          if (error.response.status >= 400 && error.response.status < 500 && error.response.status !== 408) {
            console.log('Client error, not retrying');
            retries = 0;
          }
        }
        
        retries--;
        
        if (retries > 0) {
          const delay = 1000; // Fixed 1s delay
          console.log(`Waiting ${delay}ms before retry (${retries} retries left)...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Failed after retries - log basic error info and continue
    console.error('Failed to get wallet balance after all retries:', {
      address, 
      network
    });
    
    // IMPORTANT: Don't throw error - balance fetch is not critical for token creation
    // Just return 0 and let the app continue
    return 0;
  };

  // Update balance when wallet changes
  useEffect(() => {
    const updateBalance = async () => {
      try {
        if (connected && publicKey) {
          await getWalletBalance(publicKey.toString());
        } else {
          setWalletBalance(0);
        }
      } catch (error) {
        console.error('Failed to update wallet balance:', error);
        // Don't set balance to 0 on error - keep last known value
      }
    };
    
    updateBalance();
    
    // Set up interval to periodically refresh balance
    const intervalId = setInterval(updateBalance, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [connected, publicKey, network]);

  // Function to request SOL airdrop (devnet only)
  const requestAirdrop = async (amount = 1) => {
    if (!publicKey || (network !== 'devnet' && network !== 'testnet')) return null;
    
    try {
      const response = await axios.post('/api/wallet/airdrop', {
        walletAddress: publicKey.toString(),
        amount: amount,
        network: network
      });
      
      if (response.data.success) {
        // Refresh balance after airdrop
        await getWalletBalance(publicKey.toString());
        return response.data.signature;
      }
      return null;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      return null;
    }
  };

  // Function to switch network
  const switchNetwork = (newNetwork) => {
    if (['devnet', 'testnet', 'mainnet-beta'].includes(newNetwork)) {
      setNetwork(newNetwork);
      // Reset wallet connection when switching networks
      setConnected(false);
      setPublicKey(null);
      setWalletBalance(0);
    }
  };

  // Enhanced wallet detection and connection management
  useEffect(() => {
    let eventListenersAdded = false;
    let checkInterval;
    
    const checkWalletConnection = async () => {
      try {
        console.log('Checking wallet connection...');
        
        // Wait for wallet extensions to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check for Phantom wallet first (most common)
        if (window.solana?.isPhantom) {
          console.log('Phantom wallet detected');
          setWallet(window.solana);
          
          // Check if already connected
          const isConnected = window.solana.isConnected;
          console.log('Phantom wallet connected status:', isConnected);
          
          if (isConnected && window.solana.publicKey) {
            console.log('Phantom wallet public key:', window.solana.publicKey.toString());
            setConnected(true);
            setPublicKey(window.solana.publicKey);
            
            // Get balance in background
            try {
              await getWalletBalance(window.solana.publicKey.toString());
            } catch (balanceError) {
              console.warn('Failed to get initial balance:', balanceError);
            }
          } else {
            setConnected(false);
            setPublicKey(null);
            setWalletBalance(0);
          }
          
          // Add event listeners only once
          if (!eventListenersAdded) {
            console.log('Adding Phantom wallet event listeners...');
            
            const handleConnect = async (publicKey) => {
              console.log('Phantom wallet connected event:', publicKey?.toString());
              setConnected(true);
              setPublicKey(publicKey);
              
              if (publicKey) {
                try {
                  await getWalletBalance(publicKey.toString());
                } catch (error) {
                  console.warn('Failed to get balance on connect:', error);
                }
              }
            };
            
            const handleDisconnect = () => {
              console.log('Phantom wallet disconnected event');
              setConnected(false);
              setPublicKey(null);
              setWalletBalance(0);
            };
            
            const handleAccountChanged = async (publicKey) => {
              console.log('Phantom wallet account changed:', publicKey?.toString());
              if (publicKey) {
                setPublicKey(publicKey);
                setConnected(true);
                try {
                  await getWalletBalance(publicKey.toString());
                } catch (error) {
                  console.warn('Failed to get balance on account change:', error);
                }
              } else {
                setConnected(false);
                setPublicKey(null);
                setWalletBalance(0);
              }
            };
            
            // Add event listeners with error handling
            try {
              window.solana.on('connect', handleConnect);
              window.solana.on('disconnect', handleDisconnect);
              window.solana.on('accountChanged', handleAccountChanged);
              eventListenersAdded = true;
              console.log('Phantom wallet event listeners added successfully');
            } catch (listenerError) {
              console.error('Failed to add Phantom wallet event listeners:', listenerError);
            }
          }
          
          return true; // Phantom wallet found
        }
        
        // Check for other wallets if Phantom is not available
        console.log('Phantom wallet not detected, checking for other wallets...');
        
        // Check for Solflare
        if (window.solflare?.isConnected) {
          console.log('Solflare wallet detected and connected');
          setWallet(window.solflare);
          setConnected(true);
          setPublicKey(window.solflare.publicKey);
          
          try {
            await getWalletBalance(window.solflare.publicKey.toString());
          } catch (error) {
            console.warn('Failed to get Solflare balance:', error);
          }
          return true;
        }
        
        // Check for Backpack
        if (window.backpack?.isConnected) {
          console.log('Backpack wallet detected and connected');
          setWallet(window.backpack);
          setConnected(true);
          setPublicKey(window.backpack.publicKey);
          
          try {
            await getWalletBalance(window.backpack.publicKey.toString());
          } catch (error) {
            console.warn('Failed to get Backpack balance:', error);
          }
          return true;
        }
        
        // Check for other wallet providers
        const walletProviders = ['sollet', 'mathWallet', 'coin98', 'slope'];
        for (const provider of walletProviders) {
          if (window[provider]?.isConnected) {
            console.log(`${provider} wallet detected and connected`);
            setWallet(window[provider]);
            setConnected(true);
            setPublicKey(window[provider].publicKey);
            return true;
          }
        }
        
        console.log('No wallet detected or connected');
        return false;
        
      } catch (error) {
        console.error('Error checking wallet connection:', error);
        return false;
      }
    };
    
    // Initial check with multiple attempts
    const performInitialCheck = async () => {
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts) {
        console.log(`Wallet detection attempt ${attempts + 1}/${maxAttempts}`);
        
        const walletFound = await checkWalletConnection();
        
        if (walletFound) {
          console.log('Wallet found, stopping detection attempts');
          break;
        }
        
        attempts++;
        
        if (attempts < maxAttempts) {
          // Wait before next attempt with increasing delay
          const delay = 1000 + (attempts * 500);
          console.log(`Waiting ${delay}ms before next wallet detection attempt...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      if (attempts === maxAttempts) {
        console.log('Wallet detection completed after maximum attempts');
      }
    };
    
    // Start initial detection
    performInitialCheck();
    
    // Set up periodic checks for wallet availability (less frequent)
    checkInterval = setInterval(async () => {
      // Only check if no wallet is currently connected
      if (!connected && !wallet) {
        console.log('Periodic wallet availability check...');
        await checkWalletConnection();
      }
    }, 10000); // Check every 10 seconds
    
    // Cleanup function
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      
      // Clean up event listeners
      if (eventListenersAdded && window.solana?.isPhantom) {
        try {
          console.log('Cleaning up Phantom wallet event listeners...');
          window.solana.off('connect');
          window.solana.off('disconnect');
          window.solana.off('accountChanged');
        } catch (error) {
          console.warn('Error cleaning up wallet event listeners:', error);
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Context value
  const value = {
    connected,
    setConnected,
    publicKey,
    setPublicKey,
    walletBalance,
    balance: walletBalance, // Add this alias for compatibility
    getWalletBalance,
    requestAirdrop,
    network,
    switchNetwork,
    wallet,
    openWalletModal: () => setVisible(true),
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Outer provider that sets up the Solana wallet adapter
export const WalletProvider = ({ children }) => {
  const [network, setNetwork] = useState('devnet'); // 'devnet', 'testnet', or 'mainnet-beta'

  // Get network configuration
  const endpoint = React.useMemo(() => {
    if (network === 'mainnet-beta') {
      return clusterApiUrl('mainnet-beta');
    } else if (network === 'testnet') {
      return clusterApiUrl('testnet');
    } else {
      return clusterApiUrl('devnet');
    }
  }, [network]);

  // Configure wallet adapters
  const wallets = React.useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <InnerWalletProvider network={network} setNetwork={setNetwork}>
            {children}
          </InnerWalletProvider>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};