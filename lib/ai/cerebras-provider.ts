import type { DocumentInput, ExtractorProvider } from "./extractor";
import { extractionJsonShape, extractionSystemPrompt } from "./prompts";

export class CerebrasProvider implements ExtractorProvider {
  providerName = "cerebras";
  modelName = process.env.CEREBRAS_MODEL ?? "gemma-4-31b";

  async extractPurchaseDocument(input: DocumentInput): Promise<unknown> {
    const key = process.env.CEREBRAS_API_KEY;
    if (!key) throw new Error("CEREBRAS_API_KEY is required");

    const base64 = Buffer.isBuffer(input.data) ? input.data.toString("base64") : Buffer.from(input.data).toString("base64");
    const text = `Extract purchase deadline data from ${input.fileName} (${input.mimeType}). Respond with this JSON shape:\n${extractionJsonShape}`;

    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: this.modelName,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: extractionSystemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text },
              { type: "image_url", image_url: { url: `data:${input.mimeType};base64,${base64}` } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Cerebras extraction failed: ${response.status} ${body.slice(0, 240)}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("Cerebras response did not include JSON content");
    }

    return JSON.parse(content);
  }
}
