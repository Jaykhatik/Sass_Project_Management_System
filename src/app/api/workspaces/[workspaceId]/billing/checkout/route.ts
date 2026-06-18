import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createCheckoutSession } from "@/services/billingService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { workspaceId } = await params;
    const url = await createCheckoutSession(workspaceId, user.id);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
