const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const buildInfo = path.join(projectRoot, 'tsconfig.tsbuildinfo');

for (const target of [distDir, buildInfo]) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

execSync('npx tsc -p tsconfig.json', {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env,
});
