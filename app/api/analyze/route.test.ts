import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

const body = {
  brief: {
    projectName: "Ember & Oak",
    goal: "Increase bookings for a neighbourhood restaurant.",
  },
  feedback: "The menu text is hard to read on mobile.",
};

test("the route exposes a missing-key error for the UI", async () => {
  const previousKey = process.env.COHERE_API_KEY;
  delete process.env.COHERE_API_KEY;

  try {
    const response = await POST(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
      }),
    );
    const payload = (await response.json()) as { error?: unknown };
    const errorMessage = typeof payload.error === "string" ? payload.error : "";

    assert.equal(response.status, 503);
    assert.equal(typeof payload.error, "string");
    assert.match(errorMessage, /not configured/i);
  } finally {
    if (previousKey === undefined) {
      delete process.env.COHERE_API_KEY;
    } else {
      process.env.COHERE_API_KEY = previousKey;
    }
  }
});
