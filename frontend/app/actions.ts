'use server';

import { redirect } from 'next/navigation';

/**
 * Base URL for API calls from Server Actions.
 * When NEXT_PUBLIC_API_URL is unset, use same-origin `/api/v1` so requests hit this deployment's
 * Vercel rewrite (never use path-relative `fetch('/api/...')` — Node resolves that incorrectly).
 */
function apiV1Base(): string {
  const origin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return origin ? `${origin}/api/v1` : '/api/v1';
}

export async function startSession() {
  const apiBase = apiV1Base();

  try {
    const learnerRes = await fetch(`${apiBase}/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Learner', level: 'beginner' }),
    });
    const learnerJson = await learnerRes.json();
    if (!learnerRes.ok || !learnerJson.success || !learnerJson.data?.learner_id) {
      redirect('/');
      return;
    }

    const instructorRes = await fetch(`${apiBase}/instructors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Instructor', tone: 'friendly' }),
    });
    const instructorJson = await instructorRes.json();
    if (!instructorRes.ok || !instructorJson.success || !instructorJson.data?.instructor_id) {
      redirect('/');
      return;
    }

    const sessionRes = await fetch(`${apiBase}/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instructor_id: instructorJson.data.instructor_id,
        learner_id: learnerJson.data.learner_id,
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!sessionRes.ok) {
      redirect('/');
      return;
    }

    const result = await sessionRes.json();

    if (result.success && result.data?.session_id) {
      redirect(`/lessons/${result.data.session_id}/screen_001`);
    } else {
      redirect('/');
    }
  } catch {
    redirect('/');
  }
}
