/**
 * Resolves the backend HTTP origin for Server Actions and other Node-side fetch calls.
 * Node's fetch cannot use relative URLs (no browser origin); this must always be absolute.
 */
export function resolveBackendOriginForServerAction(input: {
  nextPublicApiUrl: string | undefined;
  vercel: string | undefined;
  vercelUrl: string | undefined;
  nodeEnv: string | undefined;
  forwardedProto: string | null;
  forwardedHost: string | null;
  host: string | null;
}): string {
  const raw = (input.nextPublicApiUrl ?? '').replace(/\/$/, '');
  const isLocalDevDefault =
    raw === '' || raw === 'http://localhost:4094' || raw === 'http://127.0.0.1:4094';

  if (input.vercel && isLocalDevDefault) {
    if (input.vercelUrl) {
      return `https://${input.vercelUrl}`;
    }
    const proto = input.forwardedProto ?? 'https';
    const h = input.forwardedHost || input.host;
    if (h) {
      return `${proto}://${h}`;
    }
    return 'http://localhost:4094';
  }

  if (raw && !isLocalDevDefault) {
    return raw;
  }

  if (input.nodeEnv === 'development' && isLocalDevDefault) {
    return 'http://localhost:4094';
  }

  const proto = input.forwardedProto ?? 'http';
  const h = input.forwardedHost || input.host;
  if (h) {
    return `${proto}://${h}`;
  }
  return 'http://localhost:4094';
}
