const { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } = require('@solana/web3.js');
const {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createTransferInstruction,
  createBurnInstruction,
  getAssociatedTokenAddress,
  getMint,
  getAccount,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint
} = require('@solana/spl-token');
const { getConnection } = require('./networkUtils');
const bs58 = require('bs58');
const cache = require('memory-cache');

/**
 * Prepares a transaction to create a new SPL token.
 * This transaction is partially signed by the mint's keypair on the server
 * and must be fully signed by the fee payer (user) on the client.
 * @param {Object} tokenData - Token creation parameters
 * @param {Connection} connection - Solana connection object
 * @returns {Object} A base64 encoded, partially signed transaction and the new token's mint address.
 */
const prepareCreateTokenTransaction = async (tokenData, connection) => {
  const {
    name,
    symbol,
    decimals,
    supply,
    ownerWallet,
    mintAuthority,
    freezeAuthority,
    mintPublicKey, // now provided by the frontend
    // Metadata fields are not used for on-chain creation in this basic setup
  } = tokenData;

  try {
    console.log('Starting token creation preparation with data:', {
      name, symbol, decimals, supply, ownerWallet, mintPublicKey
    });

    // Validate required fields
    if (!name || !symbol || decimals === undefined || !supply || !ownerWallet || !mintPublicKey) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!symbol) missingFields.push('symbol');
      if (decimals === undefined) missingFields.push('decimals');
      if (!supply) missingFields.push('supply');
      if (!ownerWallet) missingFields.push('ownerWallet');
      if (!mintPublicKey) missingFields.push('mintPublicKey');
      throw new Error(`Missing required fields for token creation: ${missingFields.join(', ')}`);
    }

    // Validate numeric fields
    if (typeof decimals !== 'number' || decimals < 0 || decimals > 9) {
      throw new Error(`Decimals must be a number between 0 and 9, received: ${decimals} (type: ${typeof decimals})`);
    }

    if (typeof supply !== 'number' || supply <= 0) {
      throw new Error(`Supply must be a positive number, received: ${supply} (type: ${typeof supply})`);
    }

    // Validate and create public keys with better error handling
    let mintPubkey, ownerPublicKey, mintAuthorityPublicKey, freezeAuthorityPublicKey;
    
    try {
      mintPubkey = new PublicKey(mintPublicKey);
      console.log('Mint public key created:', mintPubkey.toString());
    } catch (error) {
      throw new Error(`Invalid mint public key format: ${mintPublicKey}`);
    }
    
    try {
      ownerPublicKey = new PublicKey(ownerWallet);
      console.log('Owner public key created:', ownerPublicKey.toString());
    } catch (error) {
      throw new Error(`Invalid owner wallet address format: ${ownerWallet}`);
    }
    
    try {
      mintAuthorityPublicKey = mintAuthority ? new PublicKey(mintAuthority) : ownerPublicKey;
      console.log('Mint authority public key:', mintAuthorityPublicKey.toString());
    } catch (error) {
      throw new Error(`Invalid mint authority address format: ${mintAuthority}`);
    }
    
    try {
      freezeAuthorityPublicKey = freezeAuthority ? new PublicKey(freezeAuthority) : null;
      if (freezeAuthorityPublicKey) {
        console.log('Freeze authority public key:', freezeAuthorityPublicKey.toString());
      }
    } catch (error) {
      throw new Error(`Invalid freeze authority address format: ${freezeAuthority}`);
    }
    
    // Get rent exempt balance with enhanced retry logic
    console.log('Getting rent exempt balance for mint...');
    let rentExemptBalance;
    let retries = 3;
    while (retries > 0) {
      try {
        // Test connection first with timeout
        console.log('Testing connection to Solana RPC...');
        const connectionTest = Promise.race([
          connection.getSlot(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection test timeout')), 10000)
          )
        ]);
        
        const slot = await connectionTest;
        console.log('Connection successful, current slot:', slot);
        
        // Get rent exempt balance with timeout
        const rentPromise = Promise.race([
          getMinimumBalanceForRentExemptMint(connection),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Rent exempt balance timeout')), 15000)
          )
        ]);
        
        rentExemptBalance = await rentPromise;
        console.log('Rent exempt balance obtained:', rentExemptBalance);
        break;
      } catch (error) {
        retries--;
        console.error(`Failed to get rent exempt balance, retries left: ${retries}`);
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          code: error.code,
          cause: error.cause
        });
        
        if (retries === 0) {
          // Try with a different connection as last resort
          console.log('Trying with fallback connection...');
          try {
            const fallbackConnection = getConnection('devnet');
            const testSlot = await Promise.race([
              fallbackConnection.getSlot(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Fallback connection timeout')), 10000)
              )
            ]);
            console.log('Fallback connection successful, slot:', testSlot);
            
            rentExemptBalance = await Promise.race([
              getMinimumBalanceForRentExemptMint(fallbackConnection),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Fallback rent exempt timeout')), 15000)
              )
            ]);
            console.log('Rent exempt balance obtained with fallback:', rentExemptBalance);
            // Update connection reference for subsequent operations
            connection = fallbackConnection;
            break;
          } catch (fallbackError) {
            console.error('Fallback connection also failed:', fallbackError.message);
            throw new Error(`Failed to connect to Solana network after multiple attempts. Last error: ${error.message}`);
          }
        }
        
        // Exponential backoff with jitter
        const delay = (2000 * (4 - retries)) + Math.random() * 1000;
        console.log(`Waiting ${Math.round(delay)}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.log('Getting associated token address...');
    const associatedTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      ownerPublicKey
    );
    console.log('Associated token account:', associatedTokenAccount.toString());
    
    console.log('Creating transaction...');
    const transaction = new Transaction({
      feePayer: ownerPublicKey,
    });

    console.log('Adding instructions to transaction...');
    // Instructions to create the token
    transaction.add(
      // Create the mint account
      SystemProgram.createAccount({
        fromPubkey: ownerPublicKey,
        newAccountPubkey: mintPubkey,
        space: MINT_SIZE,
        lamports: rentExemptBalance,
        programId: TOKEN_PROGRAM_ID,
      }),
      // Initialize the mint
      createInitializeMintInstruction(
        mintPubkey,
        decimals,
        mintAuthorityPublicKey,
        freezeAuthorityPublicKey
      ),
      // Create the associated token account for the owner
      createAssociatedTokenAccountInstruction(
        ownerPublicKey, // Payer
        associatedTokenAccount,
        ownerPublicKey,
        mintPubkey
      ),
      // Mint the initial supply to the owner's account
      createMintToInstruction(
        mintPubkey,
        associatedTokenAccount,
        mintAuthorityPublicKey,
        BigInt(Math.floor(supply * (10 ** decimals)))
      )
    );
    console.log('All instructions added to transaction');
    
    console.log('Setting dummy blockhash...');
    // Set a dummy blockhash so the client can replace it
    transaction.recentBlockhash = '11111111111111111111111111111111';
    
    console.log('Serializing transaction...');
    // Do NOT sign with the mint keypair on the backend
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // It's not fully signed yet
    });
    console.log('Transaction serialized successfully');
    
    const result = {
      transaction: serializedTransaction.toString('base64'),
      mintAddress: mintPubkey.toString(),
    };
    
    console.log('Token creation preparation completed successfully:', {
      mintAddress: result.mintAddress,
      transactionLength: result.transaction.length
    });
    
    return result;
    
  } catch (error) {
    console.error('Error in prepareCreateTokenTransaction - Full details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      tokenData: { name, symbol, decimals, supply, ownerWallet, mintPublicKey }
    });
    
    // Provide more specific error messages
    if (error.message.includes('Invalid public key')) {
      throw new Error(`Invalid wallet address or mint public key format: ${error.message}`);
    } else if (error.message.includes('Missing required fields')) {
      throw error;
    } else if (error.message.includes('Decimals must be')) {
      throw error;
    } else if (error.message.includes('Supply must be')) {
      throw error;
    } else if (error.message.includes('Network request failed') || error.message.includes('fetch')) {
      throw new Error(`Solana network connection failed: ${error.message}`);
    } else if (error.message.includes('rent exempt')) {
      throw new Error(`Failed to get rent exempt balance: ${error.message}`);
    } else if (error.message.includes('serialize')) {
      throw new Error(`Transaction serialization failed: ${error.message}`);
    } else {
      throw new Error(`Token creation preparation failed: ${error.message}`);
    }
  }
};

/**
 * Get comprehensive token information by address, with NO caching.
 * @param {string} tokenAddress - Token mint address
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {Object} Token information
 */
const getTokenInfo = async (tokenAddress, network = 'devnet') => {
  let retries = 3;
  let lastError = null;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  while (retries > 0) {
    try {
      const connection = getConnection(network);
      const mintPublicKey = new PublicKey(tokenAddress);
      
      // Get mint info
      const mintInfo = await getMint(connection, mintPublicKey);
      
      // Robust token accounts fetch for all web3.js versions
      let tokenAccounts;
      if (typeof connection.getParsedTokenAccountsByMint === 'function') {
        tokenAccounts = await connection.getParsedTokenAccountsByMint(mintPublicKey);
      } else if (typeof connection.getParsedProgramAccounts === 'function') {
        tokenAccounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              { dataSize: 165 },
              { memcmp: { offset: 0, bytes: mintPublicKey.toBase58() } }
            ]
          }
        );
        tokenAccounts = { value: tokenAccounts };
      } else if (typeof connection.getProgramAccounts === 'function') {
        tokenAccounts = await connection.getProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              { dataSize: 165 },
              { memcmp: { offset: 0, bytes: mintPublicKey.toBase58() } }
            ]
          }
        );
        tokenAccounts = { value: tokenAccounts };
      } else {
        throw new Error('No compatible method to fetch token accounts');
      }
      const holders = tokenAccounts.value.length;
      
      // Try to get largest accounts with retry logic for this specific call
      let largestAccounts;
      let largestAccountRetries = 2;
      while (largestAccountRetries > 0) {
        try {
          largestAccounts = await connection.getTokenLargestAccounts(mintPublicKey);
          break;
        } catch (largestAccountError) {
          if (largestAccountRetries <= 1) {
            console.warn('Could not fetch largest accounts, continuing with partial data:', largestAccountError.message);
            // Provide a default empty value to avoid errors
            largestAccounts = { value: [] };
            break;
          }
          largestAccountRetries--;
          await delay(1000); // Wait before retrying
        }
      }
      
      const tokenInfo = {
        address: tokenAddress,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        mintAuthority: mintInfo.mintAuthority?.toString() || null,
        freezeAuthority: mintInfo.freezeAuthority?.toString() || null,
        isInitialized: mintInfo.isInitialized,
        holders,
        largestAccounts: largestAccounts.value.map(account => ({
          address: account.address.toString(),
          amount: account.amount,
          decimals: account.decimals || mintInfo.decimals // Fallback to mint decimals if not available
        }))
      };

      return tokenInfo;
    } catch (error) {
      lastError = error;
      
      // Handle specific error cases
      if (
        error.name === 'TokenAccountNotFoundError' ||
        error.message.includes('Invalid public key') ||
        error.message.includes('invalid') ||
        error.message.includes('not found')
      ) {
        // This is an expected error if the token address is wrong, so we'll handle it gracefully
        console.log(`Token not found or invalid address: ${tokenAddress}`);
        return null; // Return null to indicate not found
      }
      
      // Handle rate limiting errors
      if (
        error.message.includes('429') || 
        error.message.includes('Too many requests') ||
        error.message.includes('rate limit')
      ) {
        console.warn(`Rate limit hit while fetching token info (retries left: ${retries}):`, error.message);
        retries--;
        
        if (retries > 0) {
          // Exponential backoff: wait longer between each retry
          const backoffTime = (4 - retries) * 1500;
          await delay(backoffTime);
          continue;
        }
      }
      
      // For other unexpected errors, we still want to see them
      console.error('Error in getTokenInfo:', error);
      retries--;
      
      if (retries > 0) {
        await delay(1000); // Wait before retrying
      }
    }
  }
  
  // All retries failed
  throw lastError || new Error('Failed to fetch token information after multiple attempts');
};

/**
 * Get token accounts for a specific owner
 * @param {string} ownerAddress - Owner wallet address
 * @param {string} network - Solana network (devnet, testnet, mainnet-beta)
 * @returns {Array} Array of token accounts
 */
const getTokenAccountsByOwner = async (ownerAddress, network = 'devnet') => {
  let retries = 3;
  let lastError = null;
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  while (retries > 0) {
    try {
      const connection = getConnection(network);
      const ownerPublicKey = new PublicKey(ownerAddress);

      let tokenAccounts;
      if (typeof connection.getParsedTokenAccountsByOwner === 'function') {
        tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          ownerPublicKey,
          { programId: TOKEN_PROGRAM_ID }
        );
        return tokenAccounts.value.map(account => {
          const data = account.account.data.parsed.info;
          return {
            address: account.pubkey.toString(),
            mint: data.mint,
            owner: data.owner,
            amount: data.tokenAmount.amount,
            decimals: data.tokenAmount.decimals,
            uiAmount: data.tokenAmount.uiAmount
          };
        });
      } else if (typeof connection.getProgramAccounts === 'function') {
        // Fallback for older/newer web3.js: get raw accounts and parse manually
        tokenAccounts = await connection.getProgramAccounts(
          TOKEN_PROGRAM_ID,
          {
            filters: [
              { dataSize: 165 },
              { memcmp: { offset: 32, bytes: ownerPublicKey.toBase58() } }
            ]
          }
        );
        // You may need to decode the account data here if you want more info
        return tokenAccounts.map(account => ({
          address: account.pubkey.toString(),
          mint: '', // You can decode this from account.account.data if needed
          owner: ownerAddress,
          amount: '', // You can decode this from account.account.data if needed
          decimals: '', // You can decode this from account.account.data if needed
          uiAmount: ''
        }));
      } else {
        throw new Error('No compatible method to fetch token accounts');
      }
    } catch (error) {
      lastError = error;
      
      // Handle rate limiting errors
      if (
        error.message.includes('429') || 
        error.message.includes('Too many requests') ||
        error.message.includes('rate limit')
      ) {
        console.warn(`Rate limit hit while fetching token accounts (retries left: ${retries}):`, error.message);
        retries--;
        
        if (retries > 0) {
          // Exponential backoff: wait longer between each retry
          const backoffTime = (4 - retries) * 1500;
          await delay(backoffTime);
          continue;
        }
      }
      
      console.error('Error in getTokenAccountsByOwner:', error);
      retries--;
      
      if (retries > 0) {
        await delay(1000); // Wait before retrying
      }
    }
  }
  
  // All retries failed
  if (lastError) {
    // If we've exhausted all retries but still have an error,
    // return an empty array instead of throwing to avoid breaking the UI
    console.error('Failed to fetch token accounts after multiple attempts:', lastError);
    return [];
  }
  
  return [];
};

/**
 * Prepares a transaction to transfer tokens and sends it to the client for signing.
 * @param {Object} transferData - Contains token mint, sender, recipient, amount, and decimals.
 * @param {Connection} connection - The Solana connection object.
 * @returns {Object} A base64 encoded, unsigned transaction.
 */
const transferTokens = async (transferData, connection) => {
  const {
    tokenMint,
    sender,
    recipient,
    amount,
    decimals
  } = transferData;

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    const senderPublicKey = new PublicKey(sender);
    const recipientPublicKey = new PublicKey(recipient);

    const fromAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      senderPublicKey
    );
    const toAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPublicKey,
      recipientPublicKey
    );
    
    // Check if the recipient's associated token account exists. If not, create it.
    const toTokenAccountInfo = await connection.getAccountInfo(toAssociatedTokenAccount);

    const transaction = new Transaction({
      feePayer: senderPublicKey,
    });
    
    if (!toTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          senderPublicKey, // Payer
          toAssociatedTokenAccount,
          recipientPublicKey,
          mintPublicKey
        )
      );
    }

    transaction.add(
      createTransferInstruction(
        fromAssociatedTokenAccount,
        toAssociatedTokenAccount,
        senderPublicKey, // The owner of the "from" account is the sender
        BigInt(amount * (10 ** decimals))
      )
    );

    transaction.recentBlockhash = '11111111111111111111111111111111';
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // It's not signed yet
    });

    return {
      transaction: serializedTransaction.toString('base64'),
    };

  } catch (error) {
    console.error('Error preparing token transfer transaction:', error);
    throw error;
  }
};

/**
 * Prepares a transaction to mint additional tokens for client-side signing.
 * @param {Object} mintData - Mint parameters
 * @param {Connection} connection - The Solana connection object.
 * @returns {Object} A base64 encoded, unsigned transaction.
 */
const mintAdditionalTokens = async (mintData, connection) => {
  const {
    tokenMint,
    destinationAccount,
    amount,
    decimals,
    mintAuthority, // Public key of the mint authority
  } = mintData;

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    const destinationPublicKey = new PublicKey(destinationAccount);
    const mintAuthorityPublicKey = new PublicKey(mintAuthority);
    
    const transaction = new Transaction({
      feePayer: mintAuthorityPublicKey,
    });

    transaction.add(
      createMintToInstruction(
        mintPublicKey,
        destinationPublicKey,
        mintAuthorityPublicKey,
        BigInt(amount * (10 ** decimals))
      )
    );

    transaction.recentBlockhash = '11111111111111111111111111111111';
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // It's not signed yet
    });

    return {
      transaction: serializedTransaction.toString('base64'),
    };
  } catch (error) {
    console.error('Error in mintAdditionalTokens:', error);
    throw error;
  }
};

/**
 * Prepares a transaction to burn tokens for client-side signing.
 * @param {Object} burnData - Burn parameters
 * @param {Connection} connection - The Solana connection object.
 * @returns {Object} A base64 encoded, unsigned transaction.
 */
const burnTokens = async (burnData, connection) => {
  const {
    tokenMint,
    tokenAccount, // The specific token account to burn from
    amount,
    decimals,
    owner, // Public key of the token account owner
  } = burnData;

  try {
    const mintPublicKey = new PublicKey(tokenMint);
    const tokenAccountPublicKey = new PublicKey(tokenAccount);
    const ownerPublicKey = new PublicKey(owner);

    const transaction = new Transaction({
      feePayer: ownerPublicKey,
    });

    transaction.add(
      createBurnInstruction(
        tokenAccountPublicKey,
        mintPublicKey,
        ownerPublicKey,
        BigInt(amount * (10 ** decimals))
      )
    );

    transaction.recentBlockhash = '11111111111111111111111111111111';
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false, // It's not signed yet
    });

    return {
      transaction: serializedTransaction.toString('base64'),
    };
  } catch (error) {
    console.error('Error in burnTokens:', error);
    throw error;
  }
};

module.exports = {
  prepareCreateTokenTransaction,
  getTokenInfo,
  getTokenAccountsByOwner,
  transferTokens,
  mintAdditionalTokens,
  burnTokens,
  getMint,
  TOKEN_PROGRAM_ID
};