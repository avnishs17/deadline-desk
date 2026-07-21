import { addDays } from "./deadlines";

export type ReminderPlan = {
  remindAt: string;
  label: string;
  status: "pending" | "sent" | "failed";
  channel: "demo" | "in_app" | "email";
};

const offsets = [
  { days: -7, label: "7 days before" },
  { days: -3, label: "3 days before" },
  { days: -1, label: "1 day before" },
  { days: 0, label: "Day of deadline" }
];

export function generateReminderPlan(deadlineDate: string | null): ReminderPlan[] {
  if (!deadlineDate) return [];
  return offsets.map((offset) => ({
    remindAt: addDays(deadlineDate, offset.days),
    label: offset.label,
    status: "pending",
    channel: "demo"
  }));
}
