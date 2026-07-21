import { z } from "zod";

export const deadlineSourceSchema = z.enum([
  "document_stated",
  "inferred_from_purchase_date",
  "user_entered",
  "unknown"
]);

const confidenceSchema = z.coerce.number().min(0).max(1).catch(0);

export const stringFieldSchema = z.object({
  value: z.preprocess((value) => (value === "" ? null : value), z.string().trim().min(1).nullable()),
  confidence: confidenceSchema,
  evidence: z.preprocess((value) => (value === "" ? null : value), z.string().trim().nullable()),
  source: deadlineSourceSchema.catch("unknown")
});

export const numberFieldSchema = z.object({
  value: z.preprocess((value) => (value === "" ? null : value), z.coerce.number().finite().nullable()),
  confidence: confidenceSchema,
  evidence: z.preprocess((value) => (value === "" ? null : value), z.string().trim().nullable()),
  source: deadlineSourceSchema.catch("unknown")
});

export const extractionResultSchema = z.object({
  merchant: stringFieldSchema,
  itemName: stringFieldSchema,
  purchaseDate: stringFieldSchema,
  totalAmount: numberFieldSchema,
  currency: stringFieldSchema,
  orderNumber: stringFieldSchema,
  returnDeadline: stringFieldSchema,
  warrantyDeadline: stringFieldSchema,
  renewalDate: stringFieldSchema,
  warnings: z.array(z.string()).default([]),
  missingFields: z.array(z.string()).default([]),
  needsUserReview: z.boolean().default(true)
});

export type DeadlineSource = z.infer<typeof deadlineSourceSchema>;
export type FieldExtraction<T> = {
  value: T | null;
  confidence: number;
  evidence: string | null;
  source: DeadlineSource;
};
export type ExtractionResult = z.infer<typeof extractionResultSchema>;
