const { execFileSync } = require('node:child_process');
const { join } = require('node:path');
// Finder/iCloud can add these metadata attributes to newly built .app folders.
// Only clean build output before signing, never user-installed apps or quarantine.
module.exports = async context => {
  if (context.electronPlatformName !== 'darwin') return;
  const app = join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  for (const attribute of ['com.apple.FinderInfo', 'com.apple.ResourceFork']) {
    try { execFileSync('xattr', ['-dr', attribute, app], { stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 4 * 1024 * 1024 }); }
    catch (error) {
      if (error.status !== 1 || !String(error.stderr).includes('No such xattr')) throw error;
    }
  }
};
