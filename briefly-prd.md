# Briefly Product Requirements Document

## 1. Product Name and One-Line Description

**Product name:** Briefly

**One-line description:** Briefly turns vague, scattered client feedback into a prioritized, brief-aware checklist of design tasks.

## 2. Source Prompt

> I want to build a web app that turns messy, scattered client feedback into a clear, prioritized checklist of design tasks, using the project's brief to interpret vague comments. The target user is freelance and small-team designers who receive unstructured client feedback and waste time interpreting it, identifying scope creep, and chasing clarification. Recommend tech stack to use. Please generate a structured PRD for this product that includes: product name and one-line description, problem statement, target user profile, core features for v1 max 5, user stories for each feature, what is explicitly out of scope, tech stack, and definition of done.

## 3. Problem Statement

Freelance and small-team designers often receive client feedback through scattered, unstructured channels such as email, Slack, Figma comments, meeting notes, and shared documents. The feedback is frequently vague, duplicated, contradictory, or disconnected from the original project brief.

This forces designers to spend valuable time interpreting what clients mean, deciding what matters most, identifying potential scope creep, and writing follow-up questions before they can begin the actual design work. Misinterpreted feedback can create rework, missed expectations, project delays, and awkward client communication.

Briefly solves this by using the project brief as context to transform messy feedback into a clear, prioritized design task checklist, plus a client-ready response that confirms next steps and asks for clarification where needed.

## 4. Target User Profile

### Primary Users

- Freelance brand, web, product, and marketing designers.
- Boutique studios and small design teams handling client-facing projects.
- Designers who frequently collect feedback from non-design stakeholders.

### User Problems

- They receive feedback in messy, inconsistent formats.
- They waste time translating vague comments into actionable tasks.
- They struggle to identify which feedback is high priority.
- They need to detect scope creep without sounding defensive.
- They need better client communication around ambiguous or conflicting feedback.

### User Goals

- Quickly understand what the client is actually asking for.
- Turn raw comments into clear design tasks.
- Prioritize work based on the brief and project goals.
- Know which comments need clarification before work begins.
- Send a professional response that confirms next steps.

## 5. Core Features for V1

V1 should stay focused on one core workflow: enter project context, paste feedback, generate a prioritized checklist, and draft a client response.

### Feature 1: Project Brief and Context Input

Designers can enter a lightweight project brief so Briefly has enough context to interpret client feedback.

The brief input should support:

- Client or project name.
- Project goal.
- Target audience.
- Deliverable type, such as landing page, brand identity, pitch deck, app screen, or marketing asset.
- Brand tone or creative direction.
- Known constraints, such as timeline, existing brand guidelines, required sections, or fixed assets.

**User stories:**

- As a freelance designer, I want to enter the project goal so the tool can judge whether feedback supports the original objective.
- As a studio designer, I want to include audience and brand tone so vague feedback can be interpreted in the right creative context.
- As a designer managing scope, I want to list constraints so the tool can flag requests that may fall outside the agreed direction.

### Feature 2: Messy Feedback Input

Designers can paste raw client feedback from multiple sources into one input field.

The feedback input should accept:

- Email replies.
- Slack or chat messages.
- Figma comment exports or copied comments.
- Meeting notes.
- Bullet lists or unstructured paragraphs.

**User stories:**

- As a designer, I want to paste all client feedback at once so I do not have to manually organize it first.
- As a designer receiving feedback from multiple stakeholders, I want the tool to handle duplicated or overlapping comments.
- As a designer, I want the tool to preserve the original meaning of comments so I can trace tasks back to what the client said.

### Feature 3: Brief-Aware Feedback Analysis

Briefly analyzes feedback against the project brief to identify intent, priority, ambiguity, conflicts, duplicate comments, and potential scope creep.

The analysis should classify comments into useful categories:

- Actionable design task.
- Needs clarification.
- Duplicate or overlapping feedback.
- Potential conflict.
- Potential scope creep.
- Low-priority or subjective preference.

**User stories:**

- As a designer, I want vague feedback like "make it pop" translated into a likely design action based on the brief.
- As a designer, I want conflicting feedback surfaced so I can ask the client before making changes.
- As a designer, I want possible scope creep flagged so I can protect the project timeline and budget.

### Feature 4: Prioritized Design Checklist

Briefly generates a clear, prioritized checklist of design tasks that the designer can use as an execution plan.

Each checklist item should include:

- Priority: high, medium, low, or needs clarification.
- Task title.
- Suggested design action.
- Rationale.
- Related client quote or source comment.
- Brief alignment.
- Suggested next action.

Example checklist item:

```text
Priority: High
Task: Improve hero CTA hierarchy
Suggested action: Make the primary CTA more visually dominant and reduce competing elements around the hero section.
Rationale: The client wants the page to feel clearer and more conversion-focused, which aligns with the brief's lead-generation goal.
Related feedback: "The top section feels busy and I am not sure where to click first."
Brief alignment: Strong
Next action: Update layout hierarchy, then review CTA contrast and spacing.
```

**User stories:**

- As a designer, I want a prioritized checklist so I know what to work on first.
- As a designer, I want each task tied back to client feedback so I can justify decisions.
- As a designer, I want tasks written in practical design language so I can start work immediately.

### Feature 5: Client-Ready Response Draft

Briefly drafts a professional response the designer can send or adapt after reviewing the generated checklist.

The response should include:

- A concise summary of confirmed changes.
- Clarifying questions for vague or conflicting feedback.
- Polite notes about possible scope changes.
- A clear next-step statement.

**User stories:**

- As a designer, I want a client-ready response so I can quickly confirm what I will change.
- As a designer, I want clarification questions phrased professionally so I can avoid sounding confrontational.
- As a designer, I want scope concerns framed diplomatically so I can protect the project without damaging the client relationship.

## 6. Product Interfaces

### V1 Workspace

The MVP should use a single workspace screen with three main sections:

1. **Project brief input:** Structured fields for context.
2. **Feedback input:** A large paste area for raw client feedback.
3. **Generated output:** Prioritized checklist and client reply.

### Generated Checklist Output

The checklist should be structured and scannable. Each item should include:

- Priority.
- Task.
- Rationale.
- Related feedback quote.
- Brief alignment.
- Next action.

### Client Reply Output

The client reply should be editable and easy to copy. It should include:

- Confirmed changes.
- Clarification questions.
- Scope notes.
- Next steps.

### API and Backend Surface

V1 does not require a public API. The product can use internal app routes or server actions to submit the brief and feedback for analysis and return structured output.

## 7. What Is Explicitly Out of Scope

The following are not part of V1:

- Figma plugin.
- File uploads.
- Visual design analysis from screenshots or design files.
- Client portal.
- Client accounts.
- Multi-user team collaboration.
- Full project management or task assignment.
- Status tracking beyond the generated checklist.
- Payment processing.
- Integrations with Slack, Figma, Notion, Google Drive, or email.
- Version history.
- Automated client messaging.
- Public API.

## 8. Recommended Tech Stack

### Frontend

- **Next.js:** Full-stack React framework for a fast SaaS MVP.
- **TypeScript:** Safer application logic and better maintainability.
- **Tailwind CSS:** Fast styling and consistent UI implementation.

### Backend

- **Next.js Server Actions or Route Handlers:** Handle feedback analysis requests without introducing a separate backend service.
- **OpenAI API:** Generate brief-aware analysis, structured checklist items, clarification questions, and client replies.

### Database and Auth

- **Supabase:** Authentication, Postgres database, and simple project persistence.

### Deployment

- **Vercel:** Hosting, preview deployments, environment variable management, and simple deployment workflow for Next.js.

### Suggested Data Model for V1

The exact schema can evolve during implementation, but V1 likely needs:

- **User:** Supabase-authenticated account.
- **Project:** Name, brief fields, created date, updated date.
- **Feedback analysis:** Raw feedback, generated checklist, generated client reply, analysis metadata, created date.

## 9. Definition of Done

V1 is done when a designer can:

- Create or open a project workspace.
- Enter project context through structured brief fields.
- Paste raw, messy client feedback.
- Generate a brief-aware prioritized checklist.
- See vague, duplicate, conflicting, and potentially out-of-scope feedback clearly identified.
- Review checklist items with priority, rationale, related client quote, brief alignment, and suggested next action.
- Generate a client-ready response with confirmed changes, clarification questions, and scope notes.
- Copy the checklist and client reply for use outside the app.
- Complete the workflow without needing an integration, file upload, or separate project management tool.

## 10. Acceptance Scenarios

### Scenario 1: Vague Feedback Becomes Actionable

**Given** a project brief for a premium consulting website  
**And** client feedback that says, "Can we make it pop more?"  
**When** the designer generates the checklist  
**Then** Briefly should produce a concrete task that fits the premium positioning, such as improving contrast, hierarchy, imagery, or CTA emphasis without suggesting an off-brand playful direction.

### Scenario 2: Duplicate Feedback Is Grouped

**Given** multiple comments such as "The homepage feels busy," "There is too much going on," and "Can we simplify the top section?"  
**When** the designer generates the checklist  
**Then** Briefly should group them into one design task about reducing homepage or hero-section visual density.

### Scenario 3: Scope Creep Is Flagged

**Given** a brief for a landing page refresh  
**And** client feedback asking for a new blog, new testimonial system, or additional product pages  
**When** the designer generates the checklist  
**Then** Briefly should mark the request as potential scope creep and suggest a diplomatic client response.

### Scenario 4: Conflicting Feedback Needs Clarification

**Given** one stakeholder asks for a minimalist design  
**And** another asks for more graphics, animations, and decorative elements  
**When** the designer generates the checklist  
**Then** Briefly should flag the conflict and generate a clarification question.

### Scenario 5: Client Reply Is Ready to Edit

**Given** generated checklist items with confirmed tasks, unclear comments, and potential scope changes  
**When** Briefly creates a client reply  
**Then** the reply should be concise, professional, editable, and suitable for the designer to send after review.

## 11. Assumptions and Defaults

- The MVP is a web app, not a plugin or client portal.
- The primary output is a prioritized checklist plus a client-ready response.
- The product starts as a fast SaaS MVP using Next.js, Supabase, Vercel, TypeScript, Tailwind CSS, and the OpenAI API.
- Users will manually paste brief and feedback content in V1.
- Generated output should assist the designer, not replace their professional judgment.
- Designers should review all AI-generated recommendations before sending anything to clients.
- The PRD is intended for an engineer or builder to implement from directly.
