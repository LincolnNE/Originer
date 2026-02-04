import {
  Session,
  InstructorProfile,
  LearnerMemory,
  Message,
} from './types';

/**
 * PromptAssembler - Assembles prompts from configuration files
 * 
 * Responsibilities:
 * - Load prompt files from config/prompts/
 * - Combine system prompts, instructor prompts, and learner context
 * - Format session context and conversation history
 * - Manage context window limits
 */
export class PromptAssembler {
  private promptConfigPath: string;

  constructor(promptConfigPath: string = 'config/prompts') {
    this.promptConfigPath = promptConfigPath;
  }

  /**
   * Assemble full prompt for LLM generation
   * 
   * @param params Assembly parameters
   * @returns Assembled prompt string
   */
  async assemblePrompt(params: {
    session: Session;
    instructorProfile: InstructorProfile;
    learnerMemory: LearnerMemory;
    messageHistory: Message[];
    currentMessage: string;
  }): Promise<string> {
    const parts: string[] = [];

    // 1. Load and add system prompts
    try {
      const systemPrompt = await this.loadPromptFile('system/system.md');
      parts.push(`[SYSTEM]\n${systemPrompt}\n`);
    } catch (error) {
      console.warn('Failed to load system.md:', error);
    }

    try {
      const instructorIdentity = await this.loadPromptFile('system/instructor_identity.md');
      parts.push(`[INSTRUCTOR IDENTITY]\n${instructorIdentity}\n`);
    } catch (error) {
      console.warn('Failed to load instructor_identity.md:', error);
    }

    try {
      const teachingRules = await this.loadPromptFile('system/teaching_rules.md');
      parts.push(`[TEACHING RULES]\n${teachingRules}\n`);
    } catch (error) {
      console.warn('Failed to load teaching_rules.md:', error);
    }

    // 2. Add instructor profile context
    parts.push(`[INSTRUCTOR PROFILE]\n`);
    parts.push(`Name: ${params.instructorProfile.name}\n`);
    parts.push(`Teaching Style: ${params.instructorProfile.guidanceStyle}\n`);
    if (params.instructorProfile.teachingPatterns.length > 0) {
      parts.push(`Teaching Patterns: ${params.instructorProfile.teachingPatterns.join(', ')}\n`);
    }
    parts.push(`\n`);

    // 3. Format and add learner context
    const learnerContext = this.formatLearnerContext(params.learnerMemory);
    try {
      const learnerContextTemplate = await this.loadPromptFile('system/learner_context.md');
      parts.push(`[LEARNER CONTEXT]\n${learnerContextTemplate}\n\n${learnerContext}\n`);
    } catch (error) {
      parts.push(`[LEARNER CONTEXT]\n${learnerContext}\n`);
    }

    // 4. Format and add session context
    const sessionContext = this.formatSessionContext(params.session);
    parts.push(`[SESSION CONTEXT]\n${sessionContext}\n`);

    // 5. Format and add conversation history
    const messageHistory = this.formatMessageHistory(params.messageHistory);
    if (messageHistory) {
      parts.push(`[CONVERSATION HISTORY]\n${messageHistory}\n`);
    }

    // 6. Add response format guidelines
    try {
      const responseFormat = await this.loadPromptFile('system/response_format.md');
      parts.push(`[RESPONSE FORMAT]\n${responseFormat}\n`);
    } catch (error) {
      console.warn('Failed to load response_format.md:', error);
    }

    // 7. Add current learner message
    parts.push(`[USER QUESTION]\n${params.currentMessage}\n`);

    return parts.join('\n');
  }

  /**
   * Assemble fallback prompt when validation fails
   * 
   * @param basePrompt Original prompt that failed validation
   * @param validationErrors Errors from response validator
   * @returns Fallback prompt with additional guidance
   */
  async assembleFallbackPrompt(
    basePrompt: string,
    validationErrors: string[]
  ): Promise<string> {
    let fallbackGuidance = '';
    try {
      fallbackGuidance = await this.loadPromptFile('system/fallback.md');
    } catch (error) {
      console.warn('Failed to load fallback.md:', error);
      fallbackGuidance = 'Use a safe, guiding response that maintains instructor character.';
    }

    const errorContext = validationErrors.length > 0
      ? `\n[VALIDATION ERRORS TO AVOID]\n${validationErrors.map(e => `- ${e}`).join('\n')}\n`
      : '';

    return `${basePrompt}\n\n[FALLBACK GUIDANCE]\n${fallbackGuidance}${errorContext}`;
  }

  /**
   * Load prompt file from configuration
   * 
   * @param filePath Relative path from promptConfigPath
   * @returns Prompt content as string
   */
  private async loadPromptFile(filePath: string): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');
    
    const fullPath = path.join(process.cwd(), this.promptConfigPath, filePath);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return content.trim();
    } catch (error) {
      throw new Error(`Failed to load prompt file ${fullPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Format learner context for prompt injection
   * 
   * @param learnerMemory Learner memory data
   * @returns Formatted learner context string
   */
  private formatLearnerContext(learnerMemory: LearnerMemory): string {
    const parts: string[] = [];

    // Format learned concepts
    if (learnerMemory.learnedConcepts.length > 0) {
      const mastered = learnerMemory.learnedConcepts.filter(c => c.masteryLevel === 'mastered');
      const practicing = learnerMemory.learnedConcepts.filter(c => c.masteryLevel === 'practicing');
      
      if (mastered.length > 0) {
        parts.push(`Mastered Concepts: ${mastered.map(c => c.concept).join(', ')}`);
      }
      if (practicing.length > 0) {
        parts.push(`Practicing Concepts: ${practicing.map(c => c.concept).join(', ')}`);
      }
    }

    // Format misconceptions (only unresolved)
    const unresolvedMisconceptions = learnerMemory.misconceptions.filter(m => !m.resolved);
    if (unresolvedMisconceptions.length > 0) {
      parts.push(`Known Misconceptions: ${unresolvedMisconceptions.map(m => `${m.concept} (${m.incorrectUnderstanding})`).join('; ')}`);
    }

    // Format strengths/weaknesses
    if (learnerMemory.strengths.length > 0) {
      parts.push(`Strengths: ${learnerMemory.strengths.join(', ')}`);
    }
    if (learnerMemory.weaknesses.length > 0) {
      parts.push(`Weak Areas: ${learnerMemory.weaknesses.join(', ')}`);
    }

    // Format recent progress markers (last 3)
    const recentMarkers = learnerMemory.progressMarkers.slice(-3);
    if (recentMarkers.length > 0) {
      parts.push(`Recent Progress: ${recentMarkers.map(m => m.marker).join(', ')}`);
    }

    return parts.length > 0 ? parts.join('\n') : 'No prior learning history available.';
  }

  /**
   * Format session context for prompt injection
   * 
   * @param session Session data
   * @returns Formatted session context string
   */
  private formatSessionContext(session: Session): string {
    const parts: string[] = [];
    
    if (session.subject) {
      parts.push(`Subject: ${session.subject}`);
    }
    if (session.topic) {
      parts.push(`Topic: ${session.topic}`);
    }
    if (session.learningObjective) {
      parts.push(`Learning Objective: ${session.learningObjective}`);
    }
    parts.push(`Session State: ${session.sessionState}`);

    return parts.join('\n');
  }

  /**
   * Format message history for prompt injection
   * 
   * @param messages Message history
   * @param maxTokens Maximum tokens to use for history
   * @returns Formatted conversation history string
   */
  private formatMessageHistory(
    messages: Message[],
    maxTokens?: number
  ): string {
    if (messages.length === 0) {
      return '';
    }

    // Sort by timestamp
    const sortedMessages = [...messages].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // Limit to recent messages if maxTokens specified (rough estimate: 4 chars per token)
    let messagesToInclude = sortedMessages;
    if (maxTokens) {
      const maxChars = maxTokens * 4;
      let totalChars = 0;
      const recentMessages: Message[] = [];
      
      // Start from most recent and work backwards
      for (let i = sortedMessages.length - 1; i >= 0; i--) {
        const msg = sortedMessages[i];
        const msgChars = msg.content.length + 50; // Rough estimate including formatting
        if (totalChars + msgChars > maxChars && recentMessages.length > 0) {
          break;
        }
        recentMessages.unshift(msg);
        totalChars += msgChars;
      }
      messagesToInclude = recentMessages;
    }

    // Format messages
    return messagesToInclude.map(msg => {
      const roleLabel = msg.role === 'instructor' ? 'Instructor' : 'Learner';
      return `${roleLabel}: ${msg.content}`;
    }).join('\n\n');
  }

  /**
   * Estimate token count for text (approximate)
   * 
   * @param text Text to estimate
   * @returns Approximate token count
   */
  private estimateTokens(text: string): number {
    // Simple approximation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
