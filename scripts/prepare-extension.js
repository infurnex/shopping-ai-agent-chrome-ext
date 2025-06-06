import { copyFile, mkdir, readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const srcDir = './public';
const distDir = './dist';

async function copyPublicFiles() {
  try {
    // Read all files from public directory
    const files = await readdir(srcDir);
    
    // Create icons directory if it doesn't exist
    try {
      await mkdir(join(distDir, 'icons'), { recursive: true });
    } catch (e) {
      // Directory might already exist
    }
    
    // Copy each file to dist
    for (const file of files) {
      // Skip directories
      if (file === 'icons') {
        const iconFiles = await readdir(join(srcDir, 'icons'));
        for (const iconFile of iconFiles) {
          await copyFile(
            join(srcDir, 'icons', iconFile),
            join(distDir, 'icons', iconFile)
          );
        }
        continue;
      }
      
      await copyFile(join(srcDir, file), join(distDir, file));
    }
    
    console.log('Public files copied to dist directory');
  } catch (err) {
    console.error('Error copying public files:', err);
  }
}

// Update manifest.json version from package.json
async function updateManifestVersion() {
  try {
    const packageJson = JSON.parse(await readFile('./package.json', 'utf8'));
    const manifestPath = join(distDir, 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    
    manifest.version = packageJson.version;
    
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`Updated manifest version to ${packageJson.version}`);
  } catch (err) {
    console.error('Error updating manifest version:', err);
  }
}

async function main() {
  await copyPublicFiles();
  await updateManifestVersion();
  console.log('Extension preparation complete');
}

main();