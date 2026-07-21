import { AlertTriangle, CalendarClock, CheckCircle2, FileSearch } from "lucide-react";
import type { ReactNode } from "react";
import type { PurchaseRecord } from "@/lib/db/schema";
import { daysUntil } from "@/lib/dates/deadlines";
import { calculateDeadlineRisk } from "@/lib/dates/risk";

export function WorkspaceOverview({ purchases }: { purchases: PurchaseRecord[] }) {
  const deadlines = purchases.flatMap((purchase) => purchase.deadlines.map((deadline) => ({ purchase, deadline })));
  const knownDeadlines = deadlines.filter(({ deadline }) => deadline.deadlineDate && deadline.status !== "completed");
  const highRisk = deadlines.filter(({ deadline }) => calculateDeadlineRisk(deadline).level === "high").length;
  const completed = deadlines.filter(({ deadline }) => deadline.status === "completed").length;
  const missing = deadlines.filter(({ deadline }) => !deadline.deadlineDate).length;
  const next = knownDeadlines
    .slice()
    .sort((a, b) => daysUntil(a.deadline.deadlineDate!) - daysUntil(b.deadline.deadlineDate!))[0];
  const nextDays = next?.deadline.deadlineDate ? daysUntil(next.deadline.deadlineDate) : null;

  return (
    <section className="overflow-hidden rounded-xl border border-[#d4d8cf] bg-[#fbfcf8] shadow-[0_12px_35px_rgba(32,38,34,0.06)]">
      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657544]">Deadline overview</p>
          <div className="mt-2 flex min-w-0 flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="break-words text-2xl font-semibold leading-tight text-[#202622]">Keep the next move visible.</h2>
              <p className="mt-1 break-words text-sm text-stone-600">
                {next ? `${next.deadline.type} deadline for ${next.purchase.itemName ?? next.purchase.merchant ?? "purchase"} is next.` : "Add a document to start tracking its important dates."}
              </p>
            </div>
            {next && <div className="w-fit rounded-lg border border-[#d4d8cf] bg-white px-3 py-2 text-right"><p className="text-xs font-medium text-stone-500">Next deadline</p><p className="mt-0.5 text-sm font-semibold text-[#202622]">{next.deadline.deadlineDate} · {nextDays === 0 ? "today" : `${nextDays}d`}</p></div>}
          </div>
        </div>
        <div className="grid min-w-0 grid-cols-2 border-t border-[#d4d8cf] lg:w-[420px] lg:border-l lg:border-t-0">
          <Metric icon={<FileSearch className="h-4 w-4" />} label="Purchases" value={String(purchases.length)} />
          <Metric icon={<CalendarClock className="h-4 w-4" />} label="Deadlines" value={String(deadlines.length)} />
          <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Needs attention" value={String(highRisk + missing)} tone={highRisk + missing ? "bad" : "good"} />
          <Metric icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={String(completed)} tone="good" />
        </div>
      </div>
    </section>
  );
}

function Metric({ icon, label, value, tone = "neutral" }: { icon: ReactNode; label: string; value: string; tone?: "neutral" | "good" | "bad" }) {
  const valueColor = tone === "good" ? "text-emerald-800" : tone === "bad" ? "text-red-800" : "text-stone-950";
  return (
    <div className="min-w-0 border-b border-r border-[#dfe2db] p-4 last:border-b-0 sm:p-5">
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <span className="min-w-0 break-words text-xs font-medium uppercase tracking-normal">{label}</span>
      </div>
      <p className={`mt-2 text-3xl font-semibold ${valueColor}`}>{value}</p>
    </div>
  );
}
