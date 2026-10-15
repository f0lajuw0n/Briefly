import assert from "node:assert/strict";
import test from "node:test";
import {
  CohereAnalysisError,
  analyzeFeedbackWithCohere,
} from "./analyze-feedback-ai";
import type { AnalysisRequest } from "./types";

const request: AnalysisRequest = {
  brief: {
    projectName: "Ember & Oak",
    goal: "Increase bookings for a neighbourhood restaurant.",
    deliverableType: "Restaurant website refresh",
  },
  feedback: "The menu text is hard to read on mobile.",
};

const validAnalysis = JSON.stringify({
  checklist: [
    {
      priority: "high",
      category: "actionable design task",
      taskTitle: "Improve mobile menu legibility",
      suggestedAction: "Increase the menu type size and contrast on small screens.",
      rationale: "Mobile visitors need to read the menu before booking.",
      relatedFeedback: "The menu text is hard to read on mobile.",
      briefAlignment: "strong",
      nextAction: "Confirm the smallest supported mobile viewport.",
    },
  ],
  clientReply: "I will improve the mobile menu legibility and confirm the supported viewport.",
});

function mockFetch(body: unknown, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;
}

async function expectCohereError(run: () => Promise<unknown>, status: number) {
  await assert.rejects(run, (error: unknown) => {
    return error instanceof CohereAnalysisError && error.status === status;
  });
}

test("missing Cohere key returns a configuration error instead of a fallback result", async () => {
  await expectCohereError(
    () => analyzeFeedbackWithCohere(request, { apiKey: "" }),
    503,
  );
});

test("Cohere HTTP errors return an error instead of a fallback result", async () => {
  await expectCohereError(
    () =>
      analyzeFeedbackWithCohere(request, {
        apiKey: "test-key",
        fetchImplementation: mockFetch({ message: "provider error" }, 500),
      }),
    502,
  );
});

test("empty Cohere content returns an error instead of a fallback result", async () => {
  await expectCohereError(
    () =>
      analyzeFeedbackWithCohere(request, {
        apiKey: "test-key",
        fetchImplementation: mockFetch({ message: { content: [] } }),
      }),
    502,
  );
});

test("a reasoning block before a text block is skipped and the text analysis is used", async () => {
  const response = await analyzeFeedbackWithCohere(request, {
    apiKey: "test-key",
    model: "test-chat-model",
    fetchImplementation: mockFetch({
      message: {
        content: [
          { type: "thinking", text: "internal reasoning" },
          { type: "text", text: validAnalysis },
        ],
      },
    }),
  });

  assert.equal(response.source.provider, "cohere");
  assert.equal(response.source.model, "test-chat-model");
  assert.equal(response.result.checklist[0]?.relatedFeedback, request.feedback);
});

test("truncated Cohere JSON returns an error instead of a fallback result", async () => {
  await expectCohereError(
    () =>
      analyzeFeedbackWithCohere(request, {
        apiKey: "test-key",
        fetchImplementation: mockFetch({
          message: { content: [{ type: "text", text: '{"checklist":' }] },
        }),
      }),
    502,
  );
});
