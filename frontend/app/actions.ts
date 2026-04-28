'use server';

import { redirect } from 'next/navigation';

function apiOrigin(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'http://localhost:4094';
}

/**
 * Create a session via the backend and redirect into the first lesson screen.
 * Must match POST /api/v1/sessions/start (see src/routes/sessions.ts).
 */
export async function startSession() {
  const apiUrl = `${apiOrigin()}/api/v1/sessions/start`;
  const instructorId = process.env.DEFAULT_INSTRUCTOR_ID || 'instructor_mvp';
  const learnerId = `learner_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

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

    const result = (await response.json()) as {
      success?: boolean;
      data?: { session_id?: string };
    };

    if (result.success && result.data?.session_id) {
      redirect(`/lessons/${result.data.session_id}/screen_001`);
    } else {
      redirect('/');
    }
  } catch {
    redirect('/');
  }
}
