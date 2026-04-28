/**
 * Base URL for the ORIGINER API as seen from the browser and from server-side
 * code that must call the backend (e.g. Server Actions).
 *
 * Keep in sync with `next.config.js` `env.NEXT_PUBLIC_API_URL` default and
 * `services/api/client.ts`.
 */
export function getPublicApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4094';
}
