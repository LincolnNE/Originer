/**
 * Ensures PromptAssembler preserves conversation order in [CONVERSATION HISTORY],
 * not timestamp order (same issue as loadMessages: skew / backdated rows).
 * Run: npm run build && node tests/prompt-assembler-order.test.js
 */

const assert = require('assert');
const path = require('path');

const { PromptAssembler } = require(path.join(
  __dirname,
  '..',
  'dist',
  'backend',
  'core',
  'PromptAssembler.js'
));

function main() {
  const assembler = new PromptAssembler('config/prompts');

  const messages = [
    {
      id: 'm1',
      sessionId: 'sess',
      role: 'learner',
      content: 'Learner spoke first',
      messageType: 'question',
      timestamp: new Date('2025-06-02T12:00:02.000Z'),
    },
    {
      id: 'm2',
      sessionId: 'sess',
      role: 'instructor',
      content: 'Instructor replied second',
      messageType: 'guidance',
      timestamp: new Date('2025-06-02T12:00:01.000Z'),
    },
  ];

  const history = assembler['formatMessageHistory'](messages);
  const idxLearner = history.indexOf('Learner: Learner spoke first');
  const idxInstructor = history.indexOf('Instructor: Instructor replied second');
  assert.ok(idxLearner >= 0, 'expected learner line');
  assert.ok(idxInstructor >= 0, 'expected instructor line');
  assert.ok(
    idxLearner < idxInstructor,
    'conversation order must follow message array, not created_at'
  );
  console.log('prompt-assembler-order: OK');
}

main();
