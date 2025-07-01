const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build process...\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`📋 Node.js version: ${nodeVersion}`);

if (parseInt(nodeVersion.slice(1)) < 18) {
  console.error('❌ Node.js 18+ is required for production build');
  process.exit(1);
}

try {
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  const clientBuildPath = path.join(__dirname, '../client/build');
  const publicPath = path.join(__dirname, '../public');
  
  if (fs.existsSync(clientBuildPath)) {
    fs.rmSync(clientBuildPath, { recursive: true, force: true });
    console.log('   • Removed client/build directory');
  }
  if (fs.existsSync(publicPath)) {
    fs.rmSync(publicPath, { recursive: true, force: true });
    console.log('   • Removed public directory');
  }

  // 2. Install server dependencies
  console.log('\n📦 Installing server dependencies...');
  execSync('npm install --legacy-peer-deps --production=false', { stdio: 'inherit' });

  // 3. Install client dependencies
  console.log('\n📦 Installing client dependencies...');
  execSync('cd client && npm install --legacy-peer-deps --production=false', { stdio: 'inherit' });

  // 4. Build client
  console.log('\n🛠️ Building client application...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // 5. Verify build
  console.log('\n✅ Verifying build...');
  const buildPath = path.join(__dirname, '../client/build');
  if (!fs.existsSync(buildPath)) {
    throw new Error('Client build directory not found');
  }

  const indexPath = path.join(buildPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('Client build index.html not found');
  }

  // 6. Check environment variables
  console.log('\n🔍 Checking environment configuration...');
  const requiredEnvVars = ['MONGODB_URI'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Make sure to set these in your deployment environment');
  }

  // 7. Production readiness check
  console.log('\n🔍 Production readiness check...');
  
  // Check package.json
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  if (!packageJson.engines || !packageJson.engines.node) {
    console.warn('⚠️ Node.js engine version not specified in package.json');
  }

  // Check vercel.json
  if (!fs.existsSync(path.join(__dirname, '../vercel.json'))) {
    console.warn('⚠️ vercel.json not found - deployment may fail');
  }

  console.log('\n✅ Production build completed successfully!');
  console.log('\n📋 Build Summary:');
  console.log(`   • Client build: ${buildPath}`);
  console.log(`   • Server entry: server/index.js`);
  console.log(`   • Node.js version: ${nodeVersion}`);
  console.log(`   • Environment: ${process.env.NODE_ENV || 'development'}`);
  
  console.log('\n🚀 Ready for deployment to Vercel!');
  console.log('   Run: vercel --prod');

} catch (error) {
  console.error('\n❌ Production build failed:', error.message);
  process.exit(1);
}