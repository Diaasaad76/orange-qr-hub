import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export async function GET() {
  try {
    const items = await dbStore.getHistory();
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await dbStore.addHistory(body);
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
