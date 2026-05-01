/**
 * Smoke checks for critical paths (run: node scripts/smoke-critical-paths.mjs).
 * Requires: npm run build
 */
import { rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

async function testLoadMessagesOrder() {
  const { DatabaseStorageAdapter } = await import(
    join(root, 'dist/backend/adapters/storage/database.js')
  );
  const dbPath = join(tmpdir(), `originer-smoke-${Date.now()}.db`);
  const db = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbPath });

  await db.createInstructor({ id: 'inst_1', name: 'T' });
  await db.createLearner({ id: 'learner_1', name: 'L' });

  const sameTs = new Date('2020-01-01T00:00:00.000Z');
  const session = {
    id: 'sess_1',
    instructorId: 'inst_1',
    learnerId: 'learner_1',
    instructorProfileId: 'inst_1',
    subject: 'S',
    topic: 'T',
    learningObjective: 'L',
    sessionState: 'active',
    messageIds: [],
    startedAt: sameTs,
    lastActivityAt: sameTs,
    endedAt: null,
  };
  await db.saveSession(session);

  const m1 = {
    id: 'msg_first',
    sessionId: 'sess_1',
    role: 'learner',
    content: 'first',
    messageType: 'question',
    timestamp: sameTs,
  };
  const m2 = {
    id: 'msg_second',
    sessionId: 'sess_1',
    role: 'instructor',
    content: 'second',
    messageType: 'guidance',
    timestamp: sameTs,
  };
  await db.saveMessage(m1);
  await db.saveMessage(m2);

  const orderedIds = ['msg_first', 'msg_second'];
  await db.updateSession('sess_1', { messageIds: orderedIds });

  const loaded = await db.loadMessages(orderedIds);
  if (loaded.length !== 2 || loaded[0].id !== 'msg_first' || loaded[1].id !== 'msg_second') {
    throw new Error(
      `loadMessages order broken: got ${loaded.map((m) => m.id).join(',')}, expected msg_first,msg_second`
    );
  }
  db.close();
  rmSync(dbPath, { force: true });
}

async function testSessionsQuickStartSingleRequest() {
  const { createServer } = await import(join(root, 'dist/src/server.js'));
  const server = await createServer();
  const res = await server.inject({
    method: 'POST',
    url: '/api/v1/sessions/quick-start',
    headers: { 'content-type': 'application/json' },
    payload: {
      instructor: { name: 'Coach', tone: 'friendly' },
      learner: { name: 'Student', level: 'beginner' },
      subject: 'General',
      topic: 'Intro',
      learning_objective: 'Practice',
    },
  });
  if (res.statusCode !== 200) {
    throw new Error(`quick-start expected 200, got ${res.statusCode}: ${res.payload}`);
  }
  const json = JSON.parse(res.payload);
  if (
    !json.success ||
    !json.data?.session_id ||
    !json.data?.instructor_id ||
    !json.data?.learner_id
  ) {
    throw new Error(`quick-start missing ids: ${res.payload}`);
  }
  await server.close();
}

async function testOrchestratorFallbackAfterRetryStillInvalid() {
  const { DatabaseStorageAdapter } = await import(
    join(root, 'dist/backend/adapters/storage/database.js')
  );
  const { SessionOrchestrator } = await import(
    join(root, 'dist/backend/core/SessionOrchestrator.js')
  );
  const { PromptAssembler } = await import(join(root, 'dist/backend/core/PromptAssembler.js'));
  const { ResponseValidator } = await import(
    join(root, 'dist/backend/core/ResponseValidator.js')
  );

  const dbPath = join(tmpdir(), `originer-smoke-orch-${Date.now()}.db`);
  const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: dbPath });

  await storage.createInstructor({ id: 'inst_o', name: 'Coach' });
  await storage.createLearner({ id: 'learner_o', name: 'Student' });

  const session = {
    id: 'sess_o',
    instructorId: 'inst_o',
    learnerId: 'learner_o',
    instructorProfileId: 'inst_o',
    subject: 'Math',
    topic: 'Arithmetic',
    learningObjective: 'Practice',
    sessionState: 'active',
    messageIds: [],
    startedAt: new Date(),
    lastActivityAt: new Date(),
    endedAt: null,
  };
  await storage.saveSession(session);

  let call = 0;
  const llm = {
    async generate() {
      call += 1;
      // HIGH-severity direct answer → REGENERATE; repeat on retry so validation stays invalid
      return { content: "The answer is 42. What do you think about that approach?" };
    },
  };

  const orchestrator = new SessionOrchestrator(
    new PromptAssembler('config/prompts'),
    new ResponseValidator(),
    llm,
    storage
  );

  const out = await orchestrator.processLearnerMessage('sess_o', 'What is 2+2?');
  if (out.includes('The answer is')) {
    throw new Error('Expected safe fallback after failed validation retry, got model-style direct answer');
  }
  if (!out.includes('help me understand')) {
    throw new Error('Expected fallback response text from generateSafeFallbackResponse');
  }

  storage.close();
  rmSync(dbPath, { force: true });
}

async function main() {
  process.chdir(root);
  await testLoadMessagesOrder();
  await testSessionsQuickStartSingleRequest();
  await testOrchestratorFallbackAfterRetryStillInvalid();
  console.log('smoke-critical-paths: ok');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
