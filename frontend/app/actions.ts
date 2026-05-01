'use server';

import { redirect } from 'next/navigation';

/**
 * Base URL for API calls from Server Actions.
 *
 * `next.config.js` injects NEXT_PUBLIC_API_URL with a localhost default for local dev. On Vercel
 * that value is baked into the build when the project env var is missing, so we must not call
 * localhost from serverless — use this deployment's origin (VERCEL_URL) or same-origin `/api/v1`.
 */
function apiV1Base(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  const isLocalDevDefault =
    raw === '' || raw === 'http://localhost:4094' || raw === 'http://127.0.0.1:4094';

  if (process.env.VERCEL && isLocalDevDefault) {
    const vercelHost = process.env.VERCEL_URL;
    if (vercelHost) {
      return `https://${vercelHost}/api/v1`;
    }
    return '/api/v1';
  }

  if (raw) {
    return `${raw}/api/v1`;
  }
  return '/api/v1';
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
