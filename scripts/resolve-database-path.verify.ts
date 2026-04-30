/**
 * Quick verification for resolveDatabasePath (run: npm run test:db-path).
 */
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveDatabasePath } from '../src/services/resolve-database-path';

const origDb = process.env.DATABASE_PATH;
const origVercel = process.env.VERCEL;

function restoreEnv() {
  if (origDb === undefined) delete process.env.DATABASE_PATH;
  else process.env.DATABASE_PATH = origDb;
  if (origVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = origVercel;
}

try {
  // Explicit in-memory
  process.env.DATABASE_PATH = ':memory:';
  delete process.env.VERCEL;
  assert.strictEqual(resolveDatabasePath(), ':memory:');

  // Vercel default → file under tmpdir, not memory
  delete process.env.DATABASE_PATH;
  process.env.VERCEL = '1';
  const vercelPath = resolveDatabasePath();
  assert.notStrictEqual(vercelPath, ':memory:');
  assert(vercelPath.includes(os.tmpdir()) || vercelPath.startsWith('/tmp'));

  // Local default → ./data/originer.sqlite
  delete process.env.DATABASE_PATH;
  delete process.env.VERCEL;
  const localPath = resolveDatabasePath();
  assert.strictEqual(
    path.basename(localPath),
    'originer.sqlite',
    'local default basename'
  );
  assert(fs.existsSync(path.dirname(localPath)));

  // Custom relative path: parent created
  const customRel = path.join('data', 'test-resolve', 'custom.sqlite');
  process.env.DATABASE_PATH = customRel;
  delete process.env.VERCEL;
  const customResolved = resolveDatabasePath();
  assert(customResolved.endsWith(customRel.replace(/\//g, path.sep)));
  assert(fs.existsSync(path.dirname(customResolved)));

  fs.rmSync(path.dirname(customResolved), { recursive: true, force: true });

  console.log('resolveDatabasePath: all checks passed');
} finally {
  restoreEnv();
}
