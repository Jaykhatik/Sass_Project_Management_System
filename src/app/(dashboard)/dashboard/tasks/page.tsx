import { getPrimaryWorkspaceForUser, getSessionUser } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { MyTasksClient } from "./MyTasksClient";
import { Suspense } from "react";

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
          <p className="text-muted-foreground">
            You need a workspace to view tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-8 md:mb-10 flex flex-col items-center text-center animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 drop-shadow-sm pb-2">
          My Tasks
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md text-sm md:text-base leading-relaxed">
          View and manage all tasks assigned to you across the workspace.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        }
      >
        <MyTasksClient workspaceId={workspace.id} userId={user.id} />
      </Suspense>
    </div>
  );
}
