import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getCurrentSubscription } from "@/services/billingService";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;
    const subscription = await getCurrentSubscription(workspaceId);

    return NextResponse.json(subscription);
  } catch (error: any) {
    console.error("Failed to fetch billing:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
