/**
 * This file is used to polyfill the crypto module for browser environments
 * It's needed to fix the issue with @toruslabs/eccrypto
 */

// Import and directly expose crypto-browserify
import cryptoBrowserify from 'crypto-browserify';

// Make crypto available globally
if (typeof window !== 'undefined') {
  window.crypto = window.crypto || {};
  // Merge additional required crypto properties
  Object.keys(cryptoBrowserify).forEach(key => {
    if (!window.crypto[key]) {
      window.crypto[key] = cryptoBrowserify[key];
    }
  });
}

export default cryptoBrowserify; 