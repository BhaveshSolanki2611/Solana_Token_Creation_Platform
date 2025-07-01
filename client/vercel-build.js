const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting client build process for Vercel...');

try {
  // Install dependencies with legacy peer deps
  console.log('\n📦 Installing client dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Ensure crypto-browserify is installed
  console.log('\n🔐 Ensuring crypto-browserify is installed...');
  execSync('npm install crypto-browserify --save', { stdio: 'inherit' });
  
  // Create a simple browserify shim if needed
  console.log('\n🛠️ Setting up crypto polyfill...');
  const cryptoShimPath = path.join(__dirname, 'node_modules', 'crypto-browserify', 'shim.js');
  const shimExists = fs.existsSync(cryptoShimPath);
  
  if (!shimExists) {
    console.log('Creating crypto-browserify shim...');
    fs.writeFileSync(
      cryptoShimPath,
      'module.exports = require("./index.js");'
    );
  }
  
  // Build the client with fallback
  console.log('\n🛠️ Building client...');
  try {
    execSync('CI=false npm run build', { stdio: 'inherit' });
  } catch (buildError) {
    console.log('\n⚠️ Primary build failed, trying fallback...');
    execSync('CI=false npm run build:fallback', { stdio: 'inherit' });
  }
  
  console.log('\n✅ Client build completed successfully!');
} catch (error) {
  console.error('\n❌ Client build failed:', error);
  process.exit(1);
}