const { execSync } = require('child_process');

try {
  const out = execSync('npx oxlint -D warnings', { stdio: 'pipe' }).toString();
  console.log('Passed:', out);
} catch (err) {
  const out = err.stdout ? err.stdout.toString() : err.message;
  const blocks = out.split('\n\n');
  for (const block of blocks) {
    if (block.startsWith('  x ') || block.includes('error:')) {
      console.log('--- ACTUAL ERROR BLOCK ---');
      console.log(block);
    }
  }
}
