import { describe, expect, it } from "vitest";
import { addDays, groupDeadline, normalizeIsoDate } from "@/lib/dates/deadlines";
import { generateReminderPlan } from "@/lib/dates/reminders";
import { normalizeExtraction } from "@/lib/ai/normalize-extraction";

const unknownDeadlineResponse = {
  merchant: { value: "Atlas Office Supply", confidence: 0.97, evidence: "Atlas Office Supply", source: "document_stated" },
  itemName: { value: "Standing desk mat", confidence: 0.9, evidence: "Standing desk mat", source: "document_stated" },
  purchaseDate: { value: "2026-07-02", confidence: 0.92, evidence: "Invoice date: 2026-07-02", source: "document_stated" },
  totalAmount: { value: 74.25, confidence: 0.9, evidence: "Amount due: $74.25", source: "document_stated" },
  currency: { value: "USD", confidence: 0.86, evidence: "$74.25", source: "document_stated" },
  orderNumber: { value: "INV-2026-7721", confidence: 0.95, evidence: "Invoice INV-2026-7721", source: "document_stated" },
  returnDeadline: { value: null, confidence: 0.08, evidence: null, source: "unknown" },
  warrantyDeadline: { value: null, confidence: 0.08, evidence: null, source: "unknown" },
  renewalDate: { value: null, confidence: 0.08, evidence: null, source: "unknown" },
  warnings: ["No return policy, warranty term, or renewal date found in the invoice."],
  missingFields: ["returnDeadline", "warrantyDeadline", "renewalDate"],
  needsUserReview: true
};

describe("deadline date logic", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");
  it("normalizes parseable dates to ISO date strings", () => { expect(normalizeIsoDate("July 10, 2026")).toBe("2026-07-10"); expect(normalizeIsoDate("not a date")).toBeNull(); });
  it("groups deadlines by urgency", () => { expect(groupDeadline("2026-07-17", now)).toBe("overdue"); expect(groupDeadline("2026-07-25", now)).toBe("due7"); expect(groupDeadline("2026-08-10", now)).toBe("due30"); expect(groupDeadline("2026-09-01", now)).toBe("later"); expect(groupDeadline(null, now)).toBe("missing"); });
  it("generates four demo reminders for known deadlines", () => { expect(generateReminderPlan("2026-08-09")).toEqual([{ remindAt: "2026-08-02", label: "7 days before", status: "pending", channel: "demo" }, { remindAt: "2026-08-06", label: "3 days before", status: "pending", channel: "demo" }, { remindAt: "2026-08-08", label: "1 day before", status: "pending", channel: "demo" }, { remindAt: "2026-08-09", label: "Day of deadline", status: "pending", channel: "demo" }]); expect(addDays("2026-08-09", -7)).toBe("2026-08-02"); });
});

describe("extraction normalization", () => {
  it("keeps unknown deadlines unknown instead of inventing dates", () => { const normalized = normalizeExtraction(unknownDeadlineResponse); expect(normalized.returnDeadline.value).toBeNull(); expect(normalized.warrantyDeadline.value).toBeNull(); expect(normalized.missingFields).toContain("returnDeadline"); });
  it("keeps incomplete model output review-required", () => { const normalized = normalizeExtraction({ ...unknownDeadlineResponse, merchant: { value: null, confidence: 0, evidence: null, source: "unknown" }, warnings: ["Document was unreadable."], missingFields: ["merchant"] }); expect(normalized.needsUserReview).toBe(true); expect(normalized.merchant.value).toBeNull(); expect(normalized.warnings).toContain("Document was unreadable."); });
});
