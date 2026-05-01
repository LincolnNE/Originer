'use server';

import { redirect } from 'next/navigation';

export async function startSession() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4094';
  const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/sessions`;
  
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
    
    if (result.success && result.data?.session?.id) {
      redirect(`/lessons/${result.data.session.id}/screen_001`);
    } else {
      redirect('/');
    }
  } catch (error) {
    redirect('/');
  }
}
