"use client";

import * as React from "react";
import { Bell, Pencil, Save, Send, Trash2, X } from "lucide-react";
import type { PurchaseRecord } from "@/lib/db/schema";
import { deadlineGroupLabels, groupDeadline } from "@/lib/dates/deadlines";
import { ConfidenceBadge } from "./confidence-badge";
import { DeadlineStatusBadge } from "./deadline-status-badge";
import { Button, Card, Input } from "./ui";

type Props = {
  purchase: PurchaseRecord;
  onSendReminder: (deadlineId: string) => void;
  onUpdatePurchase: (purchase: PurchaseRecord) => void;
  onDeletePurchase: (purchaseId: string) => void;
};

type Draft = Pick<PurchaseRecord, "merchant" | "itemName" | "purchaseDate" | "totalAmount" | "currency" | "orderNumber" | "deadlines">;

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned ${response.status} ${response.statusText}.`);
  }
}

function makeDraft(purchase: PurchaseRecord): Draft {
  return {
    merchant: purchase.merchant,
    itemName: purchase.itemName,
    purchaseDate: purchase.purchaseDate,
    totalAmount: purchase.totalAmount,
    currency: purchase.currency,
    orderNumber: purchase.orderNumber,
    deadlines: purchase.deadlines.map((deadline) => ({ ...deadline, reminders: [...deadline.reminders] }))
  };
}

export function PurchaseCard({ purchase, onSendReminder, onUpdatePurchase, onDeletePurchase }: Props) {
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(() => makeDraft(purchase));
  const price = purchase.totalAmount == null ? "Amount unknown" : `${purchase.currency ?? "USD"} ${purchase.totalAmount.toFixed(2)}`;

  React.useEffect(() => {
    if (!editing) setDraft(makeDraft(purchase));
  }, [editing, purchase]);

  function updateDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function updateDeadline(deadlineId: string, key: "type" | "deadlineDate" | "evidence" | "status", value: string) {
    setDraft((current) => ({
      ...current,
      deadlines: current.deadlines.map((deadline) =>
        deadline.id === deadlineId
          ? {
              ...deadline,
              [key]: value === "" ? null : value
            }
          : deadline
      )
    }));
  }

  async function saveChanges() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: purchase.id, ...draft })
      });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Could not update purchase.");
      onUpdatePurchase(json.purchase);
      setEditing(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not update purchase.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCurrentPurchase() {
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch(`/api/purchases?id=${encodeURIComponent(purchase.id)}`, { method: "DELETE" });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Could not delete purchase.");
      onDeletePurchase(purchase.id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete purchase.");
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <Card className="p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="break-words text-base font-semibold leading-snug text-stone-950">{purchase.itemName ?? "Unnamed purchase"}</h3>
          <p className="mt-1 break-words text-sm leading-snug text-stone-600">
            {purchase.merchant ?? "Unknown merchant"} · {price}
          </p>
          <p className="mt-1 text-xs text-stone-500">{purchase.documentName}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" className="h-8 px-3" onClick={() => setEditing((value) => !value)} disabled={saving || deleting}>
            {editing ? <X className="h-3.5 w-3.5" aria-hidden="true" /> : <Pencil className="h-3.5 w-3.5" aria-hidden="true" />}
            {editing ? "Cancel" : "Edit"}
          </Button>
          {confirmingDelete ? (
            <>
              <Button variant="danger" className="h-8 px-3" onClick={deleteCurrentPurchase} disabled={saving || deleting}>
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {deleting ? "Deleting" : "Confirm"}
              </Button>
              <Button variant="secondary" className="h-8 px-3" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" className="h-8 px-3" onClick={() => setConfirmingDelete(true)} disabled={saving || deleting}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>}

      {editing && (
        <div className="mt-4 rounded-md border border-stone-200 bg-stone-50 p-3">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm font-medium text-stone-700">
              Merchant
              <Input className="mt-1 bg-white" value={draft.merchant ?? ""} onChange={(event) => updateDraft("merchant", event.target.value || null)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Item
              <Input className="mt-1 bg-white" value={draft.itemName ?? ""} onChange={(event) => updateDraft("itemName", event.target.value || null)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Purchase date
              <Input className="mt-1 bg-white" type="date" value={draft.purchaseDate ?? ""} onChange={(event) => updateDraft("purchaseDate", event.target.value || null)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Amount
              <Input className="mt-1 bg-white" type="number" step="0.01" value={draft.totalAmount ?? ""} onChange={(event) => updateDraft("totalAmount", event.target.value === "" ? null : Number(event.target.value))} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Currency
              <Input className="mt-1 bg-white" value={draft.currency ?? ""} onChange={(event) => updateDraft("currency", event.target.value || null)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Order number
              <Input className="mt-1 bg-white" value={draft.orderNumber ?? ""} onChange={(event) => updateDraft("orderNumber", event.target.value || null)} />
            </label>
          </div>

          <div className="mt-4 grid gap-2">
            {draft.deadlines.map((deadline) => (
              <div key={deadline.id} className="grid min-w-0 gap-2 rounded-md border border-stone-200 bg-white p-3 lg:grid-cols-[130px_150px_140px_minmax(0,1fr)]">
                <select
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  value={deadline.type}
                  onChange={(event) => updateDeadline(deadline.id, "type", event.target.value)}
                >
                  {["return", "warranty", "renewal", "cancellation", "service", "other"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <Input type="date" value={deadline.deadlineDate ?? ""} onChange={(event) => updateDeadline(deadline.id, "deadlineDate", event.target.value)} />
                <select
                  className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                  value={deadline.status}
                  onChange={(event) => updateDeadline(deadline.id, "status", event.target.value)}
                >
                  <option value="active">active</option>
                  <option value="completed">completed</option>
                  <option value="expired">expired</option>
                  <option value="unknown">unknown</option>
                </select>
                <Input value={deadline.evidence ?? ""} placeholder="Evidence or reviewer note" onChange={(event) => updateDeadline(deadline.id, "evidence", event.target.value)} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={saveChanges} disabled={saving}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? "Saving" : "Save changes"}
            </Button>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {purchase.deadlines.map((deadline) => (
          <div key={deadline.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-stone-500" aria-hidden="true" />
                <span className="text-sm font-medium capitalize">{deadline.type}</span>
                <DeadlineStatusBadge date={deadline.deadlineDate} status={deadline.status} />
              </div>
              <div className="flex items-center gap-2">
                <ConfidenceBadge confidence={deadline.confidence} />
                <span className="text-sm text-stone-700">{deadline.deadlineDate ?? "Unknown"}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {deadline.deadlineDate ? deadlineGroupLabels[groupDeadline(deadline.deadlineDate)] : "Ask user to verify this deadline."}
              {deadline.evidence ? ` Evidence: ${deadline.evidence}` : ""}
            </p>
            {deadline.reminders.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {deadline.reminders.map((reminder) => (
                  <span key={`${deadline.id}-${reminder.label}`} className="rounded-full bg-white px-2 py-1 text-xs text-stone-600 ring-1 ring-stone-200">
                    {reminder.label}: {reminder.remindAt}
                  </span>
                ))}
                <Button variant="secondary" className="h-8 px-3" onClick={() => onSendReminder(deadline.id)}>
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  Send test
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
