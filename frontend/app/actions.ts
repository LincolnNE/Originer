'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { resolveBackendOriginForServerAction } from '@/lib/server-api-origin';

/**
 * Base URL for API calls from Server Actions.
 *
 * `next.config.js` injects NEXT_PUBLIC_API_URL with a localhost default for local dev. On Vercel
 * that value is baked into the build when the project env var is missing, so we must not call
 * localhost from serverless — use VERCEL_URL or the incoming request Host (Node fetch requires an
 * absolute URL; relative `/api/v1` throws).
 */
function apiV1Base(): string {
  const h = headers();
  const origin = resolveBackendOriginForServerAction({
    nextPublicApiUrl: process.env.NEXT_PUBLIC_API_URL,
    vercel: process.env.VERCEL,
    vercelUrl: process.env.VERCEL_URL,
    nodeEnv: process.env.NODE_ENV,
    forwardedProto: h.get('x-forwarded-proto'),
    forwardedHost: h.get('x-forwarded-host'),
    host: h.get('host'),
  });
  return `${origin.replace(/\/$/, '')}/api/v1`;
}

export async function startSession() {
  const apiBase = apiV1Base();

  try {
    // Single round-trip: instructor + learner + session on one serverless instance
    // (three separate POSTs can hit different instances with isolated :memory: SQLite).
    const sessionRes = await fetch(`${apiBase}/sessions/quick-start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor: { name: 'Instructor', tone: 'friendly' },
        learner: { name: 'Learner', level: 'beginner' },
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!sessionRes.ok) {
      redirect('/');
      return;
    }

    const result = await sessionRes.json();

    if (result.success && result.data?.session_id) {
      redirect(`/lessons/${result.data.session_id}/screen_001`);
    } else {
      redirect('/');
    }
  } catch {
    redirect('/');
  }
}
