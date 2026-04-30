import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Resolve SQLite database file path.
 * - Explicit `:memory:` is honored (tests / ephemeral).
 * - Non-empty DATABASE_PATH uses that path (parent dirs created when not :memory:).
 * - Default: durable file — Vercel/serverless uses tmpdir; otherwise ./data/originer.sqlite.
 */
export function resolveDatabasePath(): string {
  const fromEnv = process.env.DATABASE_PATH?.trim();

  if (fromEnv === ':memory:') {
    return ':memory:';
  }

  if (fromEnv) {
    const resolved = path.isAbsolute(fromEnv)
      ? fromEnv
      : path.join(process.cwd(), fromEnv);
    if (resolved !== ':memory:') {
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
    }
    return resolved;
  }

  if (process.env.VERCEL === '1') {
    const file = path.join(os.tmpdir(), 'originer.sqlite');
    return file;
  }

  const dataDir = path.join(process.cwd(), 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, 'originer.sqlite');
}
