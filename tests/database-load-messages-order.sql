-- Manual regression check: conversation history must follow session message order,
-- not SQLite row order or created_at (which can tie within the same second).
-- Run: sqlite3 :memory: < tests/database-load-messages-order.sql
-- Expected: two SELECTs; second row order must be learner then instructor.

CREATE TABLE messages (
  id VARCHAR PRIMARY KEY,
  session_id VARCHAR NOT NULL,
  sender VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  content TEXT NOT NULL,
  message_type VARCHAR,
  teaching_metadata TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO messages (id, session_id, sender, role, content, message_type, created_at)
VALUES
  ('msg_inst', 's1', 'ai', 'instructor', 'reply', 'guidance', '2026-01-01 00:00:00'),
  ('msg_learn', 's1', 'learner', 'learner', 'hi', 'question', '2026-01-01 00:00:00');

-- Wrong for chat history (sorts by time only; ties arbitrary):
SELECT id, role FROM messages WHERE id IN ('msg_learn', 'msg_inst') ORDER BY created_at;

-- Correct order follows session array [learner, instructor]:
SELECT id, role FROM messages WHERE id = 'msg_learn'
UNION ALL
SELECT id, role FROM messages WHERE id = 'msg_inst';
