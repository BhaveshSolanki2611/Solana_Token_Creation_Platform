const { execSync } = require('child_process');

console.log('🚀 Starting client build process for Vercel...');

try {
  // Install dependencies with legacy peer deps
  console.log('\n📦 Installing client dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
  
  // Build the client with fallback
  console.log('\n🛠️ Building client...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (buildError) {
    console.log('\n⚠️ Primary build failed, trying fallback...');
    execSync('npm run build:fallback', { stdio: 'inherit' });
  }
  
  console.log('\n✅ Client build completed successfully!');
} catch (error) {
  console.error('\n❌ Client build failed:', error);
  process.exit(1);
}