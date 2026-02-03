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
  // TODO: Implement JSX
  // return (
  //   <html lang="en">
  //     <head>
  //       {/* TODO: Metadata */}
  //     </head>
  //     <body>
  //       <AppStateMachineProvider>
  //         <SessionProvider>
  //           {children}
  //         </SessionProvider>
  //       </AppStateMachineProvider>
  //     </body>
  //   </html>
  // );
  return null as any; // Placeholder - no JSX yet
}
