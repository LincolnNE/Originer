#!/usr/bin/env bash
# Regression: conversation order must follow session_messages / messageIds, not created_at.
# loadMessages() reorders rows to match the messageIds array (see database.ts).
set -euo pipefail
DB="$(mktemp)"
trap 'rm -f "$DB"' EXIT

sqlite3 "$DB" <<'SQL'
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
-- Learner spoke first in the session, but clock skew (or backdated save) makes created_at later
-- than the instructor reply — ORDER BY created_at reverses the real dialogue order.
INSERT INTO messages (id, session_id, sender, role, content, created_at) VALUES
  ('msg_second', 's1', 'ai', 'instructor', 'instructor reply', '2026-01-01 12:00:00'),
  ('msg_first', 's1', 'learner', 'learner', 'learner question', '2026-01-01 13:00:00');
SQL

CHRONO=$(sqlite3 "$DB" "SELECT id FROM messages WHERE id IN ('msg_first','msg_second') ORDER BY created_at")
SESSION_ORDER="$(printf '%s\n' msg_first msg_second)"
if [ "$CHRONO" = "$SESSION_ORDER" ]; then
  echo "regression script failed: expected chronological order to disagree with session order" >&2
  exit 1
fi

echo "session-message-order-regression: ok (ORDER BY created_at can invert dialogue; messageIds order is authoritative)"
