import Fastify from 'fastify';
import { DatabaseStorageAdapter } from '../backend/adapters/storage/database';
import { registerSessionRoutes } from '../src/routes/sessions';

describe('POST /api/v1/sessions instructor validation', () => {
  const orchestratorStub = {
    processLearnerMessage: async () => ({ role: 'instructor' as const, content: 'ok' }),
  } as any;

  it('rejects unknown instructorProfileId and does not accept the session', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    await storage.createInstructor({
      id: 'known_instructor',
      name: 'Known',
      bio: 'x',
      tone: 'friendly',
    });

    const app = Fastify({ logger: false });
    await registerSessionRoutes(app, storage, orchestratorStub);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        instructorProfileId: 'unknown_instructor_id',
        learnerId: 'learner_a',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
    expect(body.error?.message).toMatch(/Instructor not found/);

    await app.close();
    storage.close();
  });

  it('creates a session when instructorProfileId exists', async () => {
    const storage = new DatabaseStorageAdapter({ type: 'sqlite', connectionString: ':memory:' });
    await storage.createInstructor({
      id: 'known_instructor',
      name: 'Known',
      bio: 'x',
      tone: 'friendly',
    });

    const app = Fastify({ logger: false });
    await registerSessionRoutes(app, storage, orchestratorStub);

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: {
        instructorProfileId: 'known_instructor',
        learnerId: 'learner_b',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data?.session?.id).toBeDefined();

    await app.close();
    storage.close();
  });
});
