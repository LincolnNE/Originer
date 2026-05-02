#!/usr/bin/env python3
"""
Contract: conversation history must follow session messageIds order, not created_at.

SessionOrchestrator + PromptAssembler rely on loadMessages() order matching the
canonical transcript (session_messages.sequence_order / messageIds).

This script models the bug: ORDER BY created_at can disagree with messageIds
when timestamps collide or are misordered; reordering by messageIds fixes it.
"""

import sqlite3


def main() -> None:
    conn = sqlite3.connect(":memory:")
    conn.execute(
        "CREATE TABLE messages (id TEXT PRIMARY KEY, created_at TEXT, content TEXT)"
    )
    # Instructor row has an *earlier* created_at than the learner row (clock skew or
    # batch backfill). Canonical dialogue order is still learner → instructor (messageIds).
    conn.execute(
        "INSERT INTO messages VALUES (?,?,?)",
        ("msg_learner", "2020-01-01T00:00:02.000Z", "Why?"),
    )
    conn.execute(
        "INSERT INTO messages VALUES (?,?,?)",
        ("msg_instructor", "2020-01-01T00:00:01.000Z", "What do you think?"),
    )
    conn.commit()

    ids_chronological_in_dialogue = ["msg_learner", "msg_instructor"]

    rows_old = list(
        conn.execute(
            f"SELECT id FROM messages WHERE id IN ({'?,?'}) ORDER BY created_at",
            ids_chronological_in_dialogue,
        )
    )
    old_order = [r[0] for r in rows_old]

    placeholders = ",".join("?" * len(ids_chronological_in_dialogue))
    rows_fetched = list(
        conn.execute(
            f"SELECT id FROM messages WHERE id IN ({placeholders})",
            ids_chronological_in_dialogue,
        )
    )
    by_id = {r[0]: r for r in rows_fetched}
    new_order = [i for i in ids_chronological_in_dialogue if i in by_id]

    assert new_order == ["msg_learner", "msg_instructor"], new_order
    assert old_order == ["msg_instructor", "msg_learner"], (
        "fixture expects ORDER BY created_at to invert dialogue vs messageIds; "
        f"got old_order={old_order}"
    )
    print("ok: messageIds order preserved;", "old_order=", old_order, "new_order=", new_order)


if __name__ == "__main__":
    main()
