import { MemberList } from './MemberList';
import { getPrimaryWorkspaceForUser, getSessionUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import prisma from "@/lib/prisma";

export const metadata = {
  title: 'Members | SaaS Project Management',
};

async function getMembers(workspaceId: string) {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });
    return members;
  } catch {
    return [];
  }
}

async function getInvites(workspaceId: string) {
  try {
    const invites = await prisma.invitation.findMany({
      where: { workspaceId, acceptedAt: null },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return invites;
  } catch {
    return [];
  }
}

export default async function MembersPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  
  const members = await getMembers(workspace.id);
  const invites = await getInvites(workspace.id);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
      <div className="pt-2 sm:pt-0 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who has access to this workspace and their roles.</p>
      </div>
      
      <MemberList initialMembers={members as any} initialInvites={invites as any} workspaceId={workspace.id} currentUserId={user.id} />
    </div>
  );
}
