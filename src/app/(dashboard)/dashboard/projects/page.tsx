import { ProjectsClient } from "@/components/project/ProjectsClient";
import { getWorkspaceBySlug } from "@/services/workspaceService";
import { getProjects } from "@/services/projectService";

export const metadata = {
  title: "Projects | SaaS Project Management",
};

export default async function ProjectsPage() {
  const workspace = await getWorkspaceBySlug("demo-workspace");
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
