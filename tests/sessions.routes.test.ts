import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import Fastify, { FastifyInstance } from 'fastify';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import { SessionOrchestrator } from '../backend/core/SessionOrchestrator';
import { registerSessionRoutes } from '../src/routes/sessions';

describe('REST session routes', () => {
  let app: FastifyInstance;
  let storage: DatabaseStorageAdapter;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    const orchestrator = {
      processLearnerMessage: async () => 'ok',
    } as unknown as SessionOrchestrator;
    await registerSessionRoutes(app, storage, orchestrator);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    storage.close();
  });

  it('POST /api/v1/sessions creates a session with frontend contract shape', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        instructorProfileId: 'default',
        subject: 'General',
        topic: 'Introduction',
        learningObjective: 'Get started with learning',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data?.session?.id).toMatch(/^sess_/);
    expect(body.data?.session?.learnerId).toBe('anonymous');
    expect(body.data?.session?.sessionState).toBe('active');
  });

  it('GET /api/v1/sessions/:id returns the created session', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        instructorProfileId: 'default',
        subject: 'Math',
        topic: 'Algebra',
        learningObjective: 'Practice',
      },
    });
    const { data } = JSON.parse(create.body);
    const sessionId = data.session.id as string;

    const get = await app.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}`,
    });

    expect(get.statusCode).toBe(200);
    const got = JSON.parse(get.body);
    expect(got.success).toBe(true);
    expect(got.data.session.id).toBe(sessionId);
    expect(got.data.session.subject).toBe('Math');
    expect(got.data.session.lastActivityAt).toBeDefined();
  });

  it('POST /api/v1/sessions/start persists when instructor and learner exist', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions/start',
      payload: {
        instructor_id: 'inst_test',
        learner_id: 'learner_test',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.session_id).toMatch(/^sess_/);
  });
});
