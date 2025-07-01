const { execSync } = require('child_process');

console.log('🚀 Starting client build process for Vercel...');

try {
  // Install dependencies with legacy peer deps
  console.log('\n📦 Installing client dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Build the client
  console.log('\n🛠️ Building client...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('\n✅ Client build completed successfully!');
} catch (error) {
  console.error('\n❌ Client build failed:', error);
  process.exit(1);
} 