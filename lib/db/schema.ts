import type { DeadlineSource } from "@/lib/ai/extraction-schema";
import type { DeadlineType } from "@/lib/dates/deadlines";
import type { ReminderPlan } from "@/lib/dates/reminders";

export type DeadlineRecord = {
  id: string;
  purchaseId: string;
  type: DeadlineType;
  deadlineDate: string | null;
  source: DeadlineSource;
  confidence: number;
  evidence: string | null;
  status: "active" | "completed" | "expired" | "unknown";
  reminders: ReminderPlan[];
};

export type PurchaseRecord = {
  id: string;
  workspaceId: "demo";
  merchant: string | null;
  itemName: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  orderNumber: string | null;
  documentName: string;
  warnings: string[];
  createdAt: string;
  updatedAt: string;
  deadlines: DeadlineRecord[];
};

export type ExtractionRunRecord = {
  id: string;
  workspaceId: "demo";
  documentName: string;
  provider: string;
  model: string;
  warnings: string[];
  missingFields: string[];
  createdAt: string;
};

export type Store = {
  purchases: PurchaseRecord[];
  reminderLog: {
    id: string;
    purchaseId: string;
    deadlineId: string;
    message: string;
    sentAt: string;
  }[];
  extractionRuns: ExtractionRunRecord[];
};
