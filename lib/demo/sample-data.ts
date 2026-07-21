export type SampleDocument = {
  id: string;
  title: string;
  merchant: string;
  fileName: string;
  mimeType: "image/png";
  kind: string;
  summary: string;
  imageUrl: string;
};

export const sampleDocuments: SampleDocument[] = [
  { id: "clear-receipt", title: "Clear retail receipt", merchant: "Northline Audio", fileName: "clear-receipt.png", mimeType: "image/png", kind: "Receipt", summary: "Headphones with a stated 30-day return window and one-year warranty.", imageUrl: "/samples/clear-receipt.png" },
  { id: "invoice-no-policy", title: "Invoice without return terms", merchant: "Atlas Office Supply", fileName: "invoice-no-policy.png", mimeType: "image/png", kind: "Invoice", summary: "A clean invoice that does not include return or warranty terms.", imageUrl: "/samples/invoice-no-policy.png" },
  { id: "explicit-return-by", title: "Order page with return-by date", merchant: "Harbor Home", fileName: "explicit-return-by.png", mimeType: "image/png", kind: "Order", summary: "Order confirmation with an explicit return-by deadline.", imageUrl: "/samples/explicit-return-by.png" },
  { id: "warranty-card", title: "Warranty card", merchant: "Mistral Appliances", fileName: "warranty-card.png", mimeType: "image/png", kind: "Warranty", summary: "Warranty document with a stated coverage expiration date.", imageUrl: "/samples/warranty-card.png" },
  { id: "final-sale", title: "Final sale receipt", merchant: "Oak & Thread", fileName: "final-sale.png", mimeType: "image/png", kind: "Receipt", summary: "Receipt states final sale, so no return deadline is invented.", imageUrl: "/samples/final-sale.png" },
  { id: "subscription-renewal", title: "Subscription receipt", merchant: "PixelCloud Studio", fileName: "subscription-renewal.png", mimeType: "image/png", kind: "Subscription", summary: "Annual creative plan with a renewal date and no return deadline.", imageUrl: "/samples/subscription-renewal.png" }
];

export function getSampleDocument(id: string) {
  return sampleDocuments.find((sample) => sample.id === id) ?? null;
}
