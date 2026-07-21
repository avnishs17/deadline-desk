import { ExtractionResult, extractionResultSchema } from "./extraction-schema";
import { normalizeIsoDate } from "@/lib/dates/deadlines";

const dateFields = ["purchaseDate", "returnDeadline", "warrantyDeadline", "renewalDate"] as const;

export function normalizeExtraction(input: unknown): ExtractionResult {
  const parsed = extractionResultSchema.parse(input);
  const warnings = new Set(parsed.warnings);
  const missingFields = new Set(parsed.missingFields);

  for (const field of dateFields) {
    const original = parsed[field].value;
    const normalized = normalizeIsoDate(original);
    parsed[field].value = normalized;
    if (original && !normalized) {
      parsed[field].confidence = Math.min(parsed[field].confidence, 0.2);
      warnings.add(`${field} could not be normalized to YYYY-MM-DD.`);
      missingFields.add(field);
    }
  }

  for (const [fieldName, field] of Object.entries(parsed)) {
    if (typeof field === "object" && field && "value" in field && field.value === null) {
      missingFields.add(fieldName);
    }
  }

  if (parsed.returnDeadline.value === null && parsed.warrantyDeadline.value === null && parsed.renewalDate.value === null) {
    warnings.add("No return, warranty, or renewal deadline found. Verify manually before saving.");
  }

  parsed.currency.value = parsed.currency.value?.toUpperCase() ?? null;
  parsed.warnings = Array.from(warnings);
  parsed.missingFields = Array.from(missingFields);
  parsed.needsUserReview = true;
  return parsed;
}
