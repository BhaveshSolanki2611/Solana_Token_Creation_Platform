const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

// Import database utility
const { connectToDatabase } = require('../server/utils/database');

// Initialize express app
const app = express();

// Middleware to ensure database connection (MUST be first)
app.use(async (req, res, next) => {
  try {
    // Only attempt database connection for non-critical paths
    // Skip database connection for token creation critical path
    if (req.path === '/api/tokens' && req.method === 'POST') {
      console.log('Skipping database connection for token creation');
      return next();
    }
    
    // For other endpoints, attempt connection with timeout
    const connectionPromise = connectToDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('Database connection established for:', req.path);
  } catch (error) {
    console.warn('Database connection middleware warning:', error.message);
    // Don't fail the request, just log the warning
    // Application will work without database for critical operations
  }
  next();
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration - Updated for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [
        'https://solana-token-creation-platform-ten.vercel.app',
        'https://solana-token-creation-platform.vercel.app',
        /\.vercel\.app$/,
        process.env.CLIENT_URL
      ].filter(Boolean)
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({
      status: 'ok',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Define routes
app.use('/api/tokens', require('../server/routes/tokens'));
app.use('/api/wallet', require('../server/routes/wallet'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.message
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid data format',
      details: err.message
    });
  }
  
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'Resource already exists'
    });
  }
  
  res.status(err.status || 500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// Export the Express API
module.exports = app;