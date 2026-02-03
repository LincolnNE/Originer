/**
 * Guided Practice Screen Component
 * 
 * MVP: Single screen component for all learning interactions.
 * 
 * TODO: Implement JSX
 */

interface GuidedPracticeProps {
  screenId: string;
  sessionId: string;
  onAnswerSubmit: (answer: string) => void;
  onHintRequest: () => void;
  onComplete: () => void;
  onNavigate: (screenId: string) => void;
}

export default function GuidedPractice(props: GuidedPracticeProps) {
  // TODO: Implement JSX
  // Structure:
  // 1. Display problem/content
  // 2. Answer input field
  // 3. Submit button (disabled based on constraints)
  // 4. Feedback display area (SSE streaming)
  // 5. Progress indicator
  // 6. Next button (when can proceed)
  // 7. Constraint warnings
  
  // State Management:
  // - useLessonState() for UI state
  // - useProgress() for progress
  // - useConstraints() for constraints
  // - useSession() for session
  
  // Interactions:
  // - Submit answer → API call → SSE stream → Update state
  // - Request hint → API call → Display hint
  // - Complete → API call → Navigate to next screen
  
  return null; // Placeholder - no JSX yet
}
