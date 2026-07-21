import { NextResponse } from "next/server";
import { extractionResultSchema } from "@/lib/ai/extraction-schema";
import { normalizeExtraction } from "@/lib/ai/normalize-extraction";
import { createManualPurchase, deletePurchase, listPurchases, savePurchaseFromExtraction, updatePurchase } from "@/lib/db/queries";

export async function GET() {
  try {
    const purchases = await listPurchases();
    return NextResponse.json({ purchases });
  } catch {
    return NextResponse.json({ purchases: [], warning: "Purchase store was reset for the demo workspace." });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.mode === "manual") {
      const purchase = await createManualPurchase({
        merchant: body.merchant ?? null,
        itemName: body.itemName ?? null,
        purchaseDate: body.purchaseDate ?? null,
        totalAmount: body.totalAmount ?? null,
        currency: body.currency ?? null,
        orderNumber: body.orderNumber ?? null,
        deadlineType: body.deadlineType ?? "other",
        deadlineDate: body.deadlineDate ?? null,
        evidence: body.evidence ?? null
      });
      return NextResponse.json({ purchase }, { status: 201 });
    }

    const documentName = typeof body.documentName === "string" ? body.documentName : "verified-document";
    const parsed = extractionResultSchema.parse(body.extraction);
    const purchase = await savePurchaseFromExtraction(documentName, normalizeExtraction(parsed));
    return NextResponse.json({ purchase }, { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid purchase payload.";
    return NextResponse.json({ error: "Could not save verified purchase.", detail }, { status: 400 });
  }
}


export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.id !== "string") {
      return NextResponse.json({ error: "Purchase id is required." }, { status: 400 });
    }

    const purchase = await updatePurchase({
      id: body.id,
      merchant: body.merchant ?? null,
      itemName: body.itemName ?? null,
      purchaseDate: body.purchaseDate ?? null,
      totalAmount: body.totalAmount ?? null,
      currency: body.currency ?? null,
      orderNumber: body.orderNumber ?? null,
      deadlines: Array.isArray(body.deadlines) ? body.deadlines : []
    });

    return NextResponse.json({ purchase });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid purchase update.";
    return NextResponse.json({ error: "Could not update purchase.", detail }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Purchase id is required." }, { status: 400 });
    }

    const deleted = await deletePurchase(id);
    return NextResponse.json({ deleted });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid delete request.";
    return NextResponse.json({ error: "Could not delete purchase.", detail }, { status: 400 });
  }
}
