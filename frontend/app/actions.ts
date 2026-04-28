'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/v1/sessions/start` : '/api/v1/sessions/start';
  let redirectPath = '/';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructor_id: 'default',
        learner_id: 'anonymous',
        subject: 'General',
        topic: 'Introduction',
        learning_objective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirectPath = '/';
    } else {
      const result = await response.json();
      
      if (result.success && result.data?.session_id) {
        redirectPath = `/lessons/${result.data.session_id}/screen_001`;
      }
    }
  } catch (error) {
    redirectPath = '/';
  }

  redirect(redirectPath);
}
