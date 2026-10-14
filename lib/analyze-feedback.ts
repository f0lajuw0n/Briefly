import type {
  AnalysisRequest,
  AnalysisResult,
  BriefAlignment,
  ChecklistItem,
  FeedbackCategory,
  Priority,
} from "@/lib/types";

type InsightTag =
  | "scope"
  | "conflict"
  | "density"
  | "cta"
  | "testimonials"
  | "motion"
  | "copy"
  | "type"
  | "imagery"
  | "color"
  | "navigation"
  | "form"
  | "layout"
  | "vague";

type Insight = {
  index: number;
  feedback: string;
  tags: Set<InsightTag>;
  surface: string | null;
  scopeTopic: string | null;
};

type InsightGroup = {
  insights: Insight[];
  primaryTag: InsightTag | null;
  surface: string | null;
};

const scopeTopics = [
  { signal: "blog", label: "a blog" },
  { signal: "new page", label: "new pages" },
  { signal: "service page", label: "service pages" },
  { signal: "portal", label: "a portal" },
  { signal: "dashboard", label: "a dashboard" },
  { signal: "app", label: "an app" },
  { signal: "campaign", label: "a campaign" },
  { signal: "email sequence", label: "an email sequence" },
  { signal: "social", label: "social assets" },
  { signal: "testimonial system", label: "a testimonial system" },
];

const surfaceMatchers: Array<{ surface: string; signals: string[] }> = [
  { surface: "hero", signals: ["hero", "above the fold", "top section", "first screen", "header"] },
  { surface: "testimonials", signals: ["testimonial", "social proof", "reviews"] },
  { surface: "primary CTA", signals: ["cta", "call to action", "button", "book", "sign up", "signup"] },
  { surface: "navigation", signals: ["navigation", "nav", "menu"] },
  { surface: "headline and copy", signals: ["headline", "copy", "messaging", "wording", "text"] },
  { surface: "imagery", signals: ["image", "photo", "illustration", "visual"] },
  { surface: "type hierarchy", signals: ["type", "typography", "font", "readability"] },
  { surface: "color system", signals: ["color", "colour", "contrast", "palette"] },
  { surface: "form", signals: ["form", "field", "input"] },
  { surface: "layout", signals: ["layout", "spacing", "alignment", "grid"] },
];

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function includesAny(value: string, signals: string[]) {
  const normalized = normalize(value);
  return signals.some((signal) => normalized.includes(signal));
}

function splitFeedback(feedback: string) {
  const lines = feedback
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);

  const sourceLines = lines.length ? lines : [feedback.trim()];

  return sourceLines.flatMap((line) =>
    line
      .split(/(?<=[.!?])\s+(?=[A-Z“"'])/)
      .map((comment) => comment.trim())
      .filter(Boolean),
  );
}

function quote(value: string) {
  return `“${value.length > 190 ? `${value.slice(0, 187).trim()}…` : value}”`;
}

function sentenceFragment(value: string, limit = 86) {
  const clean = value.replace(/[.!?]+$/, "").trim();
  return clean.length > limit ? `${clean.slice(0, limit - 1).trim()}…` : clean;
}

function movementTitle(value: string) {
  const match = value.match(/^(?:please )?(?:move|place|put)\s+(.+?)\s+(above|below|before|after)\s+(.+?)[.!?]?$/i);

  if (!match) {
    return null;
  }

  return `Move ${match[1].trim()} ${match[2].toLowerCase()} ${match[3].trim()}`;
}

function requestedNavigationLabel(value: string) {
  const match = value.match(/\b(?:call it|rename(?: it)? to)\s+[‘“"']?([^’”"'.!?]+)[’”"']?/i);
  return match?.[1].trim() ?? null;
}

function detectSurface(value: string) {
  return surfaceMatchers.find(({ signals }) => includesAny(value, signals))?.surface ?? null;
}

function detectScopeTopic(value: string) {
  const normalized = normalize(value);
  const knownTopics = scopeTopics.filter(({ signal }) => normalized.includes(signal));

  if (knownTopics.length) {
    const labels = [...new Set(knownTopics.map(({ label }) => label))].filter(
      (label) => label !== "new pages" || !normalized.includes("service page"),
    );
    return labels.join(" and ");
  }

  const addMatch = normalized.match(/\b(?:add|build|create|launch)\s+(?:a |an |the )?([^.,;!?]+)/);
  return addMatch ? addMatch[1].trim() : null;
}

function isScopeRequest(value: string) {
  const normalized = normalize(value);
  return (
    Boolean(detectScopeTopic(value)) &&
    (/(?:\badd\b|\bbuild\b|\bcreate\b|\bnew\b|while we are at it|extra)/.test(normalized) ||
      scopeTopics.some(({ signal }) => normalized.includes(signal)))
  );
}

function isConflict(value: string) {
  const normalized = normalize(value);
  const hasMultipleVoices =
    /\b(?:one|some)\s+(?:stakeholder|person|client)/.test(normalized) ||
    /\b(?:another|others?)\s+(?:stakeholder|person|client)?/.test(normalized);
  const hasOpposingDirection =
    (/(?:minimal|simple|less|reduce|quiet)/.test(normalized) &&
      /(?:more graphics|more animation|more motion|more decorative|more visual)/.test(normalized)) ||
    /(?:opposite|conflict(?:ing)? directions?)/.test(normalized);

  return hasMultipleVoices && hasOpposingDirection;
}

function isVague(value: string) {
  const normalized = normalize(value);
  return (
    /\b(?:make|feel|looks?|seems?)\b[^.!?]*(?:pop|flat|better|fresher|cooler|more premium|more modern|more exciting)/.test(
      normalized,
    ) || /\b(?:pop|flat|wow)\b/.test(normalized)
  );
}

function inspectFeedback(feedback: string, index: number): Insight {
  const tags = new Set<InsightTag>();
  const normalized = normalize(feedback);
  const surface = detectSurface(feedback);
  const scopeTopic = detectScopeTopic(feedback);

  if (isScopeRequest(feedback)) tags.add("scope");
  if (isConflict(feedback)) tags.add("conflict");
  if (includesAny(feedback, ["busy", "too much", "clutter", "cluttered", "simplify", "overwhelming", "crowded"])) tags.add("density");
  if (includesAny(feedback, ["cta", "call to action", "where to click", "button", "book", "sign up", "signup"])) tags.add("cta");
  if (includesAny(feedback, ["testimonial", "social proof", "reviews"])) tags.add("testimonials");
  if (includesAny(feedback, ["animation", "motion", "animate"])) tags.add("motion");
  if (includesAny(feedback, ["headline", "copy", "messaging", "wording", "text"])) tags.add("copy");
  if (includesAny(feedback, ["type", "typography", "font", "readability"])) tags.add("type");
  if (includesAny(feedback, ["image", "photo", "illustration", "visual"])) tags.add("imagery");
  if (includesAny(feedback, ["color", "colour", "contrast", "palette"])) tags.add("color");
  if (includesAny(feedback, ["navigation", "nav", "menu"])) tags.add("navigation");
  if (includesAny(feedback, ["form", "field", "input"])) tags.add("form");
  if (includesAny(feedback, ["layout", "spacing", "alignment", "grid"])) tags.add("layout");
  if (isVague(feedback)) tags.add("vague");

  if (!tags.size && /\b(?:change|move|remove|replace|add|update|keep|use)\b/.test(normalized)) {
    tags.add("layout");
  }

  return { index, feedback, tags, surface, scopeTopic };
}

function primaryTag(insights: Insight[]) {
  const tags = new Set(insights.flatMap((insight) => [...insight.tags]));
  const priority: InsightTag[] = [
    "scope",
    "conflict",
    "density",
    "cta",
    "testimonials",
    "motion",
    "copy",
    "type",
    "imagery",
    "color",
    "navigation",
    "form",
    "layout",
    "vague",
  ];

  return priority.find((tag) => tags.has(tag)) ?? null;
}

function groupInsights(insights: Insight[]) {
  const groups: InsightGroup[] = [];
  const grouped = new Set<number>();

  for (const insight of insights) {
    if (grouped.has(insight.index)) continue;

    const canGroup = insight.tags.has("density") || insight.tags.has("cta");
    const matches = canGroup
      ? insights.filter(
          (candidate) =>
            !grouped.has(candidate.index) &&
            candidate.index >= insight.index &&
            (candidate.tags.has("density") || candidate.tags.has("cta")) &&
            candidate.surface === insight.surface,
        )
      : [insight];

    matches.forEach((match) => grouped.add(match.index));
    groups.push({
      insights: matches,
      primaryTag: primaryTag(matches),
      surface: matches.find((match) => match.surface)?.surface ?? null,
    });
  }

  return groups;
}

function isConversionGoal(goal: string) {
  return /\b(?:book|booking|convert|conversion|lead|sign up|signup|enquir)/.test(normalize(goal));
}

function alignmentFor(tag: InsightTag | null, brief: AnalysisRequest["brief"]): BriefAlignment {
  if (tag === "scope") return "outside scope";
  if (tag === "conflict" || tag === "vague") return "unclear";
  if ((tag === "density" || tag === "cta") && isConversionGoal(brief.goal)) return "strong";
  return brief.deliverableType || brief.constraints ? "partial" : "unclear";
}

function itemCategory(group: InsightGroup): FeedbackCategory {
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));
  if (tags.has("scope")) return "potential scope creep";
  if (tags.has("conflict")) return "potential conflict";
  if (group.insights.length > 1) return "duplicate or overlapping feedback";
  if (tags.has("vague")) return "needs clarification";
  if (tags.size) return "actionable design task";
  return "low-priority or subjective preference";
}

function itemPriority(group: InsightGroup, brief: AnalysisRequest["brief"]): Priority {
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));
  if (tags.has("scope") || tags.has("conflict")) return "needs clarification";
  if ((tags.has("density") || tags.has("cta")) && isConversionGoal(brief.goal)) return "high";
  if (tags.has("vague")) return "medium";
  return tags.size ? "medium" : "low";
}

function titleFor(group: InsightGroup) {
  const source = group.insights[0];
  const surface = group.surface ?? "requested area";
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));

  if (tags.has("scope")) return `Confirm whether adding ${source.scopeTopic ?? "this request"} is in scope`;
  if (tags.has("conflict")) return "Resolve the competing design directions";
  if (tags.has("density")) return `Simplify the ${surface} hierarchy`;
  if (tags.has("cta")) return `Make the ${surface} easier to find and act on`;
  if (tags.has("testimonials") && tags.has("vague")) return "Clarify how the testimonials should feel more convincing";
  if (tags.has("testimonials")) return "Strengthen the testimonial treatment";
  if (tags.has("motion")) return `Review the requested motion direction in the ${surface}`;
  if (tags.has("copy")) return "Revise the requested headline or copy";
  if (tags.has("type")) return "Adjust the requested type hierarchy";
  if (tags.has("imagery") && /\bfewer\b|\bless\b|\breduce\b/i.test(source.feedback)) {
    return `Reduce abstract imagery in the ${surface}`;
  }
  if (tags.has("imagery")) return "Review the requested imagery change";
  if (tags.has("color")) return "Review the requested color or contrast change";
  if (tags.has("navigation")) {
    const label = requestedNavigationLabel(source.feedback);
    return label ? `Rename the navigation label to “${label}”` : "Improve the requested navigation behaviour";
  }
  if (tags.has("form")) return "Review the requested form change";
  if (tags.has("layout")) return movementTitle(source.feedback) ?? `Make the ${surface === "requested area" ? "requested layout" : surface} adjustment`;
  if (tags.has("vague")) return `Clarify the intended outcome of “${sentenceFragment(source.feedback, 58)}”`;
  return `Review: “${sentenceFragment(source.feedback, 68)}”`;
}

function actionFor(group: InsightGroup, brief: AnalysisRequest["brief"]) {
  const source = group.insights[0];
  const surface = group.surface ?? brief.deliverableType ?? "current deliverable";
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));

  if (tags.has("scope")) return `Keep ${source.scopeTopic ?? "the requested addition"} separate from the current ${brief.deliverableType || "deliverable"} until its budget and timeline are agreed.`;
  if (tags.has("conflict")) return "Pause execution on this direction and present the competing approaches as a clear decision for the client.";
  if (tags.has("density")) return `Reduce competing elements in the ${surface}, then give the primary action a clearer visual path.`;
  if (tags.has("cta")) return `Make the primary CTA more prominent in the ${surface} through placement, contrast, and surrounding space.`;
  if (tags.has("testimonials")) return "Propose one testimonial treatment that increases trust—such as a stronger proof point, quote hierarchy, or attribution—without adding a new content system.";
  if (tags.has("motion")) return `Translate the note into a specific motion decision for the ${surface}, keeping the approved tone and accessibility in mind.`;
  if (tags.has("copy")) return `Revise the affected wording in the ${surface}, preserving the brief's audience and tone.`;
  if (tags.has("type")) return `Test a more intentional type scale or emphasis in the ${surface}, without changing the approved visual direction.`;
  if (tags.has("imagery")) {
    return /\bfewer\b|\bless\b|\breduce\b/i.test(source.feedback)
      ? `Reduce the requested imagery in the ${surface}, keeping only what supports ${brief.audience || "the intended audience"}.`
      : `Update the imagery direction for the ${surface} in a way that supports ${brief.audience || "the intended audience"}.`;
  }
  if (tags.has("color")) return "Make the requested color or contrast adjustment within the approved palette and check that hierarchy still reads clearly.";
  if (tags.has("navigation")) {
    const label = requestedNavigationLabel(source.feedback);
    return label
      ? `Rename the navigation label to “${label}”, then check that the destination is easier to find.`
      : "Map the navigation issue to a single path or label change, then test whether the destination is easier to find.";
  }
  if (tags.has("form")) return "Clarify the form friction, then adjust the field order, labels, or action hierarchy that causes it.";
  if (tags.has("layout")) return `Implement the requested change in the ${surface}: ${sentenceFragment(source.feedback)}.`;
  if (tags.has("vague")) {
    return `Prepare two restrained interpretations for the ${surface}: clearer hierarchy and emphasis, or stronger contrast and imagery. Keep the ${brief.tone || "approved"} tone intact.`;
  }
  return `Keep the original request visible in the next review: ${sentenceFragment(source.feedback)}.`;
}

function rationaleFor(group: InsightGroup, brief: AnalysisRequest["brief"]) {
  const source = group.insights[0];
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));
  const count = group.insights.length;

  if (tags.has("scope")) return `${quote(source.feedback)} asks for ${source.scopeTopic ?? "an addition"}, which is not clearly part of the ${brief.deliverableType || "current deliverable"}.`;
  if (tags.has("conflict")) return `${quote(source.feedback)} contains opposing direction, so choosing one path before design work avoids rework.`;
  if (tags.has("density")) return `${count > 1 ? `${count} comments point to` : "The feedback points to"} a crowded ${group.surface ?? "area"}; resolving it supports ${sentenceFragment(brief.goal, 180)}.`;
  if (tags.has("cta")) return `${quote(source.feedback)} signals uncertainty about the next action, which matters for ${sentenceFragment(brief.goal, 180)}.`;
  if (tags.has("vague")) return `${quote(source.feedback)} identifies the area of concern but not the intended visual change, so a focused interpretation should be confirmed.`;
  return `${quote(source.feedback)} is a specific request about the ${group.surface ?? "current deliverable"}; the proposed action keeps it connected to the brief.`;
}

function nextActionFor(group: InsightGroup, brief: AnalysisRequest["brief"]) {
  const source = group.insights[0];
  const tags = new Set(group.insights.flatMap((insight) => [...insight.tags]));

  if (tags.has("scope")) return `Could you confirm whether ${source.scopeTopic ?? "this addition"} should be estimated as a separate phase or traded against the current ${brief.deliverableType || "scope"}?`;
  if (tags.has("conflict")) return "Could you confirm which direction should lead: the pared-back option or the more expressive option?";
  if (tags.has("vague")) return `Could you clarify what “${sentenceFragment(source.feedback, 90)}” should change first: hierarchy, imagery, type, or emphasis?`;
  if (tags.has("density") || tags.has("cta")) return "Make one focused hierarchy pass, then review the revised reading path against the project goal.";
  return "Include this change in the next design pass and review it against the brief before finalizing.";
}

function createItem(group: InsightGroup, seed: number, brief: AnalysisRequest["brief"]): ChecklistItem {
  return {
    id: `task-${seed}`,
    priority: itemPriority(group, brief),
    category: itemCategory(group),
    taskTitle: titleFor(group),
    suggestedAction: actionFor(group, brief),
    rationale: rationaleFor(group, brief),
    relatedFeedback: group.insights.map((insight) => quote(insight.feedback)).join(" / "),
    briefAlignment: alignmentFor(group.primaryTag, brief),
    nextAction: nextActionFor(group, brief),
  };
}

export function analyzeFeedback({ brief, feedback }: AnalysisRequest): AnalysisResult {
  const comments = splitFeedback(feedback);
  const insights = comments.map(inspectFeedback);
  const checklist = groupInsights(insights).map((group, index) => createItem(group, index + 1, brief));

  return {
    summary: {
      totalComments: comments.length,
      highPriority: checklist.filter((item) => item.priority === "high").length,
      needsClarification: checklist.filter((item) => item.priority === "needs clarification" || item.category === "needs clarification").length,
      scopeFlags: checklist.filter((item) => item.category === "potential scope creep").length,
    },
    checklist,
    clientReply: createClientReply({ brief, checklist }),
  };
}

function createClientReply({ brief, checklist }: Pick<AnalysisRequest, "brief"> & {
  checklist: ChecklistItem[];
}) {
  const confirmed = checklist.filter(
    (item) => item.category === "actionable design task" || item.category === "duplicate or overlapping feedback",
  );
  const questions = checklist.filter(
    (item) => item.category === "needs clarification" || item.category === "potential conflict",
  );
  const scopeItems = checklist.filter((item) => item.category === "potential scope creep");

  const confirmedLines = confirmed.length
    ? confirmed.slice(0, 3).map((item) => `- ${item.taskTitle}: ${item.suggestedAction}`).join("\n")
    : "- I will hold the open direction until we agree the clearest next step.";
  const questionLines = questions.length
    ? questions.slice(0, 3).map((item) => `- ${item.nextAction}`).join("\n")
    : "- No clarification questions from this pass.";
  const scopeLines = scopeItems.length
    ? scopeItems.map((item) => `- ${item.relatedFeedback} may extend the current scope. ${item.nextAction}`).join("\n")
    : "- I do not see a clear scope change in this pass.";

  return `Hi ${brief.projectName ? brief.projectName.split(" ")[0] : "there"},

Thanks for the feedback. I reviewed the notes against the goal of ${sentenceFragment(brief.goal, 180)}.

Confirmed changes:
${confirmedLines}

Questions to confirm:
${questionLines}

Scope notes:
${scopeLines}

Once we confirm the open points, I will fold the agreed changes into the next design pass.`;
}
