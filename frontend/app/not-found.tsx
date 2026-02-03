/**
 * Not Found Page
 * 
 * Route: N/A (404 fallback)
 * Frontend State: ERROR (treated as error state)
 * 
 * Purpose: Handle 404 errors
 * 
 * Behavior:
 * - Shows 404 message
 * - Provides navigation options
 * - Logs 404 for monitoring
 */

import Link from 'next/link';

export default function NotFound() {
  // TODO: Implement JSX
  // - Show 404 message
  // - Provide link to landing page
  // - Provide link to go back
  
  return (
    <div>
      {/* TODO: 404 UI */}
      <h2>404 - Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <Link href="/">Go to home</Link>
    </div>
  );
}
