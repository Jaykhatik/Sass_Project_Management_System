import { notFound, redirect } from "next/navigation";
import { InviteClient } from "./InviteClient";
import { getSessionUser } from "@/lib/auth";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const user = await getSessionUser();

  // Pass authentication state to the client component instead of redirecting
  return <InviteClient token={token} isAuthenticated={!!user} userEmail={user?.email} />;
}
