import { normalizeExtraction } from "./normalize-extraction";
import { createProvider } from "./provider";

export type DocumentInput = {
  fileName: string;
  mimeType: string;
  data: Buffer | string;
};

export type ExtractorProvider = {
  providerName: string;
  modelName: string;
  extractPurchaseDocument(input: DocumentInput): Promise<unknown>;
};

export async function extractPurchaseDocument(input: DocumentInput) {
  const provider = createProvider();
  const raw = await provider.extractPurchaseDocument(input);
  return {
    provider: provider.providerName,
    model: provider.modelName,
    raw,
    extraction: normalizeExtraction(raw)
  };
}
