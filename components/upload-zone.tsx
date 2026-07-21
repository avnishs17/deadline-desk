"use client";

import { FileUp, Loader2, ReceiptText } from "lucide-react";
import { sampleDocuments } from "@/lib/demo/sample-data";
import { Button, Card } from "./ui";

type Props = {
  file: File | null;
  loading: boolean;
  onFileChange: (file: File | null) => void;
  onExtractFile: () => void;
  onSelectSample: (sampleId: string) => void;
};

export function UploadZone({ file, loading, onFileChange, onExtractFile, onSelectSample }: Props) {
  return (
    <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#eef2df] text-[#53642f]">
            <FileUp className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">Upload document</h2>
            <p className="mt-1 break-words text-sm leading-relaxed text-stone-600">PDF, JPG, or PNG. Runtime extraction stays server-side.</p>
          </div>
        </div>
        <label className="mt-5 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-4 text-center transition hover:border-[#657544] hover:bg-[#f5f8eb]">
          <ReceiptText className="h-8 w-8 text-stone-500" aria-hidden="true" />
          <span className="mt-3 max-w-full break-words text-sm font-medium text-stone-900">{file ? file.name : "Choose a purchase document"}</span>
          <span className="mt-1 text-xs text-stone-500">Up to 8 MB</span>
          <input
            className="sr-only"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onExtractFile} disabled={!file || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
            Extract
          </Button>
          <Button type="button" variant="secondary" onClick={() => onFileChange(null)} disabled={!file || loading}>
            Clear
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold">Sample library</h2>
            <p className="mt-1 text-sm text-stone-600">Curated cases for returns, warranties, renewals, and missing evidence.</p>
          </div>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">{sampleDocuments.length} samples</span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {sampleDocuments.map((sample) => (
            <button
              key={sample.id}
              className="grid min-w-0 grid-cols-[64px_minmax(0,1fr)] gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-left transition hover:border-[#657544] hover:bg-white hover:shadow-sm disabled:opacity-60"
              onClick={() => onSelectSample(sample.id)}
              disabled={loading}
            >
              <img src={sample.imageUrl} alt="" className="h-20 w-16 rounded-md border border-stone-200 bg-white object-cover" />
              <span className="min-w-0">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="min-w-0 break-words text-sm font-semibold leading-snug text-stone-950">{sample.title}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-stone-600 ring-1 ring-stone-200">{sample.kind}</span>
                </span>
                <span className="mt-1 line-clamp-3 block break-words text-sm leading-snug text-stone-600">{sample.summary}</span>
                <span className="mt-2 block text-xs font-medium text-[#53642f]">Open sample</span>
              </span>
            </button>
          ))}
        </div>
      </Card>
    </section>
  );
}
