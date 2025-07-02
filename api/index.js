const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

// Initialize express app
const app = express();

// Middleware
app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'https://token-creation-platform.vercel.app', /\.vercel\.app$/] 
    : 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Define routes
app.use('/api/tokens', require('../server/routes/tokens'));
app.use('/api/wallet', require('../server/routes/wallet'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Import database utility
const { connectToDatabase } = require('../server/utils/database');

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Database connection middleware error:', error);
  }
  next();
});

// Export the Express API
module.exports = app;