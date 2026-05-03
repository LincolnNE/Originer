import type { CreateSessionResponse } from '../../types/api';

/** POST /sessions/start returns session_id plus session; UI expects { session } only. */
export function toCreateSessionResponse(
  data: CreateSessionResponse & { session_id?: string }
): CreateSessionResponse {
  const { session } = data;
  if (!session?.id) {
    throw new Error('Invalid create session response: missing session');
  }
  return { session };
}
