import { createServer } from '../src/server';

describe('Session API (MVP contract)', () => {
  it('POST /api/v1/sessions creates a session in the shape the frontend expects', async () => {
    const server = await createServer();

    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      headers: { 'content-type': 'application/json' },
      payload: {
        instructorProfileId: 'default',
        subject: 'General',
        topic: 'Introduction',
        learningObjective: 'Get started with learning',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      success: boolean;
      data: { session: { id: string; instructorProfileId: string; learnerId: string } };
    };
    expect(body.success).toBe(true);
    expect(body.data.session.id).toMatch(/^sess_/);
    expect(body.data.session.instructorProfileId).toBe('default');
    expect(typeof body.data.session.learnerId).toBe('string');

    const get = await server.inject({
      method: 'GET',
      url: `/api/v1/sessions/${body.data.session.id}`,
    });
    expect(get.statusCode).toBe(200);
    const getBody = get.json() as { data: { session: { id: string } } };
    expect(getBody.data.session.id).toBe(body.data.session.id);

    await server.close();
  });
});
