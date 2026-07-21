"use client";

import * as React from "react";
import { ArrowUpDown, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { ExtractionRunRecord, PurchaseRecord } from "@/lib/db/schema";
import { deadlineGroupLabels, DeadlineGroup, DeadlineType, groupDeadline } from "@/lib/dates/deadlines";
import { calculateDeadlineRisk } from "@/lib/dates/risk";
import { DemoControls } from "./demo-controls";
import { DeadlineItemCard } from "./deadline-item-card";
import { ExtractionHistory } from "./extraction-history";
import { ManualPurchaseForm } from "./manual-purchase-form";
import { Button, Input } from "./ui";

const groups: DeadlineGroup[] = ["overdue", "due7", "due30", "later", "missing"];
const deadlineTypes: DeadlineType[] = ["return", "warranty", "renewal", "cancellation", "service", "other"];
type DashboardFilter = "all" | DeadlineGroup;
type StatusFilter = "active" | "completed" | "all";
type SortOrder = "soonest" | "recent" | "merchant";

type Props = {
  purchases: PurchaseRecord[];
  reminderLog: { id: string; message: string; sentAt: string }[];
  extractionRuns: ExtractionRunRecord[];
  onSendReminder: (deadlineId: string) => void;
  onUpdatePurchase: (purchase: PurchaseRecord) => void;
  onDeletePurchase: (purchaseId: string) => void;
  onCreatePurchase: (purchase: PurchaseRecord) => void;
  onWorkspaceChange: () => void;
  onOpenCapture: () => void;
};

export function DeadlineDashboard({
  purchases,
  reminderLog,
  extractionRuns,
  onSendReminder,
  onUpdatePurchase,
  onDeletePurchase,
  onCreatePurchase,
  onWorkspaceChange,
  onOpenCapture
}: Props) {
  const [query, setQuery] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<DashboardFilter>("all");
  const [typeFilter, setTypeFilter] = React.useState<"all" | DeadlineType>("all");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("active");
  const [sortOrder, setSortOrder] = React.useState<SortOrder>("soonest");
  const [fromDate, setFromDate] = React.useState("");
  const [toDate, setToDate] = React.useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const deadlineItems = purchases.flatMap((purchase) => purchase.deadlines.map((deadline) => ({ purchase, deadline })));

  const matchingFilters = deadlineItems.filter(({ purchase, deadline }) => {
    const matchesSearch = !normalizedQuery || [purchase.merchant, purchase.itemName, purchase.orderNumber, purchase.documentName, deadline.type, deadline.evidence]
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
    const matchesType = typeFilter === "all" || deadline.type === typeFilter;
    const matchesStatus = statusFilter === "all" || (statusFilter === "completed" ? deadline.status === "completed" : deadline.status !== "completed");
    const matchesFrom = !fromDate || (deadline.deadlineDate !== null && deadline.deadlineDate >= fromDate);
    const matchesTo = !toDate || (deadline.deadlineDate !== null && deadline.deadlineDate <= toDate);
    return matchesSearch && matchesType && matchesStatus && matchesFrom && matchesTo;
  });

  const filtered = matchingFilters
    .filter(({ deadline }) => activeFilter === "all" || groupDeadline(deadline.deadlineDate) === activeFilter)
    .slice()
    .sort((a, b) => {
      if (sortOrder === "merchant") return (a.purchase.merchant ?? "").localeCompare(b.purchase.merchant ?? "");
      if (sortOrder === "recent") return b.purchase.updatedAt.localeCompare(a.purchase.updatedAt);
      const aDate = a.deadline.deadlineDate ?? "9999-12-31";
      const bDate = b.deadline.deadlineDate ?? "9999-12-31";
      return aDate.localeCompare(bDate);
    });

  const highRiskCount = deadlineItems.filter(({ deadline }) => deadline.status !== "completed" && calculateDeadlineRisk(deadline).level === "high").length;
  const missingCount = deadlineItems.filter(({ deadline }) => deadline.status !== "completed" && !deadline.deadlineDate).length;
  const activeCount = deadlineItems.filter(({ deadline }) => deadline.status !== "completed").length;
  const hasCustomFilters = query || typeFilter !== "all" || statusFilter !== "active" || fromDate || toDate || sortOrder !== "soonest" || activeFilter !== "all";

  function clearFilters() {
    setQuery("");
    setActiveFilter("all");
    setTypeFilter("all");
    setStatusFilter("active");
    setSortOrder("soonest");
    setFromDate("");
    setToDate("");
  }

  return (
    <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 rounded-xl border border-[#d4d8cf] bg-[#fbfcf8] shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
        <div className="border-b border-[#dfe2db] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657544]">Active tracker</p>
              <h2 className="mt-1 text-lg font-semibold text-[#202622]">Deadline dashboard</h2>
            </div>
            <Button className="w-full sm:w-auto" onClick={onOpenCapture}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add document
            </Button>
          </div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(220px,1fr)_150px_150px_150px]">
            <label className="relative min-w-0">
              <span className="sr-only">Search deadlines</span>
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-stone-400" aria-hidden="true" />
              <Input className="pl-9" placeholder="Search purchase, merchant, order, or evidence" value={query} onChange={(event) => setQuery(event.target.value)} />
            </label>
            <Select label="Deadline type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | DeadlineType)}>
              <option value="all">All types</option>
              {deadlineTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
            </Select>
            <Select label="Record status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="active">Active only</option>
              <option value="completed">Completed</option>
              <option value="all">All records</option>
            </Select>
            <Select label="Sort order" value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="soonest">Soonest first</option>
              <option value="recent">Recently updated</option>
              <option value="merchant">Merchant A-Z</option>
            </Select>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-medium text-stone-500"><SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" /> Deadline date</div>
            <label className="flex items-center gap-2 text-xs text-stone-600"><span>From</span><input className="h-8 rounded-md border border-[#cdd2c7] bg-white px-2 text-sm text-stone-800" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label className="flex items-center gap-2 text-xs text-stone-600"><span>To</span><input className="h-8 rounded-md border border-[#cdd2c7] bg-white px-2 text-sm text-stone-800" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
            {hasCustomFilters && <button className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium text-stone-600 hover:bg-[#edf0e8]" onClick={clearFilters}><X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters</button>}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <FilterButton active={activeFilter === "all"} label="All active" count={matchingFilters.length} onClick={() => setActiveFilter("all")} />
            {groups.map((group) => (
              <FilterButton
                key={group}
                active={activeFilter === group}
                label={deadlineGroupLabels[group]}
                count={matchingFilters.filter(({ deadline }) => groupDeadline(deadline.deadlineDate) === group).length}
                onClick={() => setActiveFilter(group)}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#dfe2db] border-b border-[#dfe2db] bg-[#f4f6f0]">
          <SummaryMetric label="Active" value={String(activeCount)} />
          <SummaryMetric label="High risk" value={String(highRiskCount)} tone={highRiskCount ? "bad" : "good"} />
          <SummaryMetric label="Missing date" value={String(missingCount)} tone={missingCount ? "warn" : "good"} />
        </div>

        {purchases.length === 0 ? (
          <div className="m-5 rounded-lg border border-dashed border-[#c7ccc0] bg-[#f4f6f0] p-6 sm:p-8">
            <h3 className="text-base font-semibold text-[#202622]">Nothing needs tracking yet.</h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">Add a sample or upload a receipt, invoice, or warranty document. You can review every extracted field before it becomes a deadline.</p>
            <Button className="mt-4" onClick={onOpenCapture}><Plus className="h-4 w-4" aria-hidden="true" /> Add your first document</Button>
          </div>
        ) : (
          <div className="max-h-none space-y-3 p-4 sm:p-5 xl:max-h-[calc(100vh-330px)] xl:overflow-y-auto xl:pr-3">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#c7ccc0] bg-[#f4f6f0] p-5 text-sm text-stone-600">No deadlines match these filters.</div>
            ) : (
              filtered.map(({ purchase, deadline }) => (
                <DeadlineItemCard
                  key={deadline.id}
                  purchase={purchase}
                  deadline={deadline}
                  onSendReminder={onSendReminder}
                  onUpdatePurchase={onUpdatePurchase}
                  onDeletePurchase={onDeletePurchase}
                />
              ))
            )}
          </div>
        )}
      </div>

      <aside className="grid content-start gap-4">
        <ManualPurchaseForm onCreatePurchase={onCreatePurchase} />
        <details className="rounded-xl border border-[#d4d8cf] bg-[#fbfcf8] shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[#202622]">Workspace tools <ArrowUpDown className="h-4 w-4 text-stone-500" aria-hidden="true" /></summary>
          <div className="grid gap-4 border-t border-[#dfe2db] p-4"><DemoControls onChange={onWorkspaceChange} /><ExtractionHistory runs={extractionRuns} /></div>
        </details>
        <details className="rounded-xl border border-[#d4d8cf] bg-[#fbfcf8] shadow-[0_8px_22px_rgba(32,38,34,0.05)]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[#202622]">Reminder activity <span className="rounded-full bg-[#edf0e8] px-2 py-0.5 text-xs text-stone-600">{reminderLog.length}</span></summary>
          <div className="grid gap-3 border-t border-[#dfe2db] p-4">
            {reminderLog.length === 0 ? <p className="text-sm text-stone-500">No reminder tests sent yet.</p> : reminderLog.map((log) => <div key={log.id} className="min-w-0 rounded-md border border-[#dfe2db] bg-[#f4f6f0] p-3"><p className="text-sm text-stone-800">{log.message}</p><p className="mt-1 text-xs text-stone-500">{new Date(log.sentAt).toLocaleString()}</p></div>)}
          </div>
        </details>
      </aside>
    </section>
  );
}

function Select({ label, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return <label className="min-w-0"><span className="sr-only">{label}</span><select className="h-10 w-full rounded-md border border-[#cdd2c7] bg-[#fbfcf8] px-3 text-sm text-stone-800 outline-none focus:border-[#596b34] focus:ring-2 focus:ring-[#596b34]/20" {...props}>{children}</select></label>;
}

function SummaryMetric({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "good" | "warn" | "bad" }) {
  const color = tone === "good" ? "text-emerald-800" : tone === "warn" ? "text-amber-800" : tone === "bad" ? "text-red-800" : "text-stone-900";
  return <div className="min-w-0 px-4 py-3 sm:px-5"><p className="break-words text-xs font-medium uppercase tracking-normal text-stone-500">{label}</p><p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p></div>;
}

function FilterButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return <button className={active ? "shrink-0 rounded-md bg-[#202622] px-3 py-1.5 text-sm font-medium text-white" : "shrink-0 rounded-md border border-[#cdd2c7] bg-[#fbfcf8] px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-[#edf0e8]"} onClick={onClick}>{label} <span className={active ? "text-white/65" : "text-stone-500"}>{count}</span></button>;
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
