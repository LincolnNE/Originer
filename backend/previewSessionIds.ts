/**
 * Temporary session + learner IDs for POST /instructors/:id/preview.
 * Must be unique per request: concurrent previews in the same millisecond
 * would otherwise collide on primary keys and corrupt sessions / learner memory.
 */
export function createPreviewTempIds(now: number = Date.now()): {
  tempSessionId: string;
  tempLearnerId: string;
} {
  const suffix = Math.random().toString(36).substr(2, 9);
  return {
    tempSessionId: `preview_${now}_${suffix}`,
    tempLearnerId: `temp_learner_${now}_${suffix}`,
  };
}
