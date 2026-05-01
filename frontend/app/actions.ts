'use server';

import { redirect } from 'next/navigation';

/**
 * Base URL for API calls from Server Actions.
 * When NEXT_PUBLIC_API_URL is unset, use same-origin `/api/v1` so requests hit this deployment's
 * Vercel rewrite (never use path-relative `fetch('/api/...')` — Node resolves that incorrectly).
 */
function apiV1Base(): string {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return origin ? `${origin}/api/v1` : '/api/v1';
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
