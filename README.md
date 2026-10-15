# Briefly

Briefly turns vague, scattered client feedback into a prioritized, brief-aware checklist of design tasks.

## Current Scaffold

- Next.js App Router with TypeScript.
- Tailwind CSS styling.
- Single workspace screen for project context, pasted feedback, generated checklist, and editable client reply.
- Internal `/api/analyze` route with Cohere-backed analysis and clear provider errors.
- Typed analysis contracts in `lib/types.ts`.
- `.env.example` configuration for Cohere and planned Supabase integrations.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Enable AI Analysis

Copy `.env.example` to `.env.local` and set a server-side `COHERE_API_KEY`. The
analysis route uses Cohere's Chat API V2 with a JSON schema, so the UI continues
to receive the existing `AnalysisResult` shape. It defaults to
`command-a-plus-05-2026`; set `COHERE_MODEL` to override it.

If no key is configured, or an AI response fails validation, Briefly keeps the
brief and feedback in place and shows a retryable error. The local analyzer is
available only through the clearly labelled sample-output control. The response
JSON includes the Cohere provider and model; the `X-Briefly-Analysis-Source`
header remains available for diagnostics.

## Next Implementation Steps

1. Add Supabase auth and persistence for projects and saved feedback analyses.
2. Add rate limiting to `/api/analyze`.
3. Add tests for the acceptance scenarios in `briefly-prd.md`.
