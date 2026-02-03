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
    setIsLoading(true);
    setError(null);
    try {
      const result = await instructorGateway.processInput(input);
      setOutput(result);
    } catch (err) {
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
      setIsLoading(false);
    }
  }, []);

  const clearOutput = useCallback(() => {
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
