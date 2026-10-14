# Briefly

Briefly turns vague, scattered client feedback into a prioritized, brief-aware checklist of design tasks.

## Current Scaffold

- Next.js App Router with TypeScript.
- Tailwind CSS styling.
- Single workspace screen for project context, pasted feedback, generated checklist, and editable client reply.
- Internal `/api/analyze` route with OpenAI-backed analysis and a local rule-based fallback.
- Typed analysis contracts in `lib/types.ts`.
- `.env.example` configuration for OpenAI and planned Supabase integrations.

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Enable AI Analysis

Copy `.env.example` to `.env.local` and set a server-side `OPENAI_API_KEY`. The
analysis route uses OpenAI's Responses API with a strict JSON schema, so the UI
continues to receive the existing `AnalysisResult` shape. It defaults to
`gpt-6-luna`; set `OPENAI_MODEL` to override it.

If no key is configured, or an AI response fails validation, Briefly keeps the
workspace usable with the local rule-based analyzer. The response header
`X-Briefly-Analysis-Source` is `ai` or `rule-based-fallback` for diagnostics.

## Next Implementation Steps

1. Add Supabase auth and persistence for projects and saved feedback analyses.
2. Add rate limiting to `/api/analyze`.
3. Add tests for the acceptance scenarios in `briefly-prd.md`.
