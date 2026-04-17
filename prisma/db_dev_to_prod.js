import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load DATABASE_URL from .env
const envPath = resolve(process.cwd(), '.env');
const envContent = readFileSync(envPath, 'utf-8');
const match = envContent.match(/^DATABASE_URL=['"]?([^'"\n]+)['"]?/m);
if (!match) {
  console.error('DATABASE_URL not found in .env');
  process.exit(1);
}
const devUrl = match[1];

// Prod URL passed as CLI argument
const prodUrl = process.argv[2];
if (!prodUrl) {
  console.error('Usage: node prisma/db_dev_to_prod.js <PROD_DATABASE_URL>');
  process.exit(1);
}

const dumpFile = './db_dump.bak';

console.log('Dumping dev database...');
execSync(`pg_dump -Fc -v -d "${devUrl}" -n public -f ${dumpFile}`, { stdio: 'inherit' });

console.log('Dropping and recreating public schema on prod...');
execSync(`psql "${prodUrl}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`, { stdio: 'inherit' });

console.log('Restoring to prod...');
execSync(`pg_restore -d "${prodUrl}" -v ${dumpFile}`, { stdio: 'inherit' });

console.log('-complete-');
