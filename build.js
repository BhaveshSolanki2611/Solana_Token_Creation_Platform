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

  // Copy client build to public folder for server
  console.log('\n📋 Preparing for deployment...');
  
  // Create public directory if it doesn't exist
  if (!fs.existsSync(path.join(__dirname, 'public'))) {
    fs.mkdirSync(path.join(__dirname, 'public'));
  }
  
  // Custom script for copying files (instead of cp -r which is not cross-platform)
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (let entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyDir(
    path.join(__dirname, 'client', 'build'),
    path.join(__dirname, 'public')
  );

  console.log('\n✅ Build completed successfully!');

} catch (error) {
  console.error('\n❌ Build failed:', error);
  process.exit(1);
} 