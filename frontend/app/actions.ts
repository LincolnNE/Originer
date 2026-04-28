'use server';

import { redirect } from 'next/navigation';
import { getPublicApiBaseUrl } from '../lib/publicApiBaseUrl';

export async function startSession() {
  // Server Actions run on the Next.js server. A relative /api/... URL resolves to the
  // Next origin (e.g. :3000), not the Fastify API. Default to the same base as
  // next.config.js and frontend/services/api/client.ts when the env is unset.
  const apiUrl = `${getPublicApiBaseUrl()}/api/v1/sessions/start`;
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
