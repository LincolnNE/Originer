'use server';

import { redirect } from 'next/navigation';

/** Backend origin for server-side fetch (must be absolute — Node has no request origin). */
function backendBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    ''
  ).trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'http://localhost:4094';
}

export async function startSession() {
  const apiUrl = `${backendBaseUrl()}/api/v1/sessions/start`;

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
