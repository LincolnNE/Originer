/**
 * useInstructor Hook
 * 
 * React hook for interacting with InstructorGateway.
 * Provides convenient interface for instructor AI interactions.
 */

import { useState, useCallback } from 'react';
import { instructorGateway } from '../core/InstructorGateway';
import {
  InstructorInput,
  InstructorOutput,
  InstructorError,
} from '../types/instructor';

/** Bumps on each `processInput` start and on `clearOutput`; stale async completions are ignored. */
let instructorInteractionSequence = 0;

interface UseInstructorReturn {
  output: InstructorOutput | null;
  isLoading: boolean;
  error: InstructorError | null;
  processInput: (input: InstructorInput) => Promise<void>;
  clearOutput: () => void;
}

export function useInstructor(): UseInstructorReturn {
  const [output, setOutput] = useState<InstructorOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<InstructorError | null>(null);

  const processInput = useCallback(async (input: InstructorInput) => {
    const token = ++instructorInteractionSequence;
    setIsLoading(true);
    setError(null);
    try {
      const result = await instructorGateway.processInput(input);
      if (token !== instructorInteractionSequence) return;
      setOutput(result);
    } catch (err) {
      if (token !== instructorInteractionSequence) return;
      if (err && typeof err === 'object' && 'code' in err) {
        setError(err as InstructorError);
      } else {
        setError({
          code: 'UNKNOWN_ERROR',
          message: err instanceof Error ? err.message : 'An unknown error occurred',
          retryable: true,
        });
      }
    } finally {
      if (token === instructorInteractionSequence) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearOutput = useCallback(() => {
    instructorInteractionSequence += 1;
    setOutput(null);
    setError(null);
  }, []);

  return {
    output,
    isLoading,
    error,
    processInput,
    clearOutput,
  };
}
