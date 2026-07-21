import type { DeadlineRecord } from "@/lib/db/schema";
import { daysUntil } from "./deadlines";

export type RiskLevel = "low" | "medium" | "high";

export type DeadlineRisk = {
  level: RiskLevel;
  score: number;
  reasons: string[];
};

export function calculateDeadlineRisk(deadline: DeadlineRecord, now = new Date()): DeadlineRisk {
  const reasons: string[] = [];
  let score = 0;

  if (!deadline.deadlineDate) {
    score += 45;
    reasons.push("deadline missing");
  } else {
    const days = daysUntil(deadline.deadlineDate, now);
    if (days < 0) {
      score += 35;
      reasons.push("past deadline");
    } else if (days <= 7) {
      score += 25;
      reasons.push("due soon");
    } else if (days <= 30) {
      score += 10;
      reasons.push("upcoming");
    }
  }

  if (deadline.status === "completed") {
    return { level: "low", score: 0, reasons: ["marked completed"] };
  }

  if (deadline.status === "expired") {
    score += 30;
    reasons.push("marked expired");
  }

  if (deadline.source === "unknown") {
    score += 25;
    reasons.push("source unknown");
  }

  if (deadline.source === "inferred_from_purchase_date") {
    score += 15;
    reasons.push("inferred from policy window");
  }

  if (deadline.confidence < 0.5) {
    score += 20;
    reasons.push("low confidence");
  } else if (deadline.confidence < 0.8) {
    score += 10;
    reasons.push("medium confidence");
  }

  if (!deadline.evidence) {
    score += 10;
    reasons.push("no evidence note");
  }

  const capped = Math.min(score, 100);
  return {
    level: capped >= 50 ? "high" : capped >= 20 ? "medium" : "low",
    score: capped,
    reasons: reasons.length ? reasons : ["document-supported"]
  };
}
