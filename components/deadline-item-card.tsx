"use client";

import { useState } from "react";
import { Calendar, Check, ChevronDown, FileText, Send, Settings } from "lucide-react";
import type { DeadlineRecord, PurchaseRecord } from "@/lib/db/schema";
import { createDeadlineIcs } from "@/lib/dates/ics";
import { calculateDeadlineRisk } from "@/lib/dates/risk";
import { deadlineGroupLabels, groupDeadline } from "@/lib/dates/deadlines";
import { ConfidenceBadge } from "./confidence-badge";
import { DeadlineStatusBadge } from "./deadline-status-badge";
import { PurchaseCard } from "./purchase-card";
import { Badge, Button, Card } from "./ui";

export function DeadlineItemCard({ purchase, deadline, onSendReminder, onUpdatePurchase, onDeletePurchase }: {
  purchase: PurchaseRecord;
  deadline: DeadlineRecord;
  onSendReminder: (deadlineId: string) => void;
  onUpdatePurchase: (purchase: PurchaseRecord) => void;
  onDeletePurchase: (purchaseId: string) => void;
}) {
  const [exportState, setExportState] = useState<"idle" | "exported" | "missing-date">("idle");
  const risk = calculateDeadlineRisk(deadline);
  const canExport = Boolean(deadline.deadlineDate);

  function flashExportState(state: "exported" | "missing-date") {
    setExportState(state);
    window.setTimeout(() => setExportState("idle"), 2200);
  }

  function exportIcs() {
    const ics = createDeadlineIcs(purchase, deadline);
    if (!ics) { flashExportState("missing-date"); return; }
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${deadline.type}-${purchase.itemName ?? purchase.merchant ?? "deadline"}.ics`.replace(/[^a-z0-9.-]+/gi, "-").toLowerCase();
    anchor.click();
    URL.revokeObjectURL(url);
    flashExportState("exported");
  }

  return (
    <Card className="border-[#dfe2db] bg-white p-4 shadow-none">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657544]">{deadline.type}</span>
            <DeadlineStatusBadge date={deadline.deadlineDate} status={deadline.status} />
            <Badge tone={risk.level === "high" ? "bad" : risk.level === "medium" ? "warn" : "good"}>{risk.level} risk</Badge>
          </div>
          <h3 className="mt-2 break-words text-base font-semibold leading-snug text-[#202622]">{purchase.itemName ?? "Unnamed purchase"}</h3>
          <p className="mt-1 break-words text-sm leading-snug text-stone-600">{purchase.merchant ?? "Unknown merchant"} <span className="px-1 text-stone-300">/</span> {deadline.deadlineDate ?? "Date needs review"}</p>
          <p className="mt-1 text-xs font-medium text-stone-500">{deadline.deadlineDate ? deadlineGroupLabels[groupDeadline(deadline.deadlineDate)] : "No date saved"}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          <ConfidenceBadge confidence={deadline.confidence} />
          <Button variant="secondary" className="h-8 px-2.5" onClick={() => onSendReminder(deadline.id)} disabled={!deadline.deadlineDate} title="Send a test reminder"><Send className="h-3.5 w-3.5" aria-hidden="true" /> Test</Button>
          <Button variant="secondary" className="h-8 px-2.5" onClick={exportIcs} disabled={!canExport} title="Export calendar event">{exportState === "exported" ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Calendar className="h-3.5 w-3.5" aria-hidden="true" />}{exportState === "exported" ? "Exported" : "Export"}</Button>
        </div>
      </div>

      {exportState === "exported" && <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Calendar file exported.</p>}
      {exportState === "missing-date" && <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">Add a deadline date before exporting to calendar.</p>}

      <details className="mt-3 border-t border-[#e5e7e2] pt-3">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-stone-700"><ChevronDown className="h-4 w-4" aria-hidden="true" /> Evidence and reminders</summary>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0 rounded-md border border-[#dfe2db] bg-[#f4f6f0] p-3"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-normal text-stone-500"><FileText className="h-3.5 w-3.5" aria-hidden="true" /> Evidence</div><p className="mt-2 break-words text-sm leading-relaxed text-stone-700">{deadline.evidence ?? "No supporting evidence saved."}</p><p className="mt-2 break-words text-xs text-stone-500">Source: {deadline.source.replaceAll("_", " ")}</p></div>
          <div className="min-w-0 rounded-md border border-[#dfe2db] bg-[#f4f6f0] p-3"><p className="text-xs font-medium uppercase tracking-normal text-stone-500">Reminder plan</p>{deadline.reminders.length === 0 ? <p className="mt-2 text-sm text-stone-500">No reminders until a date is known.</p> : <div className="mt-2 grid gap-1.5">{deadline.reminders.map((reminder) => <div key={`${deadline.id}-${reminder.label}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-xs text-stone-600"><span>{reminder.label}</span><span className="font-medium text-stone-800">{reminder.remindAt}</span></div>)}</div>}</div>
        </div>
      </details>

      <details className="mt-3 rounded-md border border-[#dfe2db] bg-[#fbfcf8]">
        <summary className="flex cursor-pointer list-none items-center justify-end gap-2 px-3 py-2 text-sm font-medium text-stone-700"><Settings className="h-4 w-4" aria-hidden="true" /> Edit or delete purchase</summary>
        <div className="border-t border-[#dfe2db] p-3"><PurchaseCard purchase={purchase} onSendReminder={onSendReminder} onUpdatePurchase={onUpdatePurchase} onDeletePurchase={onDeletePurchase} /></div>
      </details>
    </Card>
  );
}
