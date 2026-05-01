'use server';

import { redirect } from 'next/navigation';

function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return base;
}

export async function startSession() {
  const origin = apiOrigin();
  const prefix = origin ? `${origin}` : '';

  try {
    const learnerRes = await fetch(`${prefix}/api/v1/learners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Learner', level: 'beginner' }),
    });
    const learnerJson = await learnerRes.json();
    if (!learnerRes.ok || !learnerJson.success || !learnerJson.data?.learner_id) {
      redirect('/');
      return;
    }

    const instructorRes = await fetch(`${prefix}/api/v1/instructors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Instructor', tone: 'friendly' }),
    });
    const instructorJson = await instructorRes.json();
    if (!instructorRes.ok || !instructorJson.success || !instructorJson.data?.instructor_id) {
      redirect('/');
      return;
    }

    const sessionRes = await fetch(`${prefix}/api/v1/sessions/start`, {
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
