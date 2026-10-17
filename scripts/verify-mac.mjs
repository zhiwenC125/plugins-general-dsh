import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';
if (process.platform !== 'darwin') throw new Error('macOS verification requires macOS');
const app = resolve(process.argv[2] || 'dist/mac-arm64/Revolution.app');
for (const target of [app, join(app, 'Contents/Resources/app/node_modules/node/bin/node')]) {
  execFileSync('codesign', ['--verify', '--deep', '--strict', '--verbose=2', target], { stdio: 'inherit' });
}
console.log('PASS: application bundle and bundled Node signatures verify.');
console.log('Ad-hoc internal preview only: this does NOT establish Developer ID trust or Apple notarization.');
