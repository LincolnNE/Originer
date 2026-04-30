'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/sessions/start`
    : '/api/v1/sessions/start';

  const instructorId =
    process.env.DEFAULT_INSTRUCTOR_ID || 'default_instructor';
  const learnerId = process.env.DEFAULT_LEARNER_ID || 'default_learner';

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

    if (result.success && result.data?.session_id) {
      redirect(`/lessons/${result.data.session_id}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
