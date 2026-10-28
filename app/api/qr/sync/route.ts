import { NextResponse } from "next/server";
import { dbStore } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token") || req.headers.get("x-sync-token");
    const expectedSecret = process.env.SYNC_SECRET;

    if (expectedSecret && token !== expectedSecret) {
      return NextResponse.json({ detail: "Unauthorized sync request" }, { status: 401 });
    }

    const history = await dbStore.getHistory();
    const templates = await dbStore.getTemplates();
    const surveys = await dbStore.getSurveys();

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      count: history.length,
      history,
      templates,
      surveys,
    });
  } catch (error: any) {
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
