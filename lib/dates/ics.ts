import type { DeadlineRecord, PurchaseRecord } from "@/lib/db/schema";

function escapeIcs(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

export function createDeadlineIcs(purchase: PurchaseRecord, deadline: DeadlineRecord) {
  if (!deadline.deadlineDate) return null;

  const compactDate = deadline.deadlineDate.replaceAll("-", "");
  const title = `${deadline.type} deadline: ${purchase.itemName ?? purchase.merchant ?? "purchase"}`;
  const description = [
    `Merchant: ${purchase.merchant ?? "Unknown"}`,
    `Item: ${purchase.itemName ?? "Unknown"}`,
    `Source: ${deadline.source}`,
    `Confidence: ${Math.round(deadline.confidence * 100)}%`,
    deadline.evidence ? `Evidence: ${deadline.evidence}` : "Evidence: none"
  ].join("\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Deadline Desk//Demo//EN",
    "BEGIN:VEVENT",
    `UID:${deadline.id}@deadline-desk.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`,
    `DTSTART;VALUE=DATE:${compactDate}`,
    `SUMMARY:${escapeIcs(title)}`,
    `DESCRIPTION:${escapeIcs(description)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}
