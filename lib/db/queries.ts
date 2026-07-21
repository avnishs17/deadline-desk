import { randomUUID } from "node:crypto";
import type { ExtractionResult } from "@/lib/ai/extraction-schema";
import { DeadlineType, normalizeIsoDate } from "@/lib/dates/deadlines";
import { generateReminderPlan } from "@/lib/dates/reminders";
import { readStore, writeStore } from "./client";
import type { DeadlineRecord, PurchaseRecord } from "./schema";

export type PurchaseUpdateInput = {
  id: string;
  merchant: string | null;
  itemName: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  orderNumber: string | null;
  deadlines: {
    id: string;
    type?: DeadlineType;
    deadlineDate: string | null;
    evidence: string | null;
    status: DeadlineRecord["status"];
  }[];
};

export type ManualPurchaseInput = {
  merchant: string | null;
  itemName: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string | null;
  orderNumber: string | null;
  deadlineType: DeadlineType;
  deadlineDate: string | null;
  evidence: string | null;
};

export type ExtractionRunInput = {
  documentName: string;
  provider: string;
  model: string;
  warnings: string[];
  missingFields: string[];
};

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanNumber(value: unknown) {
  if (value === null || value === "" || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const deadlineTypes: DeadlineType[] = ["return", "warranty", "renewal", "cancellation", "service", "other"];

function cleanDeadlineType(value: unknown): DeadlineType {
  return deadlineTypes.includes(value as DeadlineType) ? (value as DeadlineType) : "other";
}

function cleanStatus(value: unknown, date: string | null): DeadlineRecord["status"] {
  if (!date) return "unknown";
  return value === "completed" || value === "expired" ? value : "active";
}

export async function listPurchases() {
  const store = await readStore();
  // Old versions saved an empty return, warranty, and renewal row for every purchase.
  // Keep only deadline records that carry a date, evidence, or an explicit manual/inferred action.
  return store.purchases
    .map((purchase) => ({
      ...purchase,
      deadlines: purchase.deadlines.filter((deadline) => deadline.deadlineDate || deadline.evidence || deadline.source === "user_entered" || deadline.source === "inferred_from_purchase_date")
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listReminderLog() {
  const store = await readStore();
  return store.reminderLog.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export async function listExtractionRuns() {
  const store = await readStore();
  return (store.extractionRuns ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function recordExtractionRun(input: ExtractionRunInput) {
  const store = await readStore();
  const run = {
    id: randomUUID(),
    workspaceId: "demo" as const,
    documentName: input.documentName,
    provider: input.provider,
    model: input.model,
    warnings: input.warnings,
    missingFields: input.missingFields,
    createdAt: new Date().toISOString()
  };

  store.extractionRuns = [run, ...(store.extractionRuns ?? [])].slice(0, 20);
  await writeStore(store);
  return run;
}

export async function savePurchaseFromExtraction(documentName: string, extraction: ExtractionResult) {
  const store = await readStore();
  const now = new Date().toISOString();
  const purchaseId = randomUUID();

  const deadlineSpecs = [
    { type: "return" as const, field: extraction.returnDeadline },
    { type: "warranty" as const, field: extraction.warrantyDeadline },
    { type: "renewal" as const, field: extraction.renewalDate }
  ];

  const deadlines: DeadlineRecord[] = deadlineSpecs
    .filter((spec) => spec.field.value || spec.field.source === "inferred_from_purchase_date")
    .map((spec) => ({
      id: randomUUID(),
      purchaseId,
      type: spec.type,
      deadlineDate: spec.field.value,
      source: spec.field.source,
      confidence: spec.field.confidence,
      evidence: spec.field.evidence,
      status: spec.field.value ? "active" : "unknown",
      reminders: generateReminderPlan(spec.field.value)
    }));

  const purchase: PurchaseRecord = {
    id: purchaseId,
    workspaceId: "demo",
    merchant: extraction.merchant.value,
    itemName: extraction.itemName.value,
    purchaseDate: extraction.purchaseDate.value,
    totalAmount: extraction.totalAmount.value,
    currency: extraction.currency.value,
    orderNumber: extraction.orderNumber.value,
    documentName,
    warnings: extraction.warnings,
    createdAt: now,
    updatedAt: now,
    deadlines
  };

  store.purchases.unshift(purchase);
  await writeStore(store);
  return purchase;
}

export async function createManualPurchase(input: ManualPurchaseInput) {
  const store = await readStore();
  const now = new Date().toISOString();
  const purchaseId = randomUUID();
  const deadlineId = randomUUID();
  const deadlineDate = normalizeIsoDate(input.deadlineDate);
  const deadlineType = cleanDeadlineType(input.deadlineType);

  const deadline: DeadlineRecord = {
    id: deadlineId,
    purchaseId,
    type: deadlineType,
    deadlineDate,
    source: "user_entered",
    confidence: deadlineDate ? 1 : 0.2,
    evidence: cleanText(input.evidence) ?? "Manual entry",
    status: deadlineDate ? "active" : "unknown",
    reminders: generateReminderPlan(deadlineDate)
  };

  const purchase: PurchaseRecord = {
    id: purchaseId,
    workspaceId: "demo",
    merchant: cleanText(input.merchant),
    itemName: cleanText(input.itemName),
    purchaseDate: normalizeIsoDate(input.purchaseDate),
    totalAmount: cleanNumber(input.totalAmount),
    currency: cleanText(input.currency)?.toUpperCase() ?? null,
    orderNumber: cleanText(input.orderNumber),
    documentName: "manual entry",
    warnings: deadlineDate ? [] : ["Manual deadline date is unknown. Verify before relying on reminders."],
    createdAt: now,
    updatedAt: now,
    deadlines: [deadline]
  };

  store.purchases.unshift(purchase);
  await writeStore(store);
  return purchase;
}

export async function sendDemoReminder(deadlineId: string) {
  const store = await readStore();
  const purchase = store.purchases.find((item) => item.deadlines.some((deadline) => deadline.id === deadlineId));
  const deadline = purchase?.deadlines.find((item) => item.id === deadlineId);

  if (!purchase || !deadline) {
    throw new Error("Deadline not found");
  }

  const sentAt = new Date().toISOString();
  const log = {
    id: randomUUID(),
    purchaseId: purchase.id,
    deadlineId,
    message: `Demo reminder sent for ${purchase.merchant ?? "Unknown merchant"} ${deadline.type} deadline.`,
    sentAt
  };

  deadline.reminders = deadline.reminders.map((reminder, index) => (index === 0 ? { ...reminder, status: "sent" } : reminder));
  store.reminderLog.unshift(log);
  await writeStore(store);
  return log;
}

export async function updatePurchase(input: PurchaseUpdateInput) {
  const store = await readStore();
  const purchase = store.purchases.find((item) => item.id === input.id);

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  purchase.merchant = cleanText(input.merchant);
  purchase.itemName = cleanText(input.itemName);
  purchase.purchaseDate = normalizeIsoDate(input.purchaseDate);
  purchase.totalAmount = cleanNumber(input.totalAmount);
  purchase.currency = cleanText(input.currency)?.toUpperCase() ?? null;
  purchase.orderNumber = cleanText(input.orderNumber);
  purchase.updatedAt = new Date().toISOString();

  for (const patch of input.deadlines) {
    const deadline = purchase.deadlines.find((item) => item.id === patch.id);
    if (!deadline) continue;

    const nextDate = normalizeIsoDate(patch.deadlineDate);
    const dateChanged = deadline.deadlineDate !== nextDate;
    deadline.type = cleanDeadlineType(patch.type ?? deadline.type);
    deadline.deadlineDate = nextDate;
    deadline.evidence = cleanText(patch.evidence);
    deadline.status = cleanStatus(patch.status, nextDate);

    if (dateChanged) {
      deadline.source = "user_entered";
      deadline.confidence = nextDate ? 1 : Math.min(deadline.confidence, 0.2);
      deadline.reminders = generateReminderPlan(nextDate);
    }
  }

  await writeStore(store);
  return purchase;
}

export async function deletePurchase(id: string) {
  const store = await readStore();
  const before = store.purchases.length;
  store.purchases = store.purchases.filter((purchase) => purchase.id !== id);
  store.reminderLog = store.reminderLog.filter((log) => log.purchaseId !== id);

  if (store.purchases.length === before) {
    throw new Error("Purchase not found");
  }

  await writeStore(store);
  return { id };
}

export async function clearDemoWorkspace() {
  await writeStore({ purchases: [], reminderLog: [], extractionRuns: [] });
  return { ok: true };
}
