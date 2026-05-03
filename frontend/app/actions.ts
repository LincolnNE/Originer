'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const path = '/api/v1/sessions/start';
  const apiUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}${path}` : path;

  try {
    const learnerId = `lrn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: 'default',
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
