import { PromptAssembler } from '../backend/core/PromptAssembler';
import type { Message } from '../backend/core/types';

describe('PromptAssembler message history order', () => {
  const baseMsg = (overrides: Partial<Message>): Message => ({
    id: 'id',
    sessionId: 's1',
    role: 'learner',
    content: 'x',
    messageType: 'question',
    timestamp: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });

  it('keeps session turn order when timestamps are skewed (instructor earlier than learner)', () => {
    const assembler = new PromptAssembler('config/prompts');
    const learnerFirst = baseMsg({
      id: 'm1',
      role: 'learner',
      content: 'Why X?',
      timestamp: new Date('2026-01-01T00:00:01.000Z'),
    });
    const instructorSecond = baseMsg({
      id: 'm2',
      role: 'instructor',
      content: 'Because Y.',
      // Clock skew: stored earlier than the learner turn despite being the reply
      timestamp: new Date('2026-01-01T00:00:00.500Z'),
    });
    const messages: Message[] = [learnerFirst, instructorSecond];

    const formatted = (assembler as unknown as { formatMessageHistory(m: Message[]): string }).formatMessageHistory(
      messages
    );

    expect(formatted.indexOf('Learner: Why X?')).toBeLessThan(formatted.indexOf('Instructor: Because Y.'));
  });
});
