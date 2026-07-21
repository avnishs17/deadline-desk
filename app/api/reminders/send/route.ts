import { NextResponse } from "next/server";
import { listReminderLog, sendDemoReminder } from "@/lib/db/queries";

export async function GET() {
  try {
    const reminderLog = await listReminderLog();
    return NextResponse.json({ reminderLog });
  } catch {
    return NextResponse.json({ reminderLog: [], warning: "Reminder log was reset for the demo workspace." });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.deadlineId !== "string") {
      return NextResponse.json({ error: "deadlineId is required." }, { status: 400 });
    }
    const log = await sendDemoReminder(body.deadlineId);
    return NextResponse.json({ log });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Reminder failed.";
    return NextResponse.json({ error: "Could not send demo reminder.", detail }, { status: 400 });
  }
}
