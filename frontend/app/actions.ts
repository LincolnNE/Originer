'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const path = '/api/v1/sessions/start';
  const apiUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}${path}` : path;

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: 'default',
        learner_id: 'default',
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

  let result: { success?: boolean; data?: { session_id?: string } };
  try {
    result = await response.json();
  } catch {
    redirect('/');
  }

  const sessionId = result.data?.session_id;
  if (result.success && typeof sessionId === 'string' && sessionId.length > 0) {
    redirect(`/lessons/${sessionId}/screen_001`);
  }

  redirect('/');
}
