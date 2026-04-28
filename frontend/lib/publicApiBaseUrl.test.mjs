/**
 * Run: node --experimental-strip-types frontend/lib/publicApiBaseUrl.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('getPublicApiBaseUrl uses localhost:4094 when NEXT_PUBLIC_API_URL is unset', async () => {
  const prev = process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_API_URL;
  try {
    const { getPublicApiBaseUrl } = await import('./publicApiBaseUrl.ts');
    assert.strictEqual(getPublicApiBaseUrl(), 'http://localhost:4094');
  } finally {
    if (prev !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = prev;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
  }
});

test('getPublicApiBaseUrl reads NEXT_PUBLIC_API_URL when set', async () => {
  const prev = process.env.NEXT_PUBLIC_API_URL;
  process.env.NEXT_PUBLIC_API_URL = 'https://example.com';
  try {
    const { getPublicApiBaseUrl } = await import('./publicApiBaseUrl.ts');
    assert.strictEqual(getPublicApiBaseUrl(), 'https://example.com');
  } finally {
    if (prev !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = prev;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
  }
});
