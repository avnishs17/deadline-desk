"use client";

import * as React from "react";
import { Database, Trash2 } from "lucide-react";
import { Button, Card } from "./ui";

async function readJson(response: Response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

export function DemoControls({ onChange }: { onChange: () => void }) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function clear() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "clear" }) });
      const json = await readJson(response);
      if (!response.ok) throw new Error(json.error ?? "Workspace action failed.");
      onChange();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Workspace action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="border-[#dfe2db] bg-[#f4f6f0] p-4 shadow-none">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-stone-700"><Database className="h-4 w-4" aria-hidden="true" /></div>
        <div><h2 className="text-base font-semibold">Workspace data</h2><p className="mt-1 text-sm text-stone-600">Clear saved purchases and extraction history before a fresh demo.</p></div>
      </div>
      {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-800">{error}</div>}
      <Button variant="danger" className="mt-4 h-9 px-3" onClick={clear} disabled={busy}><Trash2 className="h-4 w-4" aria-hidden="true" />{busy ? "Clearing" : "Clear workspace"}</Button>
    </Card>
  );
}
