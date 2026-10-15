# Briefly Agents Guide

## What We Are Building

Briefly is a focused web app for freelance designers and small design teams. It turns vague, scattered client feedback into a prioritized, brief-aware checklist of design tasks, plus a client-ready response the designer can edit and send.

The product exists because designers often receive feedback across email, Slack, Figma comments, meeting notes, and shared documents. That feedback is frequently vague, duplicated, contradictory, subjective, or outside the agreed project scope. Briefly uses the project brief as context so designers can quickly understand what the client likely means, what matters first, what needs clarification, and what may be scope creep.

The core V1 workflow is:

1. Enter lightweight project context.
2. Paste raw messy client feedback.
3. Generate a prioritized design checklist.
4. Review an editable client reply.
5. Copy the checklist or reply for use outside Briefly.

## Product Principles

- Keep V1 centered on one workflow: brief in, feedback in, checklist and reply out.
- Help designers think faster without replacing their judgment.
- Preserve traceability from generated tasks back to client feedback.
- Treat ambiguity as a first-class output, not a failure.
- Flag scope creep diplomatically.
- Avoid turning this into a project management app, client portal, or integration hub in V1.

## Primary Users

- Freelance brand, web, product, and marketing designers.
- Boutique studios and small design teams.
- Designers who collect feedback from non-design stakeholders.

## V1 Feature Scope

### Project Brief Input

The brief captures the context needed to interpret feedback:

- Project name.
- Project goal.
- Constraints.
- Optional deliverable type.
- Optional target audience.
- Optional tone or creative direction.

Project and Goal are required. Feedback is required before analysis. Other brief fields are optional and should be omitted from analysis payloads when empty.

### Messy Feedback Input

Users paste raw notes from emails, chat messages, Figma comments, meeting notes, bullet lists, or loose paragraphs. The product should not require users to organize the feedback first.

### Brief-Aware Analysis

The analysis should classify and interpret feedback as:

- Actionable design task.
- Needs clarification.
- Duplicate or overlapping feedback.
- Potential conflict.
- Potential scope creep.
- Low-priority or subjective preference.

### Prioritized Checklist

Each checklist item should include:

- Priority.
- Category.
- Task title.
- Suggested design action.
- Rationale.
- Related feedback quote.
- Brief alignment.
- Next action.

### Client Reply

The reply should be professional, concise, editable, and easy to copy. It should include:

- Confirmed changes.
- Clarifying questions.
- Scope notes.
- Next steps.

## Explicitly Out Of Scope For V1

- Figma plugin.
- File uploads.
- Screenshot or design-file analysis.
- Client portal.
- Client accounts.
- Multi-user collaboration.
- Full project management, task assignment, or task status tracking.
- Payment processing.
- Slack, Figma, Notion, Google Drive, or email integrations.
- Version history.
- Automated client messaging.
- Public API.

## Tech Stack

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS v4 via `@tailwindcss/postcss`.
- `lucide-react` for icons.
- `clsx` for conditional classes.
- Internal route handler at `app/api/analyze/route.ts`.
- Current local rule-based analyzer in `lib/analyze-feedback.ts`.

Configured for analysis:

- Cohere Chat API V2 for AI-backed analysis.

Planned but not wired:
- Supabase for auth, projects, and saved analyses.
- Vercel for deployment.

## Folder Structure

- `app/layout.tsx`: Root layout and metadata.
- `app/page.tsx`: Home route; renders the workspace.
- `app/globals.css`: Global tokens, layout styles, motion, responsive behavior, and component class styles.
- `app/api/analyze/route.ts`: Internal POST endpoint for feedback analysis.
- `components/briefly-workspace.tsx`: Main client-side workspace UI and interactions.
- `lib/types.ts`: Shared request/result/domain types.
- `lib/analyze-feedback.ts`: Local analyzer implementation.
- `lib/format.ts`: Clipboard formatting helpers.
- `lib/sample-data.ts`: Initial sample brief and feedback.
- `briefly-prd.md`: Product requirements and acceptance scenarios.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run start
```

Use `npm run check` for TypeScript validation.

Use `npm run build` before handing off code changes. The build script uses `next build --webpack` intentionally; do not remove `--webpack` unless the Next/Turbopack CSS build issue has been verified fixed in this project environment.

## Coding Conventions

- Use TypeScript and keep strict type checks passing.
- Keep App Router patterns. Do not add a Pages Router.
- Keep interactive UI inside client components only when needed. The main workspace is intentionally a client component.
- Prefer small, local helpers over broad abstractions.
- Keep `AnalysisResult` stable unless updating all call sites and clipboard formatting.
- Keep the analyzer route internal; V1 does not expose a public API.
- Preserve the local rule-based analyzer until an AI-backed adapter is intentionally introduced.
- When sending analysis requests, omit empty optional brief fields rather than sending blank strings.
- The Cohere-backed analyzer must return the same `AnalysisResult` shape unless the UI and formatter are updated in the same change.

## UI And Design Guidelines

- Keep the interface clean, minimal, and work-focused.
- This is a product workspace, not a marketing page.
- Maintain the current black/white/paper visual system with restrained accent use.
- Use fine borders, small radii, dense but readable spacing, and clear information hierarchy.
- Use `lucide-react` icons for controls when an icon is needed.
- Keep controls keyboard accessible and visibly focusable.
- Respect `prefers-reduced-motion`.
- Keep motion purposeful: pressed button feedback, skeleton loading, result entry, disclosure transitions, and copy toast are enough.
- Do not use negative letter spacing or viewport-scaled font sizes.

## Brief Form Behavior

- Field order is Project, Goal, Constraints, then optional context.
- Optional context contains Deliverable, Audience, and Tone.
- Optional context is collapsed for blank workspaces.
- Optional context opens by default if any optional field already has a value, including sample data.
- All brief inputs are auto-growing textareas so long text wraps and is never cut off.
- Header counter should read `X of 6 filled`, counting non-empty brief fields only.
- `Analyze` is disabled until Project, Goal, and Feedback are filled.
- `New` clears the brief, feedback, results, errors, and collapses optional context.
- Collapsed optional context fields should be hidden from the accessibility tree.

## Current Behavior To Preserve

- Sample data loads into the workspace.
- Analysis groups duplicate density feedback.
- Analysis flags scope creep and conflicting stakeholder direction.
- Checklist items remain tied to related feedback quotes.
- Client reply is editable.
- Copy actions write formatted output to the clipboard and show a toast.
- Blank optional fields are not sent to the analysis route.

## Verification Checklist

Before finishing meaningful code changes, run:

```bash
npm run check
npm run build
```

For UI changes, also verify in the browser when practical:

- Required field gating works.
- Optional context expands and collapses correctly.
- Long brief text wraps in auto-growing fields.
- Header counter reports the correct filled-field count.
- Blank optional fields are omitted from analysis payloads.
- Sample analysis generates a checklist and client reply.
- Copy buttons still show the toast.

## Modification Notes

- Do not overwrite user-created edits without checking the diff.
- Keep changes scoped to the requested behavior.
- Avoid adding dependencies unless they are clearly needed.
- Keep the V1 surface narrow and brief-aware.
- Do not add accounts, persistence, uploads, integrations, or project management features unless explicitly requested.
- Keep `next.config.ts` `agentRules: false`; otherwise Next dev may regenerate its own `AGENTS.md` content.
