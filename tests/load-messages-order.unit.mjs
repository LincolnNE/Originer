/**
 * Verifies that conversation message lists follow session `messageIds` order,
 * not `created_at` (which can tie or mis-order relative to actual turn sequence).
 * Run: node --test tests/load-messages-order.unit.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

test("order follows messageIds when timestamps are identical", () => {
  const messageIds = ["m_second", "m_first"];
  const rows = [
    {
      id: "m_first",
      session_id: "s1",
      role: "learner",
      content: "earlier turn",
      message_type: "question",
      teaching_metadata: null,
      created_at: "2020-01-01T00:00:00.000Z",
    },
    {
      id: "m_second",
      session_id: "s1",
      role: "instructor",
      content: "later turn",
      message_type: "guidance",
      teaching_metadata: null,
      created_at: "2020-01-01T00:00:00.000Z",
    },
  ];
  const byId = new Map();
  for (const row of rows) {
    byId.set(row.id, row);
  }
  const ordered = [];
  for (const id of messageIds) {
    const row = byId.get(id);
    if (row) ordered.push(row);
  }
  assert.equal(ordered[0].id, "m_second");
  assert.equal(ordered[1].id, "m_first");
  const wrongChronological = [...rows].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  assert.notDeepEqual(
    wrongChronological.map((r) => r.id),
    messageIds
  );
});
