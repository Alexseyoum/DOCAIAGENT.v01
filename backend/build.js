const fs = require('fs');
const path = require('path');

// Copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy public folder to dist
const publicSrc = path.join(__dirname, 'public');
const publicDest = path.join(__dirname, 'dist', 'public');

if (fs.existsSync(publicSrc)) {
  console.log('Copying public folder to dist...');
  copyDir(publicSrc, publicDest);
  console.log('✓ Public folder copied successfully');
} else {
  console.log('Warning: public folder not found');
}
