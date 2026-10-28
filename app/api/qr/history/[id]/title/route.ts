import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    await dbStore.updateHistoryTitle(id, body.title || "");
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
