/**
 * Ensures loadMessages returns rows in the order of the messageIds argument,
 * not by created_at (which can reorder messages that share a timestamp).
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseStorageAdapter } = require("../dist/backend/adapters/storage/database");

test("loadMessages preserves messageIds order (same created_at)", async (t) => {
  const db = new DatabaseStorageAdapter({ type: "sqlite", connectionString: ":memory:" });
  const d = db["db"];
  const sessionId = "sess_test_order";
  const sameTime = new Date("2020-01-01T00:00:00.000Z");

  d.prepare("INSERT INTO instructors (id, name) VALUES (?, ?)").run("inst1", "I");
  d.prepare("INSERT INTO learners (id, name) VALUES (?, ?)").run("learner1", "L");
  d.prepare(
    "INSERT INTO sessions (id, instructor_id, learner_id) VALUES (?,?,?)"
  ).run(sessionId, "inst1", "learner1");

  await db.saveMessage({
    id: "msg_a",
    sessionId,
    role: "learner",
    content: "first",
    messageType: "question",
    timestamp: sameTime,
  });
  await db.saveMessage({
    id: "msg_b",
    sessionId,
    role: "instructor",
    content: "second",
    messageType: "guidance",
    timestamp: sameTime,
  });

  const ab = await db.loadMessages(["msg_a", "msg_b"]);
  assert.equal(ab.map((m) => m.content).join(","), "first,second");

  const ba = await db.loadMessages(["msg_b", "msg_a"]);
  assert.equal(ba.map((m) => m.content).join(","), "second,first");

  db.close();
});
