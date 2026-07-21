export type DeadlineType = "return" | "warranty" | "renewal" | "cancellation" | "service" | "other";
export type DeadlineGroup = "overdue" | "due7" | "due30" | "later" | "missing";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthNames: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12"
};

function padDay(day: string) {
  return day.padStart(2, "0");
}

export function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (isoDatePattern.test(trimmed)) return trimmed;

  const monthFirst = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/);
  if (monthFirst) {
    const month = monthNames[monthFirst[1].toLowerCase()];
    if (month) return `${monthFirst[3]}-${month}-${padDay(monthFirst[2])}`;
  }

  const dayFirst = trimmed.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s+(\d{4})$/);
  if (dayFirst) {
    const month = monthNames[dayFirst[2].toLowerCase()];
    if (month) return `${dayFirst[3]}-${month}-${padDay(dayFirst[1])}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function daysUntil(deadlineDate: string, now = new Date()): number {
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const target = new Date(`${deadlineDate}T00:00:00.000Z`);
  return Math.floor((target.getTime() - today.getTime()) / 86_400_000);
}

export function groupDeadline(deadlineDate: string | null, now = new Date()): DeadlineGroup {
  if (!deadlineDate) return "missing";
  const delta = daysUntil(deadlineDate, now);
  if (delta < 0) return "overdue";
  if (delta <= 7) return "due7";
  if (delta <= 30) return "due30";
  return "later";
}

export const deadlineGroupLabels: Record<DeadlineGroup, string> = {
  overdue: "Overdue",
  due7: "Due in 7 days",
  due30: "Due in 30 days",
  later: "Later",
  missing: "Missing deadline"
};
