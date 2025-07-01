/**
 * Wallet adapter utilities to help with browser compatibility
 */

import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
  SolongWalletAdapter,
  CloverWalletAdapter,
  Coin98WalletAdapter,
  SolletWalletAdapter,
} from '@solana/wallet-adapter-wallets';

// Export a function that creates wallet adapters without using TorusWalletAdapter
export const getWalletAdapters = () => {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new LedgerWalletAdapter(),
    new SlopeWalletAdapter(),
    new SolongWalletAdapter(),
    new CloverWalletAdapter(),
    new Coin98WalletAdapter(),
    new SolletWalletAdapter(),
  ];
};

export default getWalletAdapters; 