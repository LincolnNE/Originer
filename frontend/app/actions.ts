'use server';

import { redirect } from 'next/navigation';

/**
 * Start a session via the backend (must match POST /api/v1/sessions/start).
 * Server actions run on the Node server; use an absolute API base — relative
 * /api/v1/... URLs hit the Next app and return 404 when the API is on another host.
 */
export async function startSession() {
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:4094');
  const apiUrl = `${apiBase}/api/v1/sessions/start`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: 'default',
        learner_id: 'learner_mvp',
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();

    const sessionId = result?.data?.session_id as string | undefined;
    if (result.success && sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
