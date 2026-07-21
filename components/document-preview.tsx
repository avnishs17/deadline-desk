import { FileText } from "lucide-react";
import { Card } from "./ui";

export function DocumentPreview({ documentName, previewUrl }: { documentName: string; previewUrl?: string | null }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-stone-500" aria-hidden="true" />
        <h2 className="text-base font-semibold">Document preview</h2>
      </div>
      <div className="mt-3 flex min-h-72 items-center justify-center rounded-md border border-stone-200 bg-stone-50 p-3">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="max-h-[520px] w-full rounded-md object-contain" />
        ) : (
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-stone-700">{documentName}</p>
            <p className="mt-1 text-xs text-stone-500">Uploaded document preview is not persisted in local demo mode.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
