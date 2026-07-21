"use client";

import { AlertTriangle, Save } from "lucide-react";
import type { ExtractionResult } from "@/lib/ai/extraction-schema";
import { ConfidenceBadge } from "./confidence-badge";
import { Button, Card, Input } from "./ui";
import { VerificationReport } from "./verification-report";
import { DocumentPreview } from "./document-preview";

type FieldName = keyof Omit<ExtractionResult, "warnings" | "missingFields" | "needsUserReview">;

const purchaseFields: { name: FieldName; label: string; type: "text" | "date" | "number" }[] = [
  { name: "merchant", label: "Merchant", type: "text" },
  { name: "itemName", label: "Item name", type: "text" },
  { name: "purchaseDate", label: "Purchase date", type: "date" },
  { name: "totalAmount", label: "Total amount", type: "number" },
  { name: "currency", label: "Currency", type: "text" },
  { name: "orderNumber", label: "Order number", type: "text" }
];

const deadlineFields: { name: "returnDeadline" | "warrantyDeadline" | "renewalDate"; label: string; type: "date" }[] = [
  { name: "returnDeadline", label: "Return deadline", type: "date" },
  { name: "warrantyDeadline", label: "Warranty deadline", type: "date" },
  { name: "renewalDate", label: "Renewal date", type: "date" }
];

type Props = {
  documentName: string;
  extraction: ExtractionResult;
  provider: string;
  model: string;
  documentPreviewUrl?: string | null;
  saving: boolean;
  onChange: (next: ExtractionResult) => void;
  onSave: () => void;
};

export function ExtractionReviewForm({ documentName, extraction, provider, model, documentPreviewUrl, saving, onChange, onSave }: Props) {
  function updateField(name: FieldName, value: string) {
    const current = extraction[name];
    const nextValue = name === "totalAmount" ? (value === "" ? null : Number(value)) : value === "" ? null : value;
    onChange({
      ...extraction,
      [name]: {
        ...current,
        value: nextValue,
        source: current.value === nextValue ? current.source : "user_entered",
        confidence: current.value === nextValue ? current.confidence : 1
      },
      needsUserReview: true
    });
  }

  const relevantDeadlineFields = deadlineFields.filter(({ name }) => {
    const field = extraction[name];
    return field.value !== null || field.evidence !== null || field.source === "inferred_from_purchase_date";
  });
  const fields = [...purchaseFields, ...relevantDeadlineFields];

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <DocumentPreview documentName={documentName} previewUrl={documentPreviewUrl} />
        <VerificationReport extraction={extraction} provider={provider} model={model} />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Review extracted fields</h2>
          <p className="mt-1 text-sm text-stone-600">
            {documentName} via {provider} / {model}
          </p>
        </div>
        <Button onClick={onSave} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" />
          {saving ? "Saving" : "Save verified purchase"}
        </Button>
        </div>

        {(extraction.warnings.length > 0 || extraction.missingFields.length > 0) && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Verify before saving
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {extraction.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
            {extraction.missingFields.length > 0 && <li>Missing: {extraction.missingFields.join(", ")}</li>}
          </ul>
        </div>
        )}

        {relevantDeadlineFields.length > 0 && <p className="mt-5 text-sm font-medium text-stone-700">Detected deadline fields</p>}
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const extracted = extraction[field.name];
          const value = extracted.value ?? "";
          return (
            <label key={field.name} className="block rounded-md border border-stone-200 bg-stone-50 p-3">
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-800">{field.label}</span>
                <ConfidenceBadge confidence={extracted.confidence} />
              </span>
              <Input
                className="mt-2 bg-white"
                type={field.type}
                value={value}
                step={field.type === "number" ? "0.01" : undefined}
                onChange={(event) => updateField(field.name, event.target.value)}
              />
              <span className="mt-2 block min-h-10 text-xs text-stone-500">
                {extracted.evidence ? `Evidence: ${extracted.evidence}` : "No evidence found in document."}
              </span>
              <span className="mt-1 block text-xs text-stone-500">Source: {extracted.source.replaceAll("_", " ")}</span>
            </label>
          );
        })}
        </div>
        {relevantDeadlineFields.length === 0 && <p className="mt-4 rounded-md border border-dashed border-[#c7ccc0] bg-[#f4f6f0] p-3 text-sm text-stone-600">No return, warranty, or renewal deadline was found in this document.</p>}
      </Card>
    </div>
  );
}
