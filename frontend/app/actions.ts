'use server';

import { redirect } from 'next/navigation';

function randomLearnerSuffix(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = apiBaseUrl
    ? `${apiBaseUrl}/api/v1/sessions/start`
    : '/api/v1/sessions/start';

  const instructorId =
    process.env.DEFAULT_INSTRUCTOR_ID || 'inst_default';
  const learnerId = `learn_${randomLearnerSuffix()}`;

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

    const sessionId = result.success ? result.data?.session_id : undefined;
    if (sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch {
    redirect('/');
  }
}
