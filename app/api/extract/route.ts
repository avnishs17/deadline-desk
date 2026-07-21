import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { extractPurchaseDocument } from "@/lib/ai/extractor";
import { getSampleDocument } from "@/lib/demo/sample-data";
import { listExtractionRuns, recordExtractionRun } from "@/lib/db/queries";

const allowedTypes = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg"]);
const maxBytes = 8 * 1024 * 1024;

export async function GET() {
  const extractionRuns = await listExtractionRuns();
  return NextResponse.json({ extractionRuns });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const sampleId = formData.get("sampleId");

    if (typeof sampleId === "string" && sampleId) {
      const sample = getSampleDocument(sampleId);
      if (!sample) return NextResponse.json({ error: "Sample document not found." }, { status: 404 });

      const assetPath = path.join(process.cwd(), "public", sample.imageUrl.replace(/^\//, ""));
      const result = await extractPurchaseDocument({
        fileName: sample.fileName,
        mimeType: sample.mimeType,
        data: await readFile(assetPath)
      });

      await recordExtractionRun({ documentName: sample.fileName, provider: result.provider, model: result.model, warnings: result.extraction.warnings, missingFields: result.extraction.missingFields });
      return NextResponse.json({ extractionId: crypto.randomUUID(), documentName: sample.fileName, documentPreviewUrl: sample.imageUrl, provider: result.provider, model: result.model, extraction: result.extraction });
    }

    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload a PDF, JPG, or PNG document." }, { status: 400 });
    if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Unsupported file type. Use PDF, JPG, or PNG." }, { status: 400 });
    if (file.size > maxBytes) return NextResponse.json({ error: "File is too large. Use a file under 8 MB." }, { status: 400 });

    const result = await extractPurchaseDocument({ fileName: file.name, mimeType: file.type, data: Buffer.from(await file.arrayBuffer()) });
    await recordExtractionRun({ documentName: file.name, provider: result.provider, model: result.model, warnings: result.extraction.warnings, missingFields: result.extraction.missingFields });
    return NextResponse.json({ extractionId: crypto.randomUUID(), documentName: file.name, documentPreviewUrl: null, provider: result.provider, model: result.model, extraction: result.extraction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Extraction failed.";
    return NextResponse.json({ error: "Extraction failed. Check the configured AI provider and try again.", detail: message }, { status: 500 });
  }
}
