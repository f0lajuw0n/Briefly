import type { AnalysisResult, ChecklistItem } from "@/lib/types";

export function formatChecklistForClipboard(items: ChecklistItem[]) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. [${item.priority.toUpperCase()}] ${item.taskTitle}\n` +
        `Action: ${item.suggestedAction}\n` +
        `Rationale: ${item.rationale}\n` +
        `Related feedback: ${item.relatedFeedback}\n` +
        `Brief alignment: ${item.briefAlignment}\n` +
        `Next action: ${item.nextAction}`,
    )
    .join("\n\n");
}

export function formatResultForClipboard(result: AnalysisResult) {
  return `${formatChecklistForClipboard(result.checklist)}\n\nClient reply:\n${result.clientReply}`;
}
