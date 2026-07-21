"use client";

import * as React from "react";
import { PlusCircle, Save } from "lucide-react";
import type { PurchaseRecord } from "@/lib/db/schema";
import { Button, Card, Input } from "./ui";

const deadlineTypes = ["return", "warranty", "renewal", "cancellation", "service", "other"] as const;

type Draft = {
  merchant: string;
  itemName: string;
  purchaseDate: string;
  totalAmount: string;
  currency: string;
  orderNumber: string;
  deadlineType: (typeof deadlineTypes)[number];
  deadlineDate: string;
  evidence: string;
};

const emptyDraft: Draft = {
  merchant: "",
  itemName: "",
  purchaseDate: "",
  totalAmount: "",
  currency: "USD",
  orderNumber: "",
  deadlineType: "cancellation",
  deadlineDate: "",
  evidence: "Manual deadline from user review"
};

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Server returned ${response.status} ${response.statusText}.`);
  }
}

export function ManualPurchaseForm({ onCreatePurchase }: { onCreatePurchase: (purchase: PurchaseRecord) => void }) {
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(emptyDraft);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function saveManualPurchase() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          ...draft,
          totalAmount: draft.totalAmount === "" ? null : Number(draft.totalAmount),
          purchaseDate: draft.purchaseDate || null,
          deadlineDate: draft.deadlineDate || null
        })
      });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Could not add manual purchase.");
      onCreatePurchase(json.purchase);
      setDraft(emptyDraft);
      setOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not add manual purchase.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Manual deadline</h2>
          <p className="mt-1 text-sm text-stone-600">Add a verified deadline when a document is missing or unclear.</p>
        </div>
        <Button variant={open ? "secondary" : "primary"} className="h-9 px-3" onClick={() => setOpen((value) => !value)}>
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          {open ? "Close" : "Add"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 grid gap-3">
          {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>}
          <label className="text-sm font-medium text-stone-700">
            Merchant
            <Input className="mt-1" value={draft.merchant} onChange={(event) => update("merchant", event.target.value)} />
          </label>
          <label className="text-sm font-medium text-stone-700">
            Item or obligation
            <Input className="mt-1" value={draft.itemName} onChange={(event) => update("itemName", event.target.value)} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Purchase date
              <Input className="mt-1" type="date" value={draft.purchaseDate} onChange={(event) => update("purchaseDate", event.target.value)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Deadline
              <Input className="mt-1" type="date" value={draft.deadlineDate} onChange={(event) => update("deadlineDate", event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <label className="text-sm font-medium text-stone-700">
              Deadline type
              <select
                className="mt-1 h-10 w-full rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
                value={draft.deadlineType}
                onChange={(event) => update("deadlineType", event.target.value as Draft["deadlineType"])}
              >
                {deadlineTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-stone-700">
              Currency
              <Input className="mt-1" value={draft.currency} onChange={(event) => update("currency", event.target.value)} />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-stone-700">
              Amount
              <Input className="mt-1" type="number" step="0.01" value={draft.totalAmount} onChange={(event) => update("totalAmount", event.target.value)} />
            </label>
            <label className="text-sm font-medium text-stone-700">
              Order number
              <Input className="mt-1" value={draft.orderNumber} onChange={(event) => update("orderNumber", event.target.value)} />
            </label>
          </div>
          <label className="text-sm font-medium text-stone-700">
            Evidence or note
            <Input className="mt-1" value={draft.evidence} onChange={(event) => update("evidence", event.target.value)} />
          </label>
          <Button onClick={saveManualPurchase} disabled={saving || (!draft.itemName && !draft.merchant)}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving" : "Save manual deadline"}
          </Button>
        </div>
      )}
    </Card>
  );
}
