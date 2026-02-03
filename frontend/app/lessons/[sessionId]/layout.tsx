/**
 * Session Layout
 * 
 * Route: /lessons/[sessionId]/*
 * 
 * Purpose: Session-level layout (progress bar, navigation sidebar)
 * 
 * Contains:
 * - Session progress bar
 * - Navigation sidebar (future)
 * - Session metadata
 */

import { ReactNode } from 'react';
// import { useProgress } from '@/state/hooks/useProgress';

interface LayoutProps {
  children: ReactNode;
  params: {
    sessionId: string;
  };
}

export default function SessionLayout({ children, params }: LayoutProps) {
  // const { sessionProgress } = useProgress();

  // TODO: Implement JSX
  // - Session progress bar (top)
  // - Navigation sidebar (left, future)
  // - Session metadata
  
  return (
    <div>
      {/* TODO: Session progress bar */}
      {/* TODO: Navigation sidebar (future) */}
      {children}
    </div>
  );
}
