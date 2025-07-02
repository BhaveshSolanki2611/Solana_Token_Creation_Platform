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

  // Function to get wallet balance
  const getWalletBalance = async (address) => {
    if (!address) return 0;
    
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        const response = await axios.get(`/api/wallet/balance/${address}`, {
          params: { network },
          timeout: 15000 // 15 second timeout
        });
        setWalletBalance(response.data.balance);
        return response.data.balance;
      } catch (error) {
        lastError = error;
        console.error(`Error fetching wallet balance (retries left: ${retries}):`, error);
        retries--;
        
        // If it's a 408 timeout or 500 error, don't retry as aggressively
        if (error.response?.status === 408 || error.response?.status === 500) {
          if (retries > 1) {
            retries = 1; // Only one more retry for server errors
          }
        }
        
        if (retries > 0) {
          // Exponential backoff
          const delay = (4 - retries) * 2000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed, but don't throw - return 0 instead
    console.error('Failed to get wallet balance after multiple attempts:', lastError);
    setWalletBalance(0);
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

  // Get the current wallet adapter from @solana/wallet-adapter-react
  useEffect(() => {
    // This function will run when the component mounts
    const checkWalletConnection = async () => {
      try {
        // Check if window.solana exists (Phantom wallet)
        if (window.solana?.isPhantom) {
          setWallet(window.solana);
          
          // Check if already connected
          const connected = window.solana.isConnected;
          setConnected(connected);
          
          if (connected && window.solana.publicKey) {
            setPublicKey(window.solana.publicKey);
            await getWalletBalance(window.solana.publicKey.toString());
          }
          
          // Listen for connection changes
          window.solana.on('connect', (publicKey) => {
            console.log('Phantom wallet connected:', publicKey);
            setConnected(true);
            setPublicKey(publicKey);
          });
          
          window.solana.on('disconnect', () => {
            console.log('Phantom wallet disconnected');
            setConnected(false);
            setPublicKey(null);
          });
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };
    
    checkWalletConnection();
    
    // Cleanup function
    return () => {
      if (window.solana?.isPhantom) {
        window.solana.off('connect');
        window.solana.off('disconnect');
      }
    };
  }, []);

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