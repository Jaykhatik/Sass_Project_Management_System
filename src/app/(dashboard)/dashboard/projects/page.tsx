import { ProjectsClient } from "@/components/project/ProjectsClient";
import { getProjects } from "@/services/projectService";
import { getPrimaryWorkspaceForUser, getSessionUser } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Projects | SaaS Project Management",
};

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  const projects = await getProjects(workspace.id);

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProjectsClient
        projects={projects as unknown as Parameters<typeof ProjectsClient>[0]["projects"]}
        workspaceId={workspace.id}
      />
    </div>
  );
}
