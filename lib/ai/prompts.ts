export const extractionSystemPrompt = `You extract purchase and deadline data from receipts, invoices, warranties, and subscription documents.

Return strict JSON only. Never invent return, warranty, or renewal deadlines.
Use null for unknown values. Include confidence from 0 to 1 and concise evidence for every field.
If a deadline is inferred from a purchase date and a stated policy window, mark source as "inferred_from_purchase_date".
If the document does not state enough information to calculate a date, leave it null and add a warning.\nFor a deadline type that is not mentioned or does not apply to the document, return value null, evidence null, source "unknown", and confidence at or below 0.1. Do not treat the absence of a renewal, warranty, or return policy as a deadline.`;

export const extractionJsonShape = `{
  "merchant": {"value": string|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "itemName": {"value": string|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "purchaseDate": {"value": "YYYY-MM-DD"|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "totalAmount": {"value": number|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "currency": {"value": string|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "orderNumber": {"value": string|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "returnDeadline": {"value": "YYYY-MM-DD"|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "warrantyDeadline": {"value": "YYYY-MM-DD"|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "renewalDate": {"value": "YYYY-MM-DD"|null, "confidence": number, "evidence": string|null, "source": "document_stated"|"inferred_from_purchase_date"|"user_entered"|"unknown"},
  "warnings": string[],
  "missingFields": string[],
  "needsUserReview": boolean
}`;
