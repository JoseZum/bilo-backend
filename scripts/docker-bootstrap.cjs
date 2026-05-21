const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

function run(command) {
  execSync(command, {
    cwd: projectRoot,
    stdio: 'inherit',
    env: process.env,
  });
}

async function main() {
  fs.mkdirSync(dataDir, { recursive: true });

  run('npx prisma db push --accept-data-loss --skip-generate');

  if (process.env.AUTO_SEED === 'false') {
    return;
  }

  const prisma = new PrismaClient();
  try {
    const propertyCount = await prisma.property.count();
    if (propertyCount === 0) {
      const seedMode = process.env.SEED_MODE === 'basic' ? '' : ' --live';
      run(`npx ts-node prisma/seed.ts${seedMode}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Docker bootstrap failed');
  console.error(error);
  process.exit(1);
});
