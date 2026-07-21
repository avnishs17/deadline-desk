import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Store } from "./schema";

const storePath = path.join(process.cwd(), "data", "demo-store.json");
const initialStore: Store = { purchases: [], reminderLog: [], extractionRuns: [] };

function isStore(value: unknown): value is Store {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as Store).purchases) &&
    Array.isArray((value as Store).reminderLog)
  );
}

export async function readStore(): Promise<Store> {
  try {
    const content = await readFile(storePath, "utf8");
    const parsed = JSON.parse(content) as unknown;
    if (!isStore(parsed)) return initialStore;
    return {
      purchases: parsed.purchases,
      reminderLog: parsed.reminderLog,
      extractionRuns: Array.isArray(parsed.extractionRuns) ? parsed.extractionRuns : []
    };
  } catch {
    return initialStore;
  }
}

export async function writeStore(store: Store) {
  await mkdir(path.dirname(storePath), { recursive: true });
  const tempPath = `${storePath}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2));
  await rename(tempPath, storePath);
}
