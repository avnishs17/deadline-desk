import { Badge } from "./ui";
import { groupDeadline } from "@/lib/dates/deadlines";

export function DeadlineStatusBadge({ date, status }: { date: string | null; status?: "active" | "completed" | "expired" | "unknown" }) {
  if (status === "completed") return <Badge tone="good">Completed</Badge>;
  if (status === "expired") return <Badge tone="bad">Expired</Badge>;
  const group = groupDeadline(date);
  if (group === "missing") return <Badge tone="neutral">Unknown</Badge>;
  if (group === "overdue") return <Badge tone="bad">Overdue</Badge>;
  if (group === "due7") return <Badge tone="warn">Due soon</Badge>;
  if (group === "due30") return <Badge tone="info">Upcoming</Badge>;
  return <Badge tone="good">Later</Badge>;
}
