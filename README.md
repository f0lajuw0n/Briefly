# Briefly

Briefly turns vague, scattered client feedback into a prioritized, brief-aware checklist of design tasks.

## Current Scaffold

- Next.js App Router with TypeScript.
- Tailwind CSS styling.
- Landing page and workspace for project context, pasted feedback, generated checklist, and editable client reply.
- Supabase email/password sign-up, sign-in, confirmation and password recovery screens.
- Internal `/api/analyze` route with Cohere-backed analysis and clear provider errors.
- Typed analysis contracts in `lib/types.ts`.
- `.env.example` configuration for Cohere and Supabase.

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

## Enable Authentication

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` to your Supabase project URL and public anon (or publishable) key. Never put the service-role key in a public variable. Enable email/password authentication in Supabase, set the site URL to your application origin, and allow these redirect URLs in Supabase Authentication settings:

- `http://localhost:3000/auth/confirm`
- `http://localhost:3000/reset-password`

Add equivalent URLs for your deployed domain. Restart the development server after changing environment variables. Depending on your Supabase email settings, a new user may need to confirm their email before signing in. Authentication is optional for the workspace, and projects and analyses remain in the current browser session; signing in does not save them.

## Enable Demo Requests

Set `DEMO_REQUEST_EMAIL` to the public contact address that should receive demo requests. The request page prepares a message in the visitor's email app; the visitor must send it to complete the request. Until an address is configured, the page shows that requests are temporarily unavailable. Set the variable when building the deployed app as well.

## Next Implementation Steps

1. Add persistence for projects and saved feedback analyses.
2. Add rate limiting to `/api/analyze`.
3. Add tests for the acceptance scenarios in `briefly-prd.md`.
