import { getPrimaryWorkspaceForUser, getSessionUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { MyTasksClient } from "./MyTasksClient";

export const metadata = {
  title: "My Tasks | SaaS Project Management",
};

export default async function MyTasksPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const workspace = await getPrimaryWorkspaceForUser(user.id);
  
  if (!workspace) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">No Workspace Found</h2>
          <p className="text-muted-foreground">You need a workspace to view tasks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all tasks assigned to you across the workspace.
        </p>
      </div>

      <MyTasksClient workspaceId={workspace.id} userId={user.id} />
    </div>
  );
}
