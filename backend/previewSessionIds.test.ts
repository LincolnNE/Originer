import { createPreviewTempIds } from './previewSessionIds';

describe('createPreviewTempIds', () => {
  test('session and learner ids are unique across many calls at the same timestamp', () => {
    const fixed = 1_700_000_000_000;
    const sessionIds = new Set<string>();
    const learnerIds = new Set<string>();
    const n = 200;
    for (let i = 0; i < n; i++) {
      const { tempSessionId, tempLearnerId } = createPreviewTempIds(fixed);
      sessionIds.add(tempSessionId);
      learnerIds.add(tempLearnerId);
    }
    expect(sessionIds.size).toBe(n);
    expect(learnerIds.size).toBe(n);
  });
});
