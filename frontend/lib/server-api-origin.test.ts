import { describe, expect, it } from 'vitest';

import { resolveBackendOriginForServerAction } from './server-api-origin';

describe('resolveBackendOriginForServerAction', () => {
  it('uses https://VERCEL_URL when on Vercel with baked localhost API URL', () => {
    expect(
      resolveBackendOriginForServerAction({
        nextPublicApiUrl: 'http://localhost:4094',
        vercel: '1',
        vercelUrl: 'my-app-abc123.vercel.app',
        nodeEnv: 'production',
        forwardedProto: 'https',
        forwardedHost: null,
        host: 'my-app-abc123.vercel.app',
      })
    ).toBe('https://my-app-abc123.vercel.app');
  });

  it('uses request Host when VERCEL_URL is missing on Vercel', () => {
    expect(
      resolveBackendOriginForServerAction({
        nextPublicApiUrl: 'http://localhost:4094',
        vercel: '1',
        vercelUrl: undefined,
        nodeEnv: 'production',
        forwardedProto: 'https',
        forwardedHost: 'custom.example.com',
        host: 'internal-host',
      })
    ).toBe('https://custom.example.com');
  });

  it('uses explicit NEXT_PUBLIC_API_URL when not the localhost default', () => {
    expect(
      resolveBackendOriginForServerAction({
        nextPublicApiUrl: 'https://api.example.com',
        vercel: '1',
        vercelUrl: 'x.vercel.app',
        nodeEnv: 'production',
        forwardedProto: 'https',
        forwardedHost: null,
        host: 'app.vercel.app',
      })
    ).toBe('https://api.example.com');
  });

  it('uses localhost backend in development with default public URL', () => {
    expect(
      resolveBackendOriginForServerAction({
        nextPublicApiUrl: 'http://localhost:4094',
        vercel: undefined,
        vercelUrl: undefined,
        nodeEnv: 'development',
        forwardedProto: 'http',
        forwardedHost: null,
        host: 'localhost:3000',
      })
    ).toBe('http://localhost:4094');
  });
});
