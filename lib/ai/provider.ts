import { CerebrasProvider } from "./cerebras-provider";
import { OpenAIProvider } from "./openai-provider";
import type { ExtractorProvider } from "./extractor";

export function createProvider(): ExtractorProvider {
  const provider = process.env.AI_PROVIDER ?? "cerebras";

  if (provider === "cerebras") {
    if (!process.env.CEREBRAS_API_KEY) {
      throw new Error("CEREBRAS_API_KEY is required. Configure Cerebras before extracting an upload or sample document.");
    }
    return new CerebrasProvider();
  }

  if (provider === "openai") return new OpenAIProvider();

  throw new Error(`Unsupported AI_PROVIDER: ${provider}`);
}
