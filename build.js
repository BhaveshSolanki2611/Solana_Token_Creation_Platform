const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Production build script for Vercel
console.log('🚀 Starting build process...');

try {
  // Install server dependencies
  console.log('\n📦 Installing server dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });

  // Install client dependencies
  console.log('\n📦 Installing client dependencies...');
  execSync('cd client && npm install --legacy-peer-deps', { stdio: 'inherit' });

  // Build client
  console.log('\n🛠️ Building client...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  console.log('\n✅ Build completed successfully!');
  console.log('📁 Client build available at: client/build/');
  console.log('🚀 API serverless function available at: api/index.js');

} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
}