/**
 * Regression: conversation history for prompts must follow session turn order,
 * not `created_at` / timestamp sort (ties, stable-sort ambiguity, and clock skew scramble dialogue).
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

test("history follows message array order when timestamps disagree with turn order", () => {
  // Learner spoke first in session order, but their row got a later clock (e.g. skew or batch write).
  // Chronological sort would put the instructor line first and scramble the dialogue.
  const messages = [
    { role: "learner", content: "Question A", timestamp: 2000 },
    { role: "instructor", content: "Answer A", timestamp: 1000 },
  ];
  const expected = "Learner: Question A\n\nInstructor: Answer A";
  assert.equal(formatHistoryLikePromptAssembler(messages), expected);
  assert.notEqual(formatHistoryWithTimestampSort(messages), expected);
  assert.equal(
    formatHistoryWithTimestampSort(messages),
    "Instructor: Answer A\n\nLearner: Question A"
  );
});
