import { NextResponse } from "next/server";
import { clearDemoWorkspace } from "@/lib/db/queries";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action !== "clear") return NextResponse.json({ error: "Unknown workspace action." }, { status: 400 });
    await clearDemoWorkspace();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Workspace action failed.";
    return NextResponse.json({ error: "Could not clear the workspace.", detail }, { status: 400 });
  }
}
