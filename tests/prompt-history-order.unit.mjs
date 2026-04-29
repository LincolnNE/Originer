/**
 * Regression: conversation history for prompts must follow session turn order,
 * not `created_at` / timestamp sort (ties and clock skew scramble dialogue).
 * Run: node --test tests/prompt-history-order.unit.mjs
 */

import { test } from "node:test";
import assert from "node:assert/strict";

function formatHistoryLikePromptAssembler(messages) {
  if (messages.length === 0) return "";
  return messages
    .map((msg) => {
      const roleLabel = msg.role === "instructor" ? "Instructor" : "Learner";
      return `${roleLabel}: ${msg.content}`;
    })
    .join("\n\n");
}

function formatHistoryWithTimestampSort(messages) {
  if (messages.length === 0) return "";
  const sorted = [...messages].sort((a, b) => a.timestamp - b.timestamp);
  return sorted
    .map((msg) => {
      const roleLabel = msg.role === "instructor" ? "Instructor" : "Learner";
      return `${roleLabel}: ${msg.content}`;
    })
    .join("\n\n");
}

test("history follows message array order when timestamps are equal", () => {
  const t = new Date("2020-01-01T00:00:00.000Z").getTime();
  const messages = [
    { role: "instructor", content: "second turn", timestamp: t },
    { role: "learner", content: "first turn", timestamp: t },
  ];
  const expected = "Instructor: second turn\n\nLearner: first turn";
  assert.equal(formatHistoryLikePromptAssembler(messages), expected);
  assert.notEqual(formatHistoryWithTimestampSort(messages), expected);
});
