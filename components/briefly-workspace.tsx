"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  AlertTriangle,
  ArrowUp,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Download,
  FileText,
  FolderOpen,
  HelpCircle,
  Loader2,
  MessageSquareText,
  Plus,
  Sparkles,
  Wand2,
} from "lucide-react";
import clsx from "clsx";
import { formatChecklistForClipboard, formatResultForClipboard } from "@/lib/format";
import type { AnalysisResult, ChecklistItem, ProjectBrief } from "@/lib/types";

type CopyKind = "all" | "checklist" | "reply" | "questions" | "scope";
type WorkFilter = "all" | "high" | "clarify" | "scope" | "inScope";
type ExportContent = "checklist" | "reply" | "both";
type ExportFormat = "text" | "markdown";
type ProjectSession = {
  id: string;
  brief: ProjectBrief;
  feedback: string;
  result: AnalysisResult | null;
  reply: string;
  completed: string[];
};

const emptyBrief: ProjectBrief = {
  projectName: "",
  goal: "",
  audience: "",
  deliverableType: "",
  tone: "",
  constraints: "",
};

const briefFields: Array<{
  key: keyof ProjectBrief;
  label: string;
  placeholder: string;
  minRows: number;
  required?: boolean;
}> = [
  { key: "projectName", label: "Project", placeholder: "Northstar Advisory", minRows: 1, required: true },
  {
    key: "goal",
    label: "Goal",
    placeholder: "Increase consultation bookings",
    minRows: 1,
    required: true,
  },
  {
    key: "constraints",
    label: "Constraints",
    placeholder: "Keep approved sections, use current brand palette, due Friday",
    minRows: 1,
  },
];

const optionalBriefFields: Array<{
  key: keyof ProjectBrief;
  label: string;
  placeholder: string;
  minRows: number;
}> = [
  { key: "deliverableType", label: "Deliverable", placeholder: "Landing page refresh", minRows: 1 },
  { key: "audience", label: "Audience", placeholder: "Founders and executive teams", minRows: 2 },
  { key: "tone", label: "Tone", placeholder: "Calm, premium, direct", minRows: 1 },
];

export function BrieflyWorkspace() {
  const [brief, setBrief] = useState<ProjectBrief>(emptyBrief);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const [isMoreContextOpen, setIsMoreContextOpen] = useState(false);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [activeFilter, setActiveFilter] = useState<WorkFilter>("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [clientReplyDraft, setClientReplyDraft] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportContent, setExportContent] = useState<ExportContent>("both");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("text");
  const [projects, setProjects] = useState<ProjectSession[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showProjects, setShowProjects] = useState(false);
  const [editingProject, setEditingProject] = useState<string | "new" | null>(null);
  const [projectDraft, setProjectDraft] = useState<ProjectBrief>(emptyBrief);
  const feedbackInputRef = useRef<HTMLTextAreaElement>(null);
  const replyInputRef = useRef<HTMLTextAreaElement>(null);
  const exportDialogRef = useRef<HTMLDivElement>(null);

  const canAnalyze = useMemo(
    () => Boolean(brief.projectName.trim() && brief.goal.trim() && feedback.trim()),
    [brief, feedback],
  );

  const feedbackLines = useMemo(
    () => feedback.split(/\n+/).filter((line) => line.trim()).length,
    [feedback],
  );

  const filledCount = filledBriefFields(brief);
  const optionalCount = optionalBriefFields.filter((field) => brief[field.key]?.trim()).length;
  const checklist = result?.checklist ?? [];
  const filteredChecklist = useMemo(
    () => filterChecklist(checklist, activeFilter),
    [activeFilter, checklist],
  );
  const resultForCopy = useMemo(() => (result ? { ...result, clientReply: clientReplyDraft } : null), [
    clientReplyDraft,
    result,
  ]);
  const questions = useMemo(() => buildClientQuestions(checklist), [checklist]);
  const displayQuestions = result
    ? questions.length
      ? questions
      : ["No client questions were flagged in this analysis."]
    : emptyQuestions;
  const doneCount = completedTaskIds.size;

  useEffect(() => {
    if (!isExportOpen) {
      return;
    }

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    exportDialogRef.current?.focus();

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportOpen(false);
      } else if (event.key === "Tab" && exportDialogRef.current) {
        const controls = Array.from(
          exportDialogRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)"),
        );
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === exportDialogRef.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      document.removeEventListener("keydown", handleDialogKeys);
      previousFocus?.focus();
    };
  }, [isExportOpen]);

  async function analyze() {
    if (!canAnalyze || isLoading) {
      return;
    }
    setIsLoading(true);
    setError("");
    setCopied(null);
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: compactBrief(brief), feedback }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      if (!isAnalyzeResponse(payload)) {
        throw new Error("Briefly received an invalid analysis response. Please try again.");
      }

      setClientReplyDraft(payload.analysis.clientReply);
      setResult(payload.analysis);
      setOpenTaskId(payload.analysis.checklist[0]?.id ?? null);
      setCompletedTaskIds(new Set());
      setIsEditingBrief(false);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Briefly could not analyze this feedback yet.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function copyText(kind: CopyKind, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  function startNewRound() {
    if (projectId && !showProjects) {
      setProjects((current) => current.map((project) => project.id === projectId ? { ...project, brief, feedback, result, reply: clientReplyDraft, completed: [...completedTaskIds] } : project));
    }
    setProjectId(null);
    setShowProjects(false);
    setBrief(emptyBrief);
    setFeedback("");
    setResult(null);
    setError("");
    setClientReplyDraft("");
    setActiveFilter("all");
    setIsMoreContextOpen(false);
    setIsEditingBrief(false);
  }

  function openProjects() {
    if (isLoading) return;
    if (projectId) {
      setProjects((current) => current.map((project) => project.id === projectId
        ? { ...project, brief, feedback, result, reply: clientReplyDraft, completed: [...completedTaskIds] }
        : project));
    } else if (brief.projectName.trim() || brief.goal.trim() || feedback.trim() || result) {
      const id = crypto.randomUUID();
      setProjectId(id);
      setProjects((current) => [...current, { id, brief, feedback, result, reply: clientReplyDraft, completed: [...completedTaskIds] }]);
    }
    setEditingProject(null);
    setShowProjects(true);
  }

  function selectProject(project: ProjectSession) {
    setProjectId(project.id);
    setBrief(project.brief);
    setFeedback(project.feedback);
    setResult(project.result);
    setClientReplyDraft(project.reply);
    setCompletedTaskIds(new Set(project.completed));
    setOpenTaskId(null);
    setActiveFilter("all");
    setError("");
    setIsEditingBrief(false);
    setIsMoreContextOpen(optionalBriefFields.some((field) => Boolean(project.brief[field.key]?.trim())));
    setShowProjects(false);
  }

  function saveProject() {
    if (!projectDraft.projectName.trim() || !projectDraft.goal.trim()) return;
    if (editingProject === "new") {
      const project = { id: crypto.randomUUID(), brief: projectDraft, feedback: "", result: null, reply: "", completed: [] };
      setProjects((current) => [...current, project]);
      selectProject(project);
    } else if (editingProject) {
      setProjects((current) => current.map((project) => project.id === editingProject ? { ...project, brief: projectDraft } : project));
      if (projectId === editingProject) setBrief(projectDraft);
      setEditingProject(null);
    }
  }

  function exportOutput() {
    if (!resultForCopy) {
      return;
    }

    const content = formatExport(resultForCopy, exportContent, exportFormat);
    const extension = exportFormat === "markdown" ? "md" : "txt";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = exportFilename(brief.projectName, extension);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setIsExportOpen(false);
  }

  function toggleTaskDone(id: string) {
    setCompletedTaskIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="briefly-shell">
      <a className="skip-link" href="#workspace">
        Skip to workspace
      </a>
      <Toast copied={copied} />

      <aside className="workspace-sidebar" aria-label="Workspace">
        <div className="sidebar-brand">
          <div className="briefly-mark" aria-hidden="true">B</div>
          <span>Briefly</span>
        </div>
        <button type="button" onClick={startNewRound} disabled={isLoading} className="primary-button sidebar-new pressable">
          <Plus size={16} aria-hidden="true" />
          New round
        </button>
        <div className="sidebar-section-label">Workspace</div>
        <button type="button" onClick={openProjects} disabled={isLoading} className="projects-nav pressable" aria-current={showProjects ? "page" : undefined}><FolderOpen size={15} aria-hidden="true" /> Projects</button>
        <div className="sidebar-project">
          <div className="sidebar-project-icon"><Clipboard size={15} aria-hidden="true" /></div>
          <span>{brief.projectName.trim() || "Untitled project"}</span>
          <small>{result ? "Current" : "Draft"}</small>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-avatar" aria-hidden="true">B</div>
          <div><strong>Your workspace</strong><span>Feedback, made clear.</span></div>
        </div>
      </aside>

      <div className="workspace-content">
        {showProjects ? (
          <main id="workspace" className="projects-screen">
            <div className="projects-header">
              <div><h1>Projects</h1><p>Keep your briefs and feedback together while you work.</p></div>
              <button type="button" className="primary-button pressable" onClick={() => { setProjectDraft(emptyBrief); setEditingProject("new"); }}><Plus size={16} aria-hidden="true" /> New project</button>
            </div>
            <p className="projects-storage-note">Projects stay in this browser session and are cleared when you reload or close the page.</p>
            {editingProject ? (
              <form className="project-editor" onSubmit={(event) => { event.preventDefault(); saveProject(); }}>
                <div><h2>{editingProject === "new" ? "New project" : "Edit project"}</h2><p>Give your project the context Briefly needs.</p></div>
                <div className="entry-form-grid">{briefFields.slice(0, 2).map((field) => <BriefField key={field.key} field={field} brief={projectDraft} onChange={(value) => setProjectDraft((current) => ({ ...current, [field.key]: value }))} />)}</div>
                <BriefField field={briefFields[2]} brief={projectDraft} onChange={(value) => setProjectDraft((current) => ({ ...current, constraints: value }))} />
                <div className="entry-form-grid">{optionalBriefFields.map((field) => <BriefField key={field.key} field={field} brief={projectDraft} onChange={(value) => setProjectDraft((current) => ({ ...current, [field.key]: value }))} />)}</div>
                <div className="project-editor-actions"><button type="button" className="secondary-button pressable" onClick={() => setEditingProject(null)}>Cancel</button><button type="submit" className="primary-button pressable" disabled={!projectDraft.projectName.trim() || !projectDraft.goal.trim()}>{editingProject === "new" ? "Create project" : "Save changes"}</button></div>
              </form>
            ) : null}
            {projects.length ? <div className="project-list" aria-label="Your projects">{projects.map((project) => <article className="project-item" key={project.id}>
              <div className="project-item-icon"><FolderOpen size={18} aria-hidden="true" /></div>
              <div className="project-item-content"><h2>{project.brief.projectName || "Untitled project"}</h2><p>{project.brief.goal || "No goal added yet"}</p><span>{project.result ? "Workplan ready" : "Draft"}{project.id === projectId ? " · Current project" : ""}</span></div>
              <div className="project-item-actions"><button type="button" className="secondary-button pressable" onClick={() => { setProjectDraft({ ...project.brief }); setEditingProject(project.id); }}>Edit<span className="sr-only"> {project.brief.projectName}</span></button><button type="button" className="primary-button pressable" onClick={() => selectProject(project)}>Open<span className="sr-only"> {project.brief.projectName}</span></button></div>
            </article>)}</div> : !editingProject ? <div className="projects-empty"><FolderOpen size={22} aria-hidden="true" /><h2>No projects yet</h2><p>Create a project to keep its brief and feedback together.</p><button type="button" className="secondary-button pressable" onClick={() => { setProjectDraft(emptyBrief); setEditingProject("new"); }}><Plus size={16} aria-hidden="true" /> Create a project</button></div> : null}
            <button type="button" className="text-button projects-back" onClick={() => setShowProjects(false)}>Back to workspace</button>
          </main>
        ) : <>
        {result && !isEditingBrief ? (
          <header className="workspace-topbar">
            <div className="breadcrumb"><span>{brief.projectName || "Untitled project"}</span><span aria-hidden="true">/</span><strong>Workplan</strong></div>
            <div className="topbar-actions">
              <button type="button" onClick={() => resultForCopy && copyText("all", formatResultForClipboard(resultForCopy))} className="secondary-button pressable">
                {copied === "all" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />} Copy all
              </button>
              <button type="button" onClick={() => setIsExportOpen(true)} className="secondary-button pressable">
                <Download size={15} aria-hidden="true" /> Export
              </button>
            </div>
          </header>
        ) : null}

        {!result || isEditingBrief ? (
          <main id="workspace" className="entry-screen">
            <div className="entry-heading">
              <div className="entry-eyebrow"><Sparkles size={15} aria-hidden="true" /> YOUR WORKSPACE</div>
              <h1>{isEditingBrief ? "Edit your project brief" : "What did the client say?"}</h1>
              <p>Paste the messy version. Briefly turns it into prioritized tasks, questions for the client, and scope notes.</p>
            </div>

            <div className="entry-card">
              <div className="entry-form-grid">
                {briefFields.slice(0, 2).map((field) => (
                  <BriefField key={field.key} field={field} brief={brief} onChange={(value) => setBrief((current) => ({ ...current, [field.key]: value }))} />
                ))}
              </div>
              <div className="entry-constraints">
                <BriefField field={briefFields[2]} brief={brief} onChange={(value) => setBrief((current) => ({ ...current, constraints: value }))} />
              </div>
              <div className="optional-context">
                <button type="button" className="optional-context-trigger pressable" aria-expanded={isMoreContextOpen} onClick={() => setIsMoreContextOpen((current) => !current)}>
                  <Plus size={14} aria-hidden="true" /><span>More context</span><strong>{optionalCount ? optionalCount + " filled" : "Optional"}</strong>
                  <ChevronDown className={clsx("optional-context-icon", isMoreContextOpen && "rotate-180")} size={15} aria-hidden="true" />
                </button>
                <div aria-hidden={!isMoreContextOpen} inert={!isMoreContextOpen} className={clsx("optional-context-body", isMoreContextOpen && "optional-context-body--open")}>
                  <div className="overflow-hidden"><div className="entry-form-grid optional-fields">
                    {optionalBriefFields.map((field) => (
                      <BriefField key={field.key} field={field} brief={brief} onChange={(value) => setBrief((current) => ({ ...current, [field.key]: value }))} />
                    ))}
                  </div></div>
                </div>
              </div>
              <div className="entry-feedback">
                <label className="sr-only" htmlFor="feedback-input">Client feedback</label>
                <AutoGrowTextarea id="feedback-input" value={feedback} onChange={setFeedback} placeholder="Paste client feedback here. Emails, chat threads, and call notes all work." minRows={7} className="entry-feedback-input" textareaRef={feedbackInputRef} />
                <div className="entry-feedback-footer">
                  <span>{feedback.length.toLocaleString()} characters</span>
                  <div className="entry-actions">
                    {isEditingBrief ? <button type="button" onClick={() => setIsEditingBrief(false)} className="secondary-button pressable">Back to workplan</button> : null}
                    <button type="button" onClick={analyze} disabled={!canAnalyze || isLoading} className="primary-button pressable">
                      {isLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
                      {isLoading ? "Analyzing..." : "Analyze feedback"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {error ? (
              <div className="error-callout" role="alert"><AlertTriangle size={17} aria-hidden="true" /><div><p>{error}</p><button type="button" onClick={analyze} disabled={!canAnalyze || isLoading} className="error-retry-button pressable">Retry</button></div></div>
            ) : null}
            {isLoading ? <LoadingOutput /> : null}
            <div className="entry-features" aria-label="What Briefly creates">
              <div className="feature-card"><span className="feature-tag feature-tag--tasks">TASKS</span><h2>Prioritized tasks</h2><p>Each one linked to the client’s feedback.</p></div>
              <div className="feature-card"><span className="feature-tag feature-tag--questions">ASK</span><h2>Questions for the client</h2><p>Open points, ready to discuss.</p></div>
              <div className="feature-card"><span className="feature-tag feature-tag--scope">SCOPE</span><h2>Scope notes</h2><p>Requests to check against your brief.</p></div>
            </div>
          </main>
        ) : (
          <div className="results-layout">
            <main id="workspace" className="results-main">
              <section className="summary-card">
                <div className="summary-heading"><span><Sparkles size={15} aria-hidden="true" /> The short version</span><span>WORKPLAN</span></div>
                <h1>{buildSummary(result, feedbackLines)}</h1>
                <div className="summary-stats">
                  <div><span>Start with</span><strong>{result.summary.highPriority} high priority</strong></div>
                  <div><span>Ask first</span><strong>{result.summary.needsClarification} need clarification</strong></div>
                  <div><span>Scope</span><strong>{result.summary.scopeFlags} flagged</strong></div>
                </div>
              </section>
              <div className="workplan-controls">
                <FilterTabs activeFilter={activeFilter} result={result} onChange={setActiveFilter} />
                <div className="inline-progress"><span>{doneCount} of {checklist.length} done</span><div className="progress-track" aria-hidden="true"><span style={{ width: progressPercent(doneCount, checklist.length) + "%" }} /></div></div>
              </div>
              {checklist.length ? (
                <div className="task-list">
                  <div className="task-list-heading"><span>YOUR TASKS</span><span>{filteredChecklist.length} shown</span></div>
                  {filteredChecklist.map((item, index) => (
                    <TaskCard key={item.id} item={item} index={index} expanded={openTaskId === item.id} completed={completedTaskIds.has(item.id)} onToggleDone={() => toggleTaskDone(item.id)} onOpen={() => setOpenTaskId((current) => current === item.id ? null : item.id)} />
                  ))}
                  {!filteredChecklist.length ? <p className="filter-empty">No tasks in this view.</p> : null}
                </div>
              ) : <EmptyOutput />}
              <ReplyDraft value={clientReplyDraft} onChange={setClientReplyDraft} onCopy={() => copyText("reply", clientReplyDraft)} copied={copied === "reply"} textareaRef={replyInputRef} />
              <div className="run-composer">
                <div className="composer-input-row">
                  <label className="sr-only" htmlFor="feedback-input">Feedback to analyze</label>
                  <AutoGrowTextarea id="feedback-input" value={feedback} onChange={setFeedback} placeholder="Paste more feedback for this round..." minRows={2} className="composer-textarea" textareaRef={feedbackInputRef} />
                  <button type="button" onClick={analyze} disabled={!canAnalyze || isLoading} className="primary-button analyze-button pressable"><ArrowUp size={16} aria-hidden="true" /> Analyze</button>
                </div>
              </div>
            </main>
            <aside className="right-rail" aria-label="Brief and outputs">
              <section className="rail-card brief-summary">
                <div className="rail-card-header"><h2>Brief</h2><button type="button" className="text-button" onClick={() => setIsEditingBrief(true)}>Edit</button></div>
                <dl><div><dt>Project</dt><dd>{brief.projectName}</dd></div><div><dt>Goal</dt><dd>{brief.goal}</dd></div><div><dt>Constraints</dt><dd>{brief.constraints?.trim() || "None set"}</dd></div></dl>
                <p className="brief-count">{filledCount} of 6 fields filled</p>
              </section>
              <section className="rail-card">
                <div className="rail-title"><HelpCircle size={16} aria-hidden="true" /><div><h2>Ask the client</h2><p>Questions from flagged tasks</p></div></div>
                <div className="question-list">{displayQuestions.map((question, index) => <p key={index + "-" + question}>{question}</p>)}</div>
                <button type="button" onClick={() => copyText("questions", displayQuestions.join("\n"))} className="full-button pressable"><Copy size={15} aria-hidden="true" /> Copy questions</button>
              </section>
              <section className="rail-card">
                <div className="rail-title"><Clipboard size={16} aria-hidden="true" /><div><h2>Outputs</h2><p>Ready to take with you</p></div></div>
                <div className="output-grid">
                  <button type="button" onClick={() => resultForCopy && copyText("reply", resultForCopy.clientReply)} className="output-button pressable"><MessageSquareText size={15} aria-hidden="true" /> Client reply <span>Copy</span></button>
                  <button type="button" onClick={() => resultForCopy && copyText("checklist", formatChecklistForClipboard(resultForCopy.checklist))} className="output-button pressable"><Check size={15} aria-hidden="true" /> Checklist <span>Copy</span></button>
                  <button type="button" onClick={() => resultForCopy && copyText("scope", formatScopeNote(resultForCopy.checklist))} className="output-button pressable"><FileText size={15} aria-hidden="true" /> Scope note <span>Copy</span></button>
                  <button type="button" onClick={() => setIsExportOpen(true)} className="output-button pressable"><Download size={15} aria-hidden="true" /> Export <span>Choose format</span></button>
                </div>
              </section>
            </aside>
          </div>
        )}
        </>}
      </div>
      {isExportOpen && resultForCopy ? (
        <div className="export-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setIsExportOpen(false);
        }}>
          <div
            ref={exportDialogRef}
            className="export-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-dialog-title"
            tabIndex={-1}
          >
            <div className="export-dialog-header">
              <div>
                <p className="eyebrow">Export</p>
                <h2 id="export-dialog-title">Choose what to export</h2>
              </div>
              <p>Download the current task list, client reply, or both.</p>
            </div>

            <fieldset className="export-option-group">
              <legend>Content</legend>
              <div className="export-options">
                <label className="export-option">
                  <input
                    type="radio"
                    name="export-content"
                    value="checklist"
                    checked={exportContent === "checklist"}
                    onChange={() => setExportContent("checklist")}
                  />
                  <span>Task list</span>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="export-content"
                    value="reply"
                    checked={exportContent === "reply"}
                    onChange={() => setExportContent("reply")}
                  />
                  <span>Client reply</span>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="export-content"
                    value="both"
                    checked={exportContent === "both"}
                    onChange={() => setExportContent("both")}
                  />
                  <span>Both</span>
                </label>
              </div>
            </fieldset>

            <fieldset className="export-option-group">
              <legend>Format</legend>
              <div className="export-options">
                <label className="export-option">
                  <input
                    type="radio"
                    name="export-format"
                    value="text"
                    checked={exportFormat === "text"}
                    onChange={() => setExportFormat("text")}
                  />
                  <span>Plain text (.txt)</span>
                </label>
                <label className="export-option">
                  <input
                    type="radio"
                    name="export-format"
                    value="markdown"
                    checked={exportFormat === "markdown"}
                    onChange={() => setExportFormat("markdown")}
                  />
                  <span>Markdown (.md)</span>
                </label>
              </div>
            </fieldset>

            <div className="export-dialog-actions">
              <button
                type="button"
                onClick={() => setIsExportOpen(false)}
                className="secondary-button pressable"
              >
                Cancel
              </button>
              <button type="button" onClick={exportOutput} className="primary-button pressable">
                <Download size={15} aria-hidden="true" />
                Download
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BriefField({
  field,
  brief,
  onChange,
}: {
  field: {
    key: keyof ProjectBrief;
    label: string;
    placeholder: string;
    minRows: number;
    required?: boolean;
  };
  brief: ProjectBrief;
  onChange: (value: string) => void;
}) {
  const fieldId = `brief-${field.key}`;

  return (
    <label className="brief-field" htmlFor={fieldId}>
      <span>
        {field.label}
        {field.required ? <em>Required</em> : null}
      </span>
      <AutoGrowTextarea
        id={fieldId}
        value={brief[field.key] ?? ""}
        onChange={onChange}
        placeholder={field.placeholder}
        minRows={field.minRows}
        required={field.required}
        ariaRequired={field.required}
        className="brief-card-input"
      />
    </label>
  );
}

function AutoGrowTextarea({
  id,
  value,
  onChange,
  placeholder,
  minRows,
  required,
  ariaRequired,
  className,
  textareaRef,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minRows: number;
  required?: boolean;
  ariaRequired?: boolean;
  className?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
}) {
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTextareaRef = textareaRef ?? internalTextareaRef;

  useLayoutEffect(() => {
    const textarea = activeTextareaRef.current;

    if (!textarea) {
      return;
    }

    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    };

    resize();

    const container = textarea.parentElement;
    let resizeObserver: ResizeObserver | null = null;

    if (container) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    }
    window.addEventListener("resize", resize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, [activeTextareaRef, value]);

  return (
    <textarea
      ref={activeTextareaRef}
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={minRows}
      required={required}
      aria-required={ariaRequired}
      className={clsx("briefly-input auto-grow-textarea", className)}
    />
  );
}

function FilterTabs({
  activeFilter,
  result,
  onChange,
}: {
  activeFilter: WorkFilter;
  result: AnalysisResult | null;
  onChange: (filter: WorkFilter) => void;
}) {
  const items: Array<{ label: string; value: WorkFilter; count: number }> = [
    { label: "All", value: "all", count: result?.checklist.length ?? 0 },
    { label: "High", value: "high", count: result?.summary.highPriority ?? 0 },
    { label: "Clarify", value: "clarify", count: result?.summary.needsClarification ?? 0 },
    { label: "Scope", value: "scope", count: result?.summary.scopeFlags ?? 0 },
    {
      label: "In scope",
      value: "inScope",
      count:
        result?.checklist.filter(
          (item) => !item.category.includes("scope") && item.briefAlignment !== "outside scope",
        ).length ?? 0,
    },
  ];

  return (
    <div className="filter-tabs" aria-label="Filter workplan">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={clsx("filter-tab pressable", activeFilter === item.value && "filter-tab--active")}
          aria-pressed={activeFilter === item.value}
        >
          {item.label} <span>{item.count}</span>
        </button>
      ))}
    </div>
  );
}

function TaskCard({
  item,
  index,
  expanded,
  completed,
  onToggleDone,
  onOpen,
}: {
  item: ChecklistItem;
  index: number;
  expanded: boolean;
  completed: boolean;
  onToggleDone: () => void;
  onOpen: () => void;
}) {
  const detailsId = `task-details-${item.id}`;

  return (
    <article
      className={clsx("task-card", expanded && "task-card--expanded", completed && "task-card--done")}
      style={{ "--enter-delay": `${index * 42}ms` } as React.CSSProperties}
    >
      <div className="task-card-grid">
        <label className="task-check">
          <input
            type="checkbox"
            checked={completed}
            onChange={onToggleDone}
            aria-label={`Mark ${item.taskTitle} complete`}
          />
          <span aria-hidden="true" />
        </label>
        <span className="task-index">{String(index + 1).padStart(2, "0")}</span>
        <div className="task-main">
          <div className="task-title-row">
            <h3>{item.taskTitle}</h3>
            <div className="task-pills">
              <span className={priorityClass(item.priority)}>{item.priority}</span>
              <span className="quiet-chip">{item.briefAlignment}</span>
              {item.category.includes("duplicate") ? <span className="quiet-chip">Merged comments</span> : null}
            </div>
          </div>
          <p className="feedback-quote">{item.relatedFeedback}</p>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="open-button pressable"
          aria-expanded={expanded}
          aria-controls={detailsId}
          aria-label={`${expanded ? "Collapse" : "Expand"} details for ${item.taskTitle}`}
        >
          <ChevronDown className="task-disclosure-icon" size={18} aria-hidden="true" />
        </button>
      </div>

      <div
        id={detailsId}
        className={clsx("task-details", expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
        aria-hidden={!expanded}
      >
        <dl className="task-detail-inner">
          <OutputDetail label="Action" value={item.suggestedAction} />
          <OutputDetail label="Reason" value={item.rationale} />
          <OutputDetail label="Next" value={item.nextAction} />
          <OutputDetail label="Type" value={item.category} />
        </dl>
      </div>
    </article>
  );
}

function ReplyDraft({
  value,
  onChange,
  onCopy,
  copied,
  textareaRef,
}: {
  value: string;
  onChange: (value: string) => void;
  onCopy: () => void;
  copied: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}) {
  return (
    <section className="reply-draft">
      <div className="reply-draft-header">
        <div>
          <h2>Client reply</h2>
          <p>Edit the message before copying it back to the client.</p>
        </div>
        <button type="button" onClick={onCopy} className="secondary-button pressable">
          {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
          Copy reply
        </button>
      </div>
      <label className="sr-only" htmlFor="client-reply-draft">
        Client reply
      </label>
      <AutoGrowTextarea
        id="client-reply-draft"
        value={value}
        onChange={onChange}
        placeholder="Your client-ready reply will appear here."
        minRows={8}
        className="reply-textarea"
        textareaRef={textareaRef}
      />
    </section>
  );
}

function EmptyOutput() {
  return (
    <div className="empty-workplan">
      <div className="empty-icon">
        <Wand2 size={20} aria-hidden="true" />
      </div>
      <h2>Ready when the notes are.</h2>
      <p>Paste a new round. Tasks, risks, questions, and copy-ready outputs will appear here.</p>
    </div>
  );
}

function LoadingOutput() {
  return (
    <div className="loading-workplan" aria-live="polite">
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="skeleton-task">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

function OutputDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Toast({ copied }: { copied: CopyKind | null }) {
  const labels: Record<CopyKind, string> = {
    all: "Copied output",
    checklist: "Copied checklist",
    reply: "Copied reply",
    questions: "Copied questions",
    scope: "Copied scope note",
  };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={!copied}
      className={clsx("copy-toast", copied && "copy-toast--visible")}
    >
      <Check size={15} aria-hidden="true" />
      {copied ? labels[copied] : ""}
    </div>
  );
}

function filterChecklist(checklist: ChecklistItem[], filter: WorkFilter) {
  if (filter === "high") {
    return checklist.filter((item) => item.priority === "high");
  }

  if (filter === "clarify") {
    return checklist.filter(
      (item) => item.priority === "needs clarification" || item.category.includes("clarification"),
    );
  }

  if (filter === "scope") {
    return checklist.filter(
      (item) => item.category.includes("scope") || item.briefAlignment === "outside scope",
    );
  }

  if (filter === "inScope") {
    return checklist.filter(
      (item) => !item.category.includes("scope") && item.briefAlignment !== "outside scope",
    );
  }

  return checklist;
}

function buildSummary(result: AnalysisResult | null, feedbackLines: number) {
  if (!result) {
    return `${feedbackLines || 0} comments are queued. Analyze them into prioritized design work, client questions, and scope notes.`;
  }

  return `${result.summary.totalComments} comments became ${result.checklist.length} tasks. ${result.summary.highPriority} high priority, ${result.summary.needsClarification} need clarification, and ${result.summary.scopeFlags} may affect scope.`;
}

function buildClientQuestions(checklist: ChecklistItem[]) {
  return checklist
    .filter(
      (item) =>
        item.priority === "needs clarification" ||
        item.category.includes("clarification") ||
        item.category.includes("conflict") ||
        item.category.includes("scope"),
    )
    .slice(0, 4)
    .map((item) => questionFromItem(item));
}

function questionFromItem(item: ChecklistItem) {
  return item.nextAction;
}

const emptyQuestions = ["Run analysis to surface client questions from flagged tasks."];

function formatScopeNote(checklist: ChecklistItem[]) {
  const scopedItems = checklist.filter(
    (item) => item.category.includes("scope") || item.briefAlignment === "outside scope",
  );

  if (!scopedItems.length) {
    return "No scope risks were flagged in this analysis.";
  }

  return scopedItems
    .map((item) => `${item.taskTitle}\n${item.rationale}\nNext: ${item.nextAction}`)
    .join("\n\n");
}

function formatExport(
  result: AnalysisResult,
  content: ExportContent,
  format: ExportFormat,
) {
  if (format === "markdown") {
    return formatMarkdownExport(result, content);
  }

  const sections: string[] = [];

  if (content === "checklist" || content === "both") {
    sections.push("TASK LIST\n\n" + formatChecklistForClipboard(result.checklist));
  }

  if (content === "reply" || content === "both") {
    sections.push("CLIENT REPLY\n\n" + result.clientReply);
  }

  return sections.join("\n\n");
}

function formatMarkdownExport(result: AnalysisResult, content: ExportContent) {
  const sections: string[] = ["# Briefly export"];

  if (content === "checklist" || content === "both") {
    const taskList = result.checklist
      .map(
        (item, index) =>
          "### " +
          (index + 1) +
          ". " +
          item.taskTitle +
          "\n- **Priority:** " +
          item.priority +
          "\n- **Action:** " +
          item.suggestedAction +
          "\n- **Rationale:** " +
          item.rationale +
          "\n- **Related feedback:** " +
          item.relatedFeedback +
          "\n- **Brief alignment:** " +
          item.briefAlignment +
          "\n- **Next action:** " +
          item.nextAction,
      )
      .join("\n\n");

    sections.push("## Task list\n\n" + taskList);
  }

  if (content === "reply" || content === "both") {
    sections.push("## Client reply\n\n" + result.clientReply);
  }

  return sections.join("\n\n");
}

function exportFilename(projectName: string, extension: "txt" | "md") {
  const name = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return (name || "briefly-workplan") + "-export." + extension;
}

function progressPercent(done: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.min(100, Math.round((done / total) * 100));
}

function priorityClass(priority: string) {
  return clsx(
    "priority-chip",
    priority === "high" && "priority-chip--high",
    priority === "medium" && "priority-chip--medium",
    priority === "low" && "priority-chip--low",
    priority === "needs clarification" && "priority-chip--clarify",
  );
}

function filledBriefFields(brief: ProjectBrief) {
  return Object.values(brief).filter((value) => value?.trim()).length;
}

function compactBrief(brief: ProjectBrief) {
  return Object.fromEntries(
    Object.entries(brief)
      .map(([key, value]) => [key, (value ?? "").trim()])
      .filter(([, value]) => value),
  );
}

function isAnalyzeResponse(
  value: unknown,
): value is { analysis: AnalysisResult; source: { provider: "cohere"; model: string } } {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as {
    analysis?: unknown;
    source?: { provider?: unknown; model?: unknown };
  };

  return (
    Boolean(payload.analysis) &&
    payload.source?.provider === "cohere" &&
    typeof payload.source.model === "string" &&
    Boolean(payload.source.model.trim())
  );
}
