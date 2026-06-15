import { MemberList } from './MemberList';
import { getAllMembers } from '@/services/workspaceService';
import { getPrimaryWorkspaceForUser, getSessionUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Members | SaaS Project Management',
};

export default async function MembersPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  const members = await getAllMembers(workspace.id);
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who has access to this workspace and their roles.</p>
      </div>
      
      <div className="border rounded-xl bg-card shadow-sm overflow-hidden">
        <MemberList initialMembers={members} workspaceId={workspace.id} />
      </div>
    </div>
  );
}
