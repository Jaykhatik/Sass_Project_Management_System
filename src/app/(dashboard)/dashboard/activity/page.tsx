import { getPrimaryWorkspaceForUser, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ActivityClient } from "./ActivityClient";

export const metadata = {
  title: "Activity Feed - Project Management",
};

export default async function ActivityPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center text-muted-foreground">No Workspace Found</div>
      </div>
    );
  }

  return <ActivityClient workspaceId={workspace.id} />;
}
