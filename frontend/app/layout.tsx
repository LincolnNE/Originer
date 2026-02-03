/**
 * Root Layout
 * 
 * Route: N/A (wraps all routes)
 * Frontend State: All states (wraps all routes)
 * 
 * Purpose: Global layout with providers
 * 
 * Contains:
 * - HTML structure (<html>, <body>)
 * - Global providers (SessionProvider, AppStateMachineProvider)
 * - Global error boundary wrapper
 * - Global styles
 * - Metadata
 */

import { ReactNode } from 'react';
// import { SessionProvider } from '../state/providers/SessionProvider';
// import { AppStateMachineProvider } from '../state/providers/AppStateMachineProvider';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ORIGINER - AI Instructor Platform</title>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {/* TODO: Add providers when ready */}
        {/* <AppStateMachineProvider>
          <SessionProvider> */}
            {children}
          {/* </SessionProvider>
        </AppStateMachineProvider> */}
      </body>
    </html>
  );
}
