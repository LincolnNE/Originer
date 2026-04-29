'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  const apiUrl =
    apiBaseUrl && apiBaseUrl.length > 0
      ? `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sessions`
      : '/api/v1/sessions';
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructorProfileId: 'default',
        subject: 'General',
        topic: 'Introduction',
        learningObjective: 'Get started with learning',
      }),
    });

    if (!response.ok) {
      redirect('/');
    }

    const result = await response.json();
    
    const sessionId = result?.data?.session?.id;
    if (result.success && sessionId) {
      redirect(`/lessons/${sessionId}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
