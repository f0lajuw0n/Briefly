import Link from "next/link";
import { ArrowRight, Check, ChevronDown, CircleHelp, FileText, ListChecks, MessageSquareText, ShieldCheck, Sparkles, ClipboardCheck, Send, Quote } from "lucide-react";
import { BrieflyLogo } from "@/components/briefly-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="site-page landing-page">
      <header className="site-header site-wrap">
        <Link className="site-brand" href="/" aria-label="Briefly home"><BrieflyLogo className="site-logo" /> <span>Briefly</span></Link>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="site-account-actions">
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>Get started <ArrowRight data-icon="inline-end" /></Link>
        </div>
      </header>
      <main>
        <section className="landing-hero site-wrap" aria-labelledby="landing-title">
          <div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="feedback-fragment fragment-one" aria-hidden="true"><span>“Can we make it pop more?”</span><i>Client</i></div>
          <div className="feedback-fragment fragment-two" aria-hidden="true"><ShieldCheck /><span>Keep the approved 5-tab navigation</span></div>
          <div className="feedback-fragment fragment-three" aria-hidden="true"><span>“Keep it simple—nothing gimmicky.”</span></div>
          <div className="feedback-fragment fragment-four" aria-hidden="true"><Check /><span>Actionable</span></div>
          <div className="hero-copy">
          <p className="hero-audience">For freelance designers and small studios</p>
          <h1 id="landing-title">Turn messy client feedback into <mark>a clear plan.</mark></h1>
          <p>Paste emails, call notes, or comment threads. Briefly turns them into prioritized tasks, questions to ask, and scope notes tied to the client’s own words.</p>
            <div className="hero-actions">
              <Link className={cn(buttonVariants({ size: "lg" }), "rounded-full")} href="/sign-up">Start free <ArrowRight data-icon="inline-end" /></Link>
              <Link className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full")} href="/request-demo">Request a demo</Link>
            </div>
          <p className="hero-footnote">No client messages are sent automatically.</p>
          </div>
          <div className="hero-preview" id="product" aria-label="A Briefly workplan generated from client feedback">
            <div className="preview-window">
              <div className="preview-top"><span className="preview-dots"><i /><i /><i /></span><span>Briefly workspace</span><span className="preview-status">Workplan ready</span></div>
              <div className="preview-app">
                <aside className="preview-sidebar">
                  <div className="preview-brand"><BrieflyLogo /> <strong>Briefly</strong></div>
                  <span className="preview-faux-button">+ New round</span>
                  <small>Projects</small>
                  <span className="is-current">Bloom <i>2 rounds</i></span>
                  <span>Tidewell Credit Union</span>
                  <span>Ember & Oak</span>
                </aside>
                <div className="preview-workspace">
                  <div className="preview-path">Bloom <span>/</span> Round 2</div>
                  <div className="preview-summary"><div><span>The short version</span><small>Brief-aware analysis</small></div><p>6 comments became 7 tasks. Start with the hero and checkout button. Two comments need an answer before work can begin.</p><dl><div><dt>Do first</dt><dd>Hero clarity and contrast</dd></div><div><dt>Ask first</dt><dd>2 questions, ready to copy</dd></div><div><dt>Scope</dt><dd>1 request to confirm</dd></div></dl></div>
                  <div className="preview-filters"><b>All 7</b><span>High 2</span><span>Needs answer 2</span><small>0 of 7 done</small></div>
                  <div className="preview-columns">
                    <div className="preview-tasks">
                      <div className="preview-label">Your tasks <span>2 shown</span></div>
                      <article className="preview-task"><span className="preview-check"><Check /></span><div><strong>Reduce visual clutter in the hero</strong><p>“The headline is too close to the image, and the CTA doesn’t stand out.”</p><small>Action · Add space and raise CTA contrast</small></div><span className="preview-priority">High</span><ChevronDown /></article>
                      <article className="preview-task"><span className="preview-empty"/><div><strong>Confirm the sticky header behavior</strong><p>“Can we make the header sticky when scrolling?”</p><small>Needs answer · Navigation</small></div><CircleHelp /><ChevronDown /></article>
                    </div>
                    <aside className="preview-questions"><strong>Ask the client</strong><p>Should search and cart stay visible while the header is sticky?</p><span className="preview-faux-button">Copy questions</span></aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-proof site-wrap"><p>Bring the feedback from wherever it landed.</p><div><span>Email threads</span><i /> <span>Slack messages</span><i /> <span>Call notes</span><i /> <span>Docs and comments</span></div></section>
        <section className="landing-features site-wrap" id="features" aria-labelledby="features-title">
          <div className="landing-section-heading"><h2 id="features-title">Built to stop the guessing.</h2><p>Briefly keeps the important context close, so you can decide what needs work, what needs an answer, and what may change the brief.</p></div>
          <div className="feature-grid">
            <article className="feature-card">
              <div className="feature-art feature-art-tasks" aria-hidden="true"><div className="art-window art-task-window"><div className="art-window-label"><ListChecks /> Workplan <span>3 tasks</span></div><div className="art-task"><i /><span>Improve hero clarity<small>High priority</small></span><Check /></div><div className="art-task"><i /><span>Refine product cards<small>Medium priority</small></span></div><div className="art-task"><i /><span>Make the CTA stand out<small>Medium priority</small></span></div></div><span className="art-floating art-priority">High priority</span></div>
              <div className="feature-copy"><h3>Know what to tackle first.</h3><p>Turn scattered comments into a prioritized checklist, with the original feedback close at hand.</p></div>
            </article>
            <article className="feature-card">
              <div className="feature-art feature-art-questions" aria-hidden="true"><div className="art-bubble art-comment"><MessageSquareText /> “Could it feel a bit more modern?”</div><div className="art-connector"><Sparkles /></div><div className="art-window art-question-window"><div className="art-window-label"><CircleHelp /> Ask the client</div><p>Should the direction feel more minimal or more expressive?</p><span>Question ready to copy</span></div></div>
              <div className="feature-copy"><h3>Make the vague bits clearer.</h3><p>Bring open questions and conflicting feedback into the conversation before you start designing.</p></div>
            </article>
            <article className="feature-card">
              <div className="feature-art feature-art-scope" aria-hidden="true"><div className="art-window art-brief-window"><div className="art-window-label"><FileText /> Project brief</div><small>Constraint</small><p>Keep the existing navigation.</p><div className="art-brief-line" /><div className="art-brief-line short" /></div><div className="art-floating art-scope-note"><ShieldCheck /><span>Scope to confirm<small>New navigation requested</small></span></div></div>
              <div className="feature-copy"><h3>Keep the brief in view.</h3><p>Spot requests that may affect the agreed scope, and make space for a thoughtful client conversation.</p></div>
            </article>
            <article className="feature-card">
              <div className="feature-art feature-art-reply" aria-hidden="true"><div className="art-window art-reply-window"><div className="art-window-label"><Send /> Client reply <span>Editable</span></div><p>What we’ll change</p><div className="art-reply-line" /><div className="art-reply-line short" /><p>Questions</p><div className="art-reply-line" /><span className="art-reply-send">Ready for your review</span></div></div>
              <div className="feature-copy"><h3>Send a reply you can stand behind.</h3><p>Start from a clear draft, edit it in your voice, then copy it only when it feels right.</p></div>
            </article>
          </div>
        </section>
        <section className="landing-how site-wrap" id="how-it-works" aria-labelledby="how-title">
          <div className="landing-section-heading how-heading"><div><span className="landing-step-note">Three steps, about a minute</span><h2 id="how-title">How it works.</h2><p>From the messy version to a clear next move—without manually sorting each comment first.</p></div><Link href="/sign-up" className={cn(buttonVariants({ size: "lg" }), "rounded-full")}>Start free <ArrowRight data-icon="inline-end" /></Link></div>
          <div className="how-steps">
            <article className="step-card"><div className="step-art step-art-brief" aria-hidden="true"><div className="step-paper"><div className="art-window-label"><FileText /> Project brief</div><small>Project</small><strong>Bloom website redesign</strong><small>Goal</small><strong>Make shopping feel effortless</strong><small>Constraints</small><span>Keep the current brand palette</span></div></div><div className="step-copy"><span>01</span><h3>Set the brief</h3><p>Add the goal and constraints so every request is considered in context.</p></div></article>
            <article className="step-card"><div className="step-art step-art-feedback" aria-hidden="true"><div className="step-feedback"><span><MessageSquareText /> Client feedback</span><p>“The homepage feels a bit crowded.”</p><p>“Can we make the button stand out more?”</p><p>“Keep the overall look simple.”</p><div><Sparkles /> Ready to analyze</div></div></div><div className="step-copy"><span>02</span><h3>Paste the feedback</h3><p>Drop in the unedited comments. The messy bits can stay messy.</p></div></article>
            <article className="step-card"><div className="step-art step-art-review" aria-hidden="true"><div className="step-workplan"><div className="art-window-label"><ListChecks /> Your workplan <span>3 tasks</span></div><div><i /><span>Give the hero more breathing room</span><b>High</b></div><div><i /><span>Make the CTA more visible</span><b>High</b></div><div><i /><span>Refine the overall look</span><b>Medium</b></div></div></div><div className="step-copy"><span>03</span><h3>Review the workplan</h3><p>Review the tasks, clarify open questions, and edit your client reply.</p></div></article>
          </div>
        </section>
        <section className="landing-principles site-wrap" aria-label="Briefly principles">
          <article><ClipboardCheck aria-hidden="true" /><h3>You stay in control</h3><p>Review and edit every task before anything leaves Briefly.</p></article>
          <article><Quote aria-hidden="true" /><h3>A plain data note</h3><p>Your pasted feedback and brief are sent to the analysis provider to generate the plan.</p></article>
          <article><ShieldCheck aria-hidden="true" /><h3>Privacy by design</h3><p>We make the product’s data handling clear before you begin.</p></article>
        </section>
        <section className="landing-faq site-wrap" id="faq" aria-labelledby="faq-title">
          <div className="landing-section-heading"><h2 id="faq-title">Frequently asked questions.</h2></div>
          <div className="faq-list">
            <details><summary>What can I paste in?<ChevronDown /></summary><p>Emails, chat threads, call notes, comments, and loose paragraphs. You do not need to clean them up first.</p></details>
            <details><summary>Does it make things up?<ChevronDown /></summary><p>Each task keeps a related feedback quote so you can check where it came from. You make the final call.</p></details>
            <details><summary>What does the analysis use?<ChevronDown /></summary><p>Briefly uses Cohere to analyze the brief and feedback, then returns a workplan for you to review.</p></details>
            <details><summary>Can I try it with a real project?<ChevronDown /></summary><p>Yes. Start free to create an account and begin a project, or request a demo if you would like a guided walkthrough.</p></details>
          </div>
        </section>
        <section className="landing-bottom site-wrap"><div><BrieflyLogo /><div><h2>Spend less time decoding feedback.</h2><p>Paste the next round and see the plan in seconds.</p></div></div><Link className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "rounded-full")} href="/sign-up">Start free <ArrowRight data-icon="inline-end" /></Link></section>
      </main>
      <footer className="site-footer site-wrap"><Link className="site-brand" href="/"><BrieflyLogo className="site-logo" /> <span>Briefly</span></Link><span>Made for the work behind the work.</span><div><Link href="/sign-in">Sign in</Link><Link href="/workspace">Workspace</Link></div></footer>
    </div>
  );
}
