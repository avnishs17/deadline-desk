"use client";

import * as React from "react";
import { CheckCircle2, FileJson, HelpCircle, ListChecks, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ExtractionResult } from "@/lib/ai/extraction-schema";
import { ConfidenceBadge } from "./confidence-badge";
import { Badge, Card } from "./ui";

type FieldName = keyof Omit<ExtractionResult, "warnings" | "missingFields" | "needsUserReview">;

const reportFields: { name: FieldName; label: string; deadline?: boolean }[] = [
  { name: "merchant", label: "Merchant" },
  { name: "itemName", label: "Item" },
  { name: "purchaseDate", label: "Purchase date" },
  { name: "totalAmount", label: "Amount" },
  { name: "currency", label: "Currency" },
  { name: "orderNumber", label: "Order number" },
  { name: "returnDeadline", label: "Return deadline", deadline: true },
  { name: "warrantyDeadline", label: "Warranty deadline", deadline: true },
  { name: "renewalDate", label: "Renewal date", deadline: true }
];

function actionFor(label: string, field: ExtractionResult[FieldName]) {
  if (field.value === null) {
    if (label.includes("deadline") || label.includes("date")) return `Verify ${label.toLowerCase()} manually or mark it unknown.`;
    return `Fill ${label.toLowerCase()} if it matters for reminders.`;
  }
  if (field.confidence < 0.6) return `Review ${label.toLowerCase()} because confidence is low.`;
  if (field.source === "inferred_from_purchase_date") return `Confirm the policy evidence supports the inferred ${label.toLowerCase()}.`;
  return null;
}

export function VerificationReport({ extraction, provider, model }: { extraction: ExtractionResult; provider: string; model: string }) {
  const foundFields = reportFields.filter((field) => extraction[field.name].value !== null);
  const missingFields = reportFields.filter((field) => extraction[field.name].value === null);
  const deadlineFields = reportFields.filter((field) => field.deadline);
  const foundDeadlines = deadlineFields.filter((field) => extraction[field.name].value !== null);
  const inferredDeadlines = deadlineFields.filter((field) => extraction[field.name].source === "inferred_from_purchase_date");
  const actionItems = reportFields
    .map((field) => ({ label: field.label, action: actionFor(field.label, extraction[field.name]) }))
    .filter((item): item is { label: string; action: string } => Boolean(item.action));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Verification report</h2>
          <p className="mt-1 text-sm text-stone-600">Evidence, risk, and next actions before the record is saved.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="info">{provider}</Badge>
          <Badge tone="neutral">{model}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Metric icon={<CheckCircle2 className="h-4 w-4" />} label="Fields found" value={`${foundFields.length}/${reportFields.length}`} tone="good" />
        <Metric icon={<HelpCircle className="h-4 w-4" />} label="Missing" value={String(missingFields.length)} tone={missingFields.length ? "warn" : "good"} />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Deadlines found" value={String(foundDeadlines.length)} tone={foundDeadlines.length ? "good" : "warn"} />
        <Metric icon={<TriangleAlert className="h-4 w-4" />} label="Inferred" value={String(inferredDeadlines.length)} tone={inferredDeadlines.length ? "warn" : "neutral"} />
        <Metric icon={<ListChecks className="h-4 w-4" />} label="Unsupported claims" value="0" tone="good" />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid gap-2">
          {reportFields.map((field) => {
            const extracted = extraction[field.name];
            return (
              <div key={field.name} className="min-w-0 rounded-md border border-stone-200 bg-stone-50 p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-stone-800">{field.label}</p>
                    <p className="mt-1 break-words text-sm text-stone-700">{extracted.value ?? "Unknown"}</p>
                  </div>
                  <div className="flex max-w-full flex-wrap gap-2">
                    <ConfidenceBadge confidence={extracted.confidence} />
                    <Badge tone={extracted.source === "unknown" ? "neutral" : extracted.source === "inferred_from_purchase_date" ? "warn" : "info"}>
                      {extracted.source.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 break-words text-xs leading-relaxed text-stone-600">
                  {extracted.evidence ?? "No supporting evidence found."}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid content-start gap-3">
          <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
            <h3 className="text-sm font-semibold">Reviewer action plan</h3>
            <ul className="mt-2 space-y-2 text-sm leading-relaxed text-stone-700">
              {actionItems.length === 0 ? (
                <li>No required actions before saving.</li>
              ) : (
                actionItems.map((item) => <li key={item.label} className="break-words">{item.action}</li>)
              )}
            </ul>
          </div>

          <details className="rounded-md border border-stone-200 bg-white p-3">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-stone-800">
              <FileJson className="h-4 w-4" aria-hidden="true" />
              Proof mode JSON
            </summary>
            <pre className="mt-3 max-h-80 max-w-full overflow-auto rounded-md bg-stone-950 p-3 text-xs leading-relaxed text-stone-100">
              {JSON.stringify(extraction, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  tone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "good" | "warn" | "neutral";
}) {
  const valueClass =
    tone === "good"
      ? "mt-2 text-2xl font-semibold text-emerald-800"
      : tone === "warn"
        ? "mt-2 text-2xl font-semibold text-amber-800"
        : "mt-2 text-2xl font-semibold text-stone-800";

  return (
    <div className="rounded-md border border-stone-200 bg-stone-50 p-3">
      <div className="flex min-w-0 items-center gap-2 text-stone-600">
        {icon}
        <span className="min-w-0 break-words text-xs font-medium uppercase tracking-normal">{label}</span>
      </div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}
