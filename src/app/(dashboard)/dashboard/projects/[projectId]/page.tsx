import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/project/ProjectDetailClient";
import { getWorkspaceBySlug } from "@/services/workspaceService";
import { getProject } from "@/services/projectService";

interface Props {
  params: Promise<{ projectId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { projectId } = await params;
  try {
    const workspace = await getWorkspaceBySlug("demo-workspace");
    const project = await getProject(workspace.id, projectId);
    return { title: `${project.name} | SaaS Project Management` };
  } catch {
    return { title: "Project" };
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { projectId } = await params;
  const workspace = await getWorkspaceBySlug("demo-workspace");

  let project;
  try {
    project = await getProject(workspace.id, projectId);
  } catch {
    notFound();
  }

  return (
    <div className="max-w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProjectDetailClient project={project as Parameters<typeof ProjectDetailClient>[0]["project"]} />
    </div>
  );
}
