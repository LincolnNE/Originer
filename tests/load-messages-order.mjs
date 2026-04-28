/**
 * Validates session message history preserves session order (not created_at order).
 * Run: node tests/load-messages-order.mjs
 */
import Database from "better-sqlite3";

const db = new Database(":memory:");
db.exec(`
  CREATE TABLE messages (id TEXT PRIMARY KEY, content TEXT, created_at TEXT);
`);

// B is earlier in time than A, but session order (messageIds) is A, B, C — a realistic skew.
db.prepare("INSERT INTO messages VALUES (?, ?, ?)").run("A", "a", "2026-01-01T00:00:02.000Z");
db.prepare("INSERT INTO messages VALUES (?, ?, ?)").run("B", "b", "2026-01-01T00:00:00.000Z");
db.prepare("INSERT INTO messages VALUES (?, ?, ?)").run("C", "c", "2026-01-01T00:00:05.000Z");

const messageIds = ["A", "B", "C"];
const placeholders = messageIds.map(() => "?").join(",");
const whenClauses = messageIds
  .map((_, i) => `WHEN id = ? THEN ${i}`)
  .join(" ");
const byCreated = db
  .prepare(`SELECT id FROM messages WHERE id IN (${placeholders}) ORDER BY created_at`)
  .all(...messageIds);
const bySession = db
  .prepare(
    `SELECT id FROM messages WHERE id IN (${placeholders}) ORDER BY CASE ${whenClauses} ELSE 999 END`
  )
  .all(...messageIds, ...messageIds);

if (byCreated.map((r) => r.id).join(",") === "A,B,C") {
  throw new Error("byCreated should not equal session order when times disagree with messageIds");
}
if (bySession.map((r) => r.id).join(",") !== "A,B,C") {
  throw new Error("bySession should preserve A,B,C order: " + JSON.stringify(bySession));
}
console.log("ok: loadMessages must use session order, not created_at");

db.close();
