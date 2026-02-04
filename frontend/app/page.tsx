/**
 * Landing Page
 * 
 * Route: /
 * Primary Frontend State: IDLE
 * 
 * Purpose: Entry point - start a new learning session
 * 
 * ROUTE VALIDATION (REQUIRED):
 * - None (always accessible, entry point)
 * 
 * INVALID ACCESS HANDLING:
 * - N/A (always accessible)
 * 
 * Navigation:
 * - On "Start Learning" → Create session → Redirect to /lessons/[sessionId]/screen_001
 */

import { redirect } from 'next/navigation';

async function startSession() {
  'use server';
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const apiUrl = apiBaseUrl ? `${apiBaseUrl}/api/v1/sessions` : '/api/v1/sessions';
  
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

export default function LandingPage() {
  return (
    <main>
      <h1>ORIGINER</h1>
      <p>AI Instructor Platform</p>
      <form action={startSession}>
        <button type="submit">Start Learning</button>
      </form>
    </main>
  );
}
