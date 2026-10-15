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
    minRows: 2,
    required: true,
  },
  {
    key: "constraints",
    label: "Constraints",
    placeholder: "Keep approved sections, use current brand palette, due Friday",
    minRows: 3,
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
  const [activeFilter, setActiveFilter] = useState<WorkFilter>("all");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [clientReplyDraft, setClientReplyDraft] = useState("");
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportContent, setExportContent] = useState<ExportContent>("both");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("text");
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
    if (!result?.checklist.length) {
      setOpenTaskId(null);
      setCompletedTaskIds(new Set());
      return;
    }

    setOpenTaskId(result.checklist[0].id);
    setCompletedTaskIds(new Set());
    setClientReplyDraft(result.clientReply);
  }, [result]);

  useEffect(() => {
    if (!isExportOpen) {
      return;
    }

    exportDialogRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExportOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isExportOpen]);

  async function analyze() {
    if (!canAnalyze || isLoading) {
      return;
    }

    triggerHaptic(12);
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
      triggerHaptic([12, 40, 12]);
    } catch (analysisError) {
      triggerHaptic([15, 45, 15]);
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
    triggerHaptic(10);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  function startNewRound() {
    triggerHaptic(8);
    setBrief(emptyBrief);
    setFeedback("");
    setResult(null);
    setError("");
    setClientReplyDraft("");
    setActiveFilter("all");
    setIsMoreContextOpen(false);
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

    triggerHaptic([10, 30, 10]);
    setIsExportOpen(false);
  }

  function toggleTaskDone(id: string) {
    triggerHaptic(6);
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

      <header className="briefly-topbar">
        <div className="brand-cluster">
          <div className="briefly-mark" aria-hidden="true">
            B
          </div>
          <div className="brand-copy">
            <p>Briefly</p>
            <span>{brief.projectName.trim() || "Untitled project"} / {filledCount} of 6 filled</span>
          </div>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            onClick={() => resultForCopy && copyText("all", formatResultForClipboard(resultForCopy))}
            disabled={!resultForCopy}
            className="secondary-button pressable"
          >
            {copied === "all" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            Copy all
          </button>
          <button type="button" onClick={startNewRound} className="primary-button pressable">
            <Plus size={15} aria-hidden="true" />
            New round
          </button>
        </div>
      </header>

      <div className="app-board">
        <aside
          className="side-panel panel-enter"
          style={{ "--enter-delay": "0ms" } as React.CSSProperties}
        >
          <section className="panel-section">
            <div className="section-heading">
              <div>
                <h2>Brief</h2>
                <p>Brief-aware context</p>
              </div>
            </div>

            <div className="brief-stack">
              {briefFields.map((field) => (
                <BriefField
                  key={field.key}
                  field={field}
                  brief={brief}
                  onChange={(value) =>
                    setBrief((current) => ({ ...current, [field.key]: value }))
                  }
                />
              ))}
            </div>

            <div className="optional-context">
              <button
                type="button"
                className="optional-context-trigger pressable"
                aria-expanded={isMoreContextOpen}
                onClick={() => {
                  triggerHaptic(8);
                  setIsMoreContextOpen((current) => !current);
                }}
              >
                <span>More context (optional)</span>
                <strong>{optionalCount} fields</strong>
                <ChevronDown
                  className={clsx("optional-context-icon", isMoreContextOpen && "rotate-180")}
                  size={16}
                  aria-hidden="true"
                />
              </button>

              <div
                aria-hidden={!isMoreContextOpen}
                inert={!isMoreContextOpen}
                className={clsx(
                  "optional-context-body",
                  isMoreContextOpen && "optional-context-body--open",
                )}
              >
                <div className="overflow-hidden">
                  <div className="brief-stack pt-3">
                    {optionalBriefFields.map((field) => (
                      <BriefField
                        key={field.key}
                        field={field}
                        brief={brief}
                        onChange={(value) =>
                          setBrief((current) => ({ ...current, [field.key]: value }))
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-section panel-section--divided">
            <div className="section-heading">
              <div>
                <h2>Feedback</h2>
                <p>{feedbackLines} comments - today</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => feedbackInputRef.current?.focus()}
              className="full-button pressable"
            >
              <Plus size={15} aria-hidden="true" />
              Add feedback
            </button>
            <p className="feedback-hint">Everything pasted below stays in this round until you start a new one.</p>
          </section>
        </aside>

        <main
          id="workspace"
          className="work-panel panel-enter"
          style={{ "--enter-delay": "55ms" } as React.CSSProperties}
        >
          <div className="work-header">
            <div>
              <div className="eyebrow">
                <Sparkles size={14} aria-hidden="true" />
                Workplan
              </div>
              <h1>Workplan</h1>
              <p>{buildSummary(result, feedbackLines)}</p>
            </div>
          </div>

          <FilterTabs
            activeFilter={activeFilter}
            result={result}
            onChange={(filter) => {
              triggerHaptic(5);
              setActiveFilter(filter);
            }}
          />

          {error ? (
            <div className="error-callout" role="alert">
              <AlertTriangle size={17} aria-hidden="true" />
              <div>
                <p>{error}</p>
                <button
                  type="button"
                  onClick={analyze}
                  disabled={!canAnalyze || isLoading}
                  className="error-retry-button pressable"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {isLoading ? (
            <LoadingOutput />
          ) : checklist.length ? (
            <>
              <div className="task-list">
                {filteredChecklist.map((item, index) => (
                  <TaskCard
                    key={item.id}
                    item={item}
                    index={index}
                    expanded={openTaskId === item.id}
                    completed={completedTaskIds.has(item.id)}
                    onToggleDone={() => toggleTaskDone(item.id)}
                    onOpen={() => {
                      triggerHaptic(6);
                      setOpenTaskId((current) => (current === item.id ? null : item.id));
                    }}
                  />
                ))}
              </div>
              <ReplyDraft
                value={clientReplyDraft}
                onChange={setClientReplyDraft}
                onCopy={() => copyText("reply", clientReplyDraft)}
                copied={copied === "reply"}
                textareaRef={replyInputRef}
              />
            </>
          ) : (
            <EmptyOutput />
          )}

          <div className="run-composer">
            <div className="composer-input-row">
              <label className="sr-only" htmlFor="feedback-input">
                Feedback to analyze
              </label>
              <AutoGrowTextarea
                id="feedback-input"
                value={feedback}
                onChange={setFeedback}
                placeholder="Paste the next round of client feedback..."
                minRows={2}
                className="composer-textarea"
                textareaRef={feedbackInputRef}
              />
              <button
                type="button"
                onClick={analyze}
                disabled={!canAnalyze || isLoading}
                className="primary-button analyze-button pressable"
              >
                {isLoading ? <Loader2 className="animate-spin" size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
                Analyze
              </button>
            </div>
          </div>
        </main>

        <aside
          className="right-rail panel-enter"
          style={{ "--enter-delay": "110ms" } as React.CSSProperties}
        >
          <section className="rail-card">
            <div className="rail-card-header">
              <h2>Progress</h2>
              <span>{doneCount} of {checklist.length} done</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span style={{ width: `${progressPercent(doneCount, checklist.length)}%` }} />
            </div>
          </section>

          <section className="rail-card">
            <div className="rail-title">
              <HelpCircle size={16} aria-hidden="true" />
              <div>
                <h2>Ask the client</h2>
                <p>Questions from the flagged tasks</p>
              </div>
            </div>
            <div className="question-list">
              {displayQuestions.map((question, index) => (
                <p key={`${index}-${question}`}>{question}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={() => copyText("questions", displayQuestions.join("\n"))}
              disabled={!result}
              className="full-button pressable"
            >
              <Copy size={15} aria-hidden="true" />
              Copy questions
            </button>
          </section>

          <section className="rail-card">
            <div className="rail-title">
              <Clipboard size={16} aria-hidden="true" />
              <div>
                <h2>Outputs</h2>
                <p>Copy ready-to-send pieces</p>
              </div>
            </div>
            <div className="output-grid">
              <button
                type="button"
                onClick={() => resultForCopy && copyText("reply", resultForCopy.clientReply)}
                disabled={!resultForCopy}
                className="output-button pressable"
              >
                <MessageSquareText size={15} aria-hidden="true" />
                Client reply
              </button>
              <button
                type="button"
                onClick={() => resultForCopy && copyText("checklist", formatChecklistForClipboard(resultForCopy.checklist))}
                disabled={!resultForCopy}
                className="output-button pressable"
              >
                <Check size={15} aria-hidden="true" />
                Checklist
              </button>
              <button
                type="button"
                onClick={() => resultForCopy && copyText("scope", formatScopeNote(resultForCopy.checklist))}
                disabled={!resultForCopy}
                className="output-button pressable"
              >
                <FileText size={15} aria-hidden="true" />
                Scope note
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(8);
                  setIsExportOpen(true);
                }}
                disabled={!resultForCopy}
                className="output-button pressable"
              >
                <Copy size={15} aria-hidden="true" />
                Export
              </button>
            </div>
          </section>
        </aside>
      </div>

      {isExportOpen && resultForCopy ? (
        <div className="export-backdrop" role="presentation">
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
        >
          {expanded ? "Close" : "Open"}
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

function triggerHaptic(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}
