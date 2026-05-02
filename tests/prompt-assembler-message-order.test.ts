import { PromptAssembler } from '../backend/core/PromptAssembler';
import type { Message } from '../backend/core/types';

describe('PromptAssembler.formatMessageHistory', () => {
  it('keeps message array order (does not re-sort by timestamp)', () => {
    const pa = new PromptAssembler('config/prompts');
    const formatMessageHistory = (
      pa as unknown as {
        formatMessageHistory(messages: Message[], maxTokens?: number): string;
      }
    ).formatMessageHistory.bind(pa);

    const newerFirst: Message[] = [
      {
        id: 'm1',
        sessionId: 's1',
        role: 'learner',
        content: 'Second turn',
        messageType: 'question',
        timestamp: new Date('2024-06-02T12:00:00.000Z'),
      },
      {
        id: 'm2',
        sessionId: 's1',
        role: 'instructor',
        content: 'First turn',
        messageType: 'guidance',
        timestamp: new Date('2024-06-01T12:00:00.000Z'),
      },
    ];

    const formatted = formatMessageHistory(newerFirst);

    expect(formatted.indexOf('Second turn')).toBeLessThan(formatted.indexOf('First turn'));
  });
});
