'use server';

import { redirect } from 'next/navigation';

/**
 * Landing-page session bootstrap.
 * Must match POST /api/v1/sessions/start (see src/routes/sessions.ts).
 */
export async function startSession() {
  const apiBaseUrl =
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');
  const apiUrl = apiBaseUrl
    ? `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sessions/start`
    : '/api/v1/sessions/start';

  const instructorId =
    process.env.DEFAULT_INSTRUCTOR_ID || 'default_instructor';
  const learnerId =
    process.env.DEFAULT_LEARNER_ID ||
    `learner_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: instructorId,
        learner_id: learnerId,
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();

    const sessionId =
      result.success &&
      (result.data?.session?.id ?? result.data?.session_id);

    if (sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch {
    redirect('/');
  }
}
