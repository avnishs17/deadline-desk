import type { DocumentInput, ExtractorProvider } from "./extractor";

export class OpenAIProvider implements ExtractorProvider {
  providerName = "openai";
  modelName = process.env.OPENAI_MODEL ?? "gpt-5.6";

  async extractPurchaseDocument(_input: DocumentInput): Promise<unknown> {
    throw new Error("OpenAI verifier adapter is intentionally stubbed for MVP. Set ENABLE_OPENAI_VERIFIER=true in a future iteration.");
  }
}
