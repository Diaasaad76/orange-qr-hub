import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbStore.toggleHistoryFavorite(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
