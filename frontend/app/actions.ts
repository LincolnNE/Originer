'use server';

import { redirect } from 'next/navigation';

/** Matches bootstrap rows in `DatabaseStorageAdapter` so fresh SQLite DBs can start sessions. */
const DEFAULT_INSTRUCTOR_ID =
  process.env.ORIGINER_DEFAULT_INSTRUCTOR_ID ?? 'default_instructor';
const DEFAULT_LEARNER_ID =
  process.env.ORIGINER_DEFAULT_LEARNER_ID ?? 'default_learner';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/sessions/start`
    : '/api/v1/sessions/start';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: DEFAULT_INSTRUCTOR_ID,
        learner_id: DEFAULT_LEARNER_ID,
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();

    const sessionId = result.success ? result.data?.session_id : undefined;
    if (sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
