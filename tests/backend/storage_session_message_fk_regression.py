"""
Regression: with PRAGMA foreign_keys=ON, session_messages rows require
matching messages rows. The storage adapter must not throw when persisting
a session that lists message IDs before full message content is written.

Run: python3 tests/backend/storage_session_message_fk_regression.py
"""

import sqlite3
import sys


def schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        """
        PRAGMA foreign_keys = ON;
        CREATE TABLE instructors (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          bio TEXT,
          tone VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE learners (
          id VARCHAR PRIMARY KEY,
          name VARCHAR NOT NULL,
          level VARCHAR,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE sessions (
          id VARCHAR PRIMARY KEY,
          instructor_id VARCHAR NOT NULL,
          learner_id VARCHAR NOT NULL,
          instructor_profile_id VARCHAR,
          subject VARCHAR,
          topic VARCHAR,
          learning_objective TEXT,
          session_state VARCHAR DEFAULT 'active',
          started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ended_at TIMESTAMP,
          FOREIGN KEY (instructor_id) REFERENCES instructors(id),
          FOREIGN KEY (learner_id) REFERENCES learners(id)
        );
        CREATE TABLE messages (
          id VARCHAR PRIMARY KEY,
          session_id VARCHAR NOT NULL,
          sender VARCHAR NOT NULL,
          role VARCHAR NOT NULL,
          content TEXT NOT NULL,
          message_type VARCHAR,
          teaching_metadata TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (session_id) REFERENCES sessions(id)
        );
        CREATE TABLE session_messages (
          session_id VARCHAR NOT NULL,
          message_id VARCHAR NOT NULL,
          sequence_order INTEGER NOT NULL,
          PRIMARY KEY (session_id, message_id),
          FOREIGN KEY (session_id) REFERENCES sessions(id),
          FOREIGN KEY (message_id) REFERENCES messages(id)
        );
        """
    )


def ensure_stub_messages(conn: sqlite3.Connection, session_id: str, message_ids: list[str]) -> None:
    """Mirror DatabaseStorageAdapter.ensureMessageStubRows."""
    cur = conn.cursor()
    for mid in message_ids:
        cur.execute(
            """
            INSERT OR IGNORE INTO messages (
              id, session_id, sender, role, content, message_type, teaching_metadata, created_at
            ) VALUES (?, ?, 'system', 'learner', '', 'question', NULL, datetime('now'))
            """,
            (mid, session_id),
        )


def main() -> int:
    conn = sqlite3.connect(":memory:")
    try:
        schema(conn)
        conn.execute(
            "INSERT INTO instructors (id, name, bio, tone) VALUES (?, ?, NULL, 'friendly')",
            ("inst_1", "Instructor inst_1"),
        )
        conn.execute(
            "INSERT INTO learners (id, name, level) VALUES (?, ?, 'beginner')",
            ("learner_1", "Learner learner_1"),
        )
        conn.execute(
            """
            INSERT INTO sessions (
              id, instructor_id, learner_id, instructor_profile_id,
              subject, topic, learning_objective, session_state,
              started_at, last_activity_at, ended_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), NULL)
            """,
            (
                "sess_1",
                "inst_1",
                "learner_1",
                "inst_1",
                "S",
                "T",
                "L",
                "active",
            ),
        )
        mids = ["msg_a", "msg_b"]
        ensure_stub_messages(conn, "sess_1", mids)
        conn.execute("DELETE FROM session_messages WHERE session_id = ?", ("sess_1",))
        for i, mid in enumerate(mids):
            conn.execute(
                "INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)",
                ("sess_1", mid, i),
            )
        conn.commit()
    except sqlite3.IntegrityError as e:
        print("FAIL:", e, file=sys.stderr)
        return 1
    finally:
        conn.close()
    print("ok: session_messages insert with stub messages")
    return 0


def test_message_history_order_follows_sequence_not_created_at() -> int:
    """
    loadMessages must follow the session's messageIds order (junction sequence_order),
    not ORDER BY created_at. Two turns in one second can share the same timestamp and
    would sort arbitrarily by time alone.
    """
    conn = sqlite3.connect(":memory:")
    try:
        schema(conn)
        conn.execute(
            "INSERT INTO instructors (id, name, bio, tone) VALUES (?, ?, NULL, 'friendly')",
            ("inst_1", "Instructor inst_1"),
        )
        conn.execute(
            "INSERT INTO learners (id, name, level) VALUES (?, ?, 'beginner')",
            ("learner_1", "Learner learner_1"),
        )
        conn.execute(
            """
            INSERT INTO sessions (
              id, instructor_id, learner_id, instructor_profile_id,
              subject, topic, learning_objective, session_state,
              started_at, last_activity_at, ended_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), NULL)
            """,
            ("sess_1", "inst_1", "learner_1", "inst_1", "S", "T", "L", "active"),
        )
        same_ts = "2026-01-01 12:00:00"
        conn.execute(
            """
            INSERT INTO messages (
              id, session_id, sender, role, content, message_type, teaching_metadata, created_at
            ) VALUES (?, ?, 'u', 'learner', 'hi', 'question', NULL, ?)
            """,
            ("msg_learner", "sess_1", same_ts),
        )
        conn.execute(
            """
            INSERT INTO messages (
              id, session_id, sender, role, content, message_type, teaching_metadata, created_at
            ) VALUES (?, ?, 'u', 'instructor', 'reply', 'guidance', NULL, ?)
            """,
            ("msg_instructor", "sess_1", same_ts),
        )
        conn.execute(
            "INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)",
            ("sess_1", "msg_learner", 0),
        )
        conn.execute(
            "INSERT INTO session_messages (session_id, message_id, sequence_order) VALUES (?, ?, ?)",
            ("sess_1", "msg_instructor", 1),
        )
        conn.commit()

        ordered_ids = ["msg_learner", "msg_instructor"]
        cur = conn.cursor()
        placeholders = ",".join("?" * len(ordered_ids))
        by_created_at = cur.execute(
            f"SELECT id FROM messages WHERE id IN ({placeholders}) ORDER BY created_at",
            ordered_ids,
        ).fetchall()
        # Same created_at: SQLite order is not guaranteed to match conversation order.
        wrong_order = [r[0] for r in by_created_at]
        junction_order = [
            r[0]
            for r in cur.execute(
                """
                SELECT sm.message_id FROM session_messages sm
                WHERE sm.session_id = ?
                ORDER BY sm.sequence_order
                """,
                ("sess_1",),
            ).fetchall()
        ]
        if junction_order != ordered_ids:
            print("FAIL: junction order mismatch", junction_order, file=sys.stderr)
            return 1
        # Adapter behavior: reorder IN results to match messageIds (documented contract).
        row_by_id = {
            r[0]: r
            for r in cur.execute(
                f"SELECT id, role FROM messages WHERE id IN ({placeholders})",
                ordered_ids,
            ).fetchall()
        }
        reordered = [row_by_id[mid] for mid in ordered_ids if mid in row_by_id]
        roles = [r[1] for r in reordered]
        if roles != ["learner", "instructor"]:
            print(
                "FAIL: expected learner then instructor when following messageIds order; got",
                roles,
                "ORDER BY created_at gave",
                wrong_order,
                file=sys.stderr,
            )
            return 1
    finally:
        conn.close()
    print("ok: message history order follows sequence (not created_at alone)")
    return 0


if __name__ == "__main__":
    code = main()
    if code != 0:
        raise SystemExit(code)
    raise SystemExit(test_message_history_order_follows_sequence_not_created_at())
