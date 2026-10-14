export type Priority = "high" | "medium" | "low" | "needs clarification";

export type FeedbackCategory =
  | "actionable design task"
  | "needs clarification"
  | "duplicate or overlapping feedback"
  | "potential conflict"
  | "potential scope creep"
  | "low-priority or subjective preference";

export type BriefAlignment = "strong" | "partial" | "unclear" | "outside scope";

export type ProjectBrief = {
  projectName: string;
  goal: string;
  audience?: string;
  deliverableType?: string;
  tone?: string;
  constraints?: string;
};

export type ChecklistItem = {
  id: string;
  priority: Priority;
  category: FeedbackCategory;
  taskTitle: string;
  suggestedAction: string;
  rationale: string;
  relatedFeedback: string;
  briefAlignment: BriefAlignment;
  nextAction: string;
};

export type AnalysisRequest = {
  brief: ProjectBrief;
  feedback: string;
};

export type AnalysisResult = {
  summary: {
    totalComments: number;
    highPriority: number;
    needsClarification: number;
    scopeFlags: number;
  };
  checklist: ChecklistItem[];
  clientReply: string;
};
