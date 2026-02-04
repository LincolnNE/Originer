import {
  Session,
  InstructorProfile,
  Message,
} from './types';

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  action: 'ACCEPT' | 'REJECT' | 'REGENERATE' | 'RETRY';
}

export interface ValidationViolation {
  rule: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  location?: string;
  message: string;
}

/**
 * ResponseValidator - Validates instructor responses
 * 
 * Responsibilities:
 * - Check for hallucination (out-of-scope knowledge)
 * - Verify instructor style consistency
 * - Detect direct answer giving
 * - Identify overly confident incorrect explanations
 * - Ensure safety constraints compliance
 * - Validate response structure
 */
export class ResponseValidator {
  /**
   * Validate instructor response
   * 
   * @param params Validation parameters
   * @returns Validation result with violations and action
   */
  validate(params: {
    response: string;
    session: Session;
    instructorProfile: InstructorProfile;
    learnerMessage: string;
  }): ValidationResult {
    const violations: ValidationViolation[] = [];

    // Critical checks (fail-fast)
    violations.push(...this.checkSystemReferences(params.response));
    violations.push(...this.checkSafetyConstraints(params.response, params.instructorProfile));

    // High-severity checks
    violations.push(...this.checkDirectAnswer(params.response, params.learnerMessage));
    violations.push(...this.checkStyleDeviation(params.response, params.instructorProfile));

    // Medium-severity checks
    violations.push(...this.checkVerificationQuestions(params.response));

    // Determine action based on violations
    const hasCritical = violations.some(v => v.severity === 'CRITICAL');
    const hasHigh = violations.some(v => v.severity === 'HIGH');
    const hasMedium = violations.some(v => v.severity === 'MEDIUM');

    if (hasCritical) {
      return {
        isValid: false,
        violations,
        action: 'REJECT',
      };
    }

    if (hasHigh) {
      return {
        isValid: false,
        violations,
        action: 'REGENERATE',
      };
    }

    if (hasMedium) {
      return {
        isValid: false,
        violations,
        action: 'RETRY',
      };
    }

    return {
      isValid: true,
      violations: [],
      action: 'ACCEPT',
    };
  }

  /**
   * Check for hallucination (out-of-scope knowledge)
   * 
   * @param response Response to check
   * @param session Session context
   * @returns Violations found
   */
  private checkHallucination(
    response: string,
    session: Session
  ): ValidationViolation[] {
    // TODO: Extract concepts mentioned in response
    // TODO: Compare against session.subject and session.topic
    // TODO: Flag concepts outside scope
    // TODO: Check against verified knowledge base if available

    return [];
  }

  /**
   * Check for direct answer giving
   * 
   * @param response Response to check
   * @param learnerMessage Original learner message
   * @returns Violations found
   */
  private checkDirectAnswer(
    response: string,
    learnerMessage: string
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    // Check if learner message is a question
    const isQuestion = learnerMessage.includes('?') || 
                       /^(what|how|why|when|where|who|which|can|could|should|would|is|are|do|does|did)/i.test(learnerMessage.trim());
    
    if (isQuestion) {
      // Check for direct answer patterns
      const directAnswerPatterns = [
        /^(the answer is|the solution is|it's|it is)\s+/i,
        /^(here's|here is)\s+(the|your)\s+(answer|solution)/i,
        /^(you need to|you should|you must)\s+(do|write|use|implement)/i,
      ];
      
      for (const pattern of directAnswerPatterns) {
        if (pattern.test(response)) {
          violations.push({
            rule: 'NO_DIRECT_ANSWERS',
            severity: 'HIGH',
            message: 'Response provides direct answer instead of guidance',
          });
          break;
        }
      }
      
      // Check if response has questions (should guide, not answer)
      const hasQuestions = response.includes('?');
      if (!hasQuestions && response.length > 100) {
        violations.push({
          rule: 'MISSING_GUIDANCE_QUESTIONS',
          severity: 'MEDIUM',
          message: 'Response to question lacks guiding questions',
        });
      }
    }

    return violations;
  }

  /**
   * Check for instructor style deviation
   * 
   * @param response Response to check
   * @param instructorProfile Instructor profile
   * @returns Violations found
   */
  private checkStyleDeviation(
    response: string,
    instructorProfile: InstructorProfile
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    // Basic check: ensure response is not too short or too long
    if (response.length < 20) {
      violations.push({
        rule: 'RESPONSE_TOO_SHORT',
        severity: 'MEDIUM',
        message: 'Response is too brief to provide meaningful guidance',
      });
    }
    
    // Check if response maintains encouraging tone (basic check)
    const negativePatterns = [/that's wrong/i, /you're incorrect/i, /that's not right/i];
    const hasNegative = negativePatterns.some(p => p.test(response));
    
    if (hasNegative && instructorProfile.correctionStyle === 'gentle') {
      violations.push({
        rule: 'TONE_MISMATCH',
        severity: 'MEDIUM',
        message: 'Response tone does not match gentle correction style',
      });
    }

    return violations;
  }

  /**
   * Check for overly confident incorrect explanations
   * 
   * @param response Response to check
   * @param session Session context
   * @returns Violations found
   */
  private checkOverlyConfidentIncorrect(
    response: string,
    session: Session
  ): ValidationViolation[] {
    // TODO: Detect definitive language ("always", "never", "definitely")
    // TODO: Check for potentially incorrect statements
    // TODO: Compare against verified knowledge
    // TODO: Flag uncertain information stated as fact

    return [];
  }

  /**
   * Check for system references
   * 
   * @param response Response to check
   * @returns Violations found
   */
  private checkSystemReferences(response: string): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const lowerResponse = response.toLowerCase();
    
    // Check for AI/system references
    const systemKeywords = ['i am an ai', 'i am a model', 'as an ai', 'as a language model', 
                           'i\'m an ai', 'i\'m a model', 'artificial intelligence', 'machine learning model'];
    
    for (const keyword of systemKeywords) {
      if (lowerResponse.includes(keyword)) {
        violations.push({
          rule: 'NO_SYSTEM_REFERENCES',
          severity: 'CRITICAL',
          message: `Response contains system reference: "${keyword}"`,
        });
      }
    }

    return violations;
  }

  /**
   * Check for verification questions
   * 
   * @param response Response to check
   * @returns Violations found
   */
  private checkVerificationQuestions(response: string): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    // Check if response has questions
    const questionCount = (response.match(/\?/g) || []).length;
    
    if (questionCount === 0 && response.length > 150) {
      violations.push({
        rule: 'MISSING_VERIFICATION',
        severity: 'MEDIUM',
        message: 'Response lacks verification questions',
      });
    }

    return violations;
  }

  /**
   * Check response structure
   * 
   * @param response Response to check
   * @param instructorProfile Instructor profile
   * @returns Violations found
   */
  private checkResponseStructure(
    response: string,
    instructorProfile: InstructorProfile
  ): ValidationViolation[] {
    // TODO: Verify acknowledge section present
    // TODO: Verify guide section present
    // TODO: Verify verification section present
    // TODO: Check against instructorProfile.responseStructure

    return [];
  }

  /**
   * Check safety constraints
   * 
   * @param response Response to check
   * @param instructorProfile Instructor profile
   * @returns Violations found
   */
  private checkSafetyConstraints(
    response: string,
    instructorProfile: InstructorProfile
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    
    // Check forbidden topics from instructor profile
    const forbiddenTopics = instructorProfile.consistencySettings?.forbiddenTopics as string[] || [];
    const lowerResponse = response.toLowerCase();
    
    for (const topic of forbiddenTopics) {
      if (lowerResponse.includes(topic.toLowerCase())) {
        violations.push({
          rule: 'FORBIDDEN_TOPIC',
          severity: 'CRITICAL',
          message: `Response contains forbidden topic: "${topic}"`,
        });
      }
    }

    return violations;
  }
}
