import type { ExtractionRunRecord } from "@/lib/db/schema";
import { Card } from "./ui";

export function ExtractionHistory({ runs }: { runs: ExtractionRunRecord[] }) {
  return (
    <Card className="p-4">
      <h2 className="text-base font-semibold">Extraction history</h2>
      <p className="mt-1 text-sm text-stone-600">Recent provider/model runs and validation warnings.</p>
      <div className="mt-4 grid gap-3">
        {runs.length === 0 ? (
          <div className="rounded-md border border-dashed border-stone-300 bg-stone-50 p-3 text-sm text-stone-500">No extraction runs yet.</div>
        ) : (
          runs.slice(0, 5).map((run) => (
            <div key={run.id} className="rounded-md border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-stone-800">{run.documentName}</p>
                <span className="text-xs text-stone-500">{new Date(run.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="mt-1 text-xs text-stone-500">{run.provider} / {run.model}</p>
              <p className="mt-2 text-xs text-stone-600">Warnings: {run.warnings.length} · Missing: {run.missingFields.length}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
