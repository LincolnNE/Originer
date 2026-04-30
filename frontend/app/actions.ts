'use server';

import { redirect } from 'next/navigation';

/** Default IDs for MVP demo flow; must match rows ensured by POST /api/v1/sessions/start. */
const DEFAULT_INSTRUCTOR_ID = 'default_instructor';
const DEFAULT_LEARNER_ID = 'default_learner';

/** Same default as `frontend/services/api/client.ts`; server actions cannot use relative fetch URLs. */
const DEFAULT_API_BASE = 'http://localhost:4094';

function sessionsStartUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.INTERNAL_API_URL ||
    DEFAULT_API_BASE
  ).replace(/\/$/, '');
  return `${base}/api/v1/sessions/start`;
}

export async function startSession() {
  const apiUrl = sessionsStartUrl();

  // `redirect()` throws NEXT_REDIRECT; it must not run inside a catch-all try/catch
  // or successful navigation is swallowed and the user always lands on `/`.

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: process.env.DEFAULT_INSTRUCTOR_ID || DEFAULT_INSTRUCTOR_ID,
        learner_id: process.env.DEFAULT_LEARNER_ID || DEFAULT_LEARNER_ID,
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });
  } catch {
    redirect('/');
  }

  if (!response.ok) {
    redirect('/');
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    redirect('/');
  }

  const data = result as {
    success?: boolean;
    data?: { session_id?: string };
  };

  const sessionId =
    data.success && data.data?.session_id
      ? (data.data.session_id as string)
      : null;

  if (sessionId) {
    redirect(`/lessons/${sessionId}/screen_001`);
  }

  redirect('/');
}
