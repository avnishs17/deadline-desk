"use client";

import * as React from "react";
import { LayoutList, Upload } from "lucide-react";
import type { ExtractionResult } from "@/lib/ai/extraction-schema";
import type { ExtractionRunRecord, PurchaseRecord } from "@/lib/db/schema";
import { AppShell } from "@/components/app-shell";
import { DeadlineDashboard } from "@/components/deadline-dashboard";
import { ExtractionReviewForm } from "@/components/extraction-review-form";
import { UploadZone } from "@/components/upload-zone";
import { WorkspaceOverview } from "@/components/workspace-overview";

type ExtractResponse = { documentName: string; provider: string; model: string; extraction: ExtractionResult; documentPreviewUrl?: string | null };
type ReminderLog = { id: string; message: string; sentAt: string };
type WorkspaceView = "dashboard" | "capture";

async function readJson(response: Response) {
  const text = await response.text();
  try { return text ? JSON.parse(text) : {}; } catch { throw new Error(`Server returned ${response.status} ${response.statusText}. Restart the dev server and try again.`); }
}

export default function HomePage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [current, setCurrent] = React.useState<ExtractResponse | null>(null);
  const [purchases, setPurchases] = React.useState<PurchaseRecord[]>([]);
  const [reminderLog, setReminderLog] = React.useState<ReminderLog[]>([]);
  const [extractionRuns, setExtractionRuns] = React.useState<ExtractionRunRecord[]>([]);
  const [view, setView] = React.useState<WorkspaceView>("dashboard");

  const refresh = React.useCallback(async () => {
    const [purchaseRes, reminderRes, extractionRes] = await Promise.all([fetch("/api/purchases"), fetch("/api/reminders/send"), fetch("/api/extract")]);
    const purchaseJson = await readJson(purchaseRes);
    const reminderJson = await readJson(reminderRes);
    const extractionJson = await readJson(extractionRes);
    setPurchases(purchaseJson.purchases ?? []);
    setReminderLog(reminderJson.reminderLog ?? []);
    setExtractionRuns(extractionJson.extractionRuns ?? []);
  }, []);

  React.useEffect(() => { refresh().catch(() => setError("Could not load saved demo data.")); }, [refresh]);

  async function extract(formData: FormData) {
    setLoading(true); setError(null);
    try {
      const response = await fetch("/api/extract", { method: "POST", body: formData });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Extraction failed.");
      setCurrent(json);
    } catch (extractError) { setError(extractError instanceof Error ? extractError.message : "Extraction failed."); } finally { setLoading(false); }
  }

  async function extractFile() { if (!file) return; const formData = new FormData(); formData.append("file", file); await extract(formData); }
  async function selectSample(sampleId: string) { const formData = new FormData(); formData.append("sampleId", sampleId); await extract(formData); }

  async function savePurchase() {
    if (!current) return;
    setSaving(true); setError(null);
    try {
      const response = await fetch("/api/purchases", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentName: current.documentName, extraction: current.extraction }) });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Could not save purchase.");
      setCurrent(null); setFile(null); await refresh(); setView("dashboard");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Could not save purchase."); } finally { setSaving(false); }
  }

  function createSavedPurchase(created: PurchaseRecord) { setPurchases((records) => [created, ...records]); refresh().catch(() => setError("Could not refresh saved demo data.")); }
  function updateSavedPurchase(updated: PurchaseRecord) { setPurchases((records) => records.map((purchase) => purchase.id === updated.id ? updated : purchase)); }
  function deleteSavedPurchase(purchaseId: string) { setPurchases((records) => records.filter((purchase) => purchase.id !== purchaseId)); refresh().catch(() => setError("Could not refresh saved demo data.")); }

  async function sendReminder(deadlineId: string) {
    setError(null);
    const response = await fetch("/api/reminders/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deadlineId }) });
    if (!response.ok) { setError("Could not send demo reminder."); return; }
    await refresh();
  }

  return (
    <AppShell>
      <div className="grid gap-5">
        <nav className="sticky top-3 z-10 flex w-fit rounded-lg border border-[#d4d8cf] bg-[#fbfcf8]/95 p-1 shadow-sm backdrop-blur" aria-label="Workspace view">
          <ViewButton active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<LayoutList className="h-4 w-4" />}>Dashboard</ViewButton>
          <ViewButton active={view === "capture"} onClick={() => setView("capture")} icon={<Upload className="h-4 w-4" />}>Add document</ViewButton>
        </nav>

        {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

        {view === "dashboard" ? <>
          <WorkspaceOverview purchases={purchases} />
          <DeadlineDashboard purchases={purchases} reminderLog={reminderLog} extractionRuns={extractionRuns} onSendReminder={sendReminder} onUpdatePurchase={updateSavedPurchase} onDeletePurchase={deleteSavedPurchase} onCreatePurchase={createSavedPurchase} onWorkspaceChange={refresh} onOpenCapture={() => setView("capture")} />
        </> : <section className="grid gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#657544]">Add a source</p><h2 className="mt-1 text-2xl font-semibold text-[#202622]">Review it before it reaches your tracker.</h2></div><button className="text-sm font-medium text-stone-600 hover:text-[#202622]" onClick={() => setView("dashboard")}>Back to dashboard</button></div>
          <UploadZone file={file} loading={loading} onFileChange={setFile} onExtractFile={extractFile} onSelectSample={selectSample} />
          {current && <ExtractionReviewForm documentName={current.documentName} provider={current.provider} model={current.model} extraction={current.extraction} documentPreviewUrl={current.documentPreviewUrl} saving={saving} onChange={(extraction) => setCurrent({ ...current, extraction })} onSave={savePurchase} />}
        </section>}
      </div>
    </AppShell>
  );
}

function ViewButton({ active, icon, children, onClick }: { active: boolean; icon: React.ReactNode; children: React.ReactNode; onClick: () => void }) {
  return <button className={active ? "inline-flex h-9 items-center gap-2 rounded-md bg-[#202622] px-3 text-sm font-medium text-white" : "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-stone-600 hover:bg-[#edf0e8]"} onClick={onClick}>{icon}{children}</button>;
}
