'use server';

import { redirect } from 'next/navigation';

const DEMO_INSTRUCTOR_ID = process.env.DEMO_INSTRUCTOR_ID || 'demo_instructor';
const DEMO_LEARNER_ID = process.env.DEMO_LEARNER_ID || 'demo_learner';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const path = '/api/v1/sessions/start';
  const apiUrl = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, '')}${path}` : path;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: DEMO_INSTRUCTOR_ID,
        learner_id: DEMO_LEARNER_ID,
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();

    const sessionId = result.success && result.data?.session_id ? result.data.session_id : null;
    if (sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
