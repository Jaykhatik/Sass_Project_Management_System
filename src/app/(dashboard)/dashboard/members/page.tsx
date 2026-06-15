import { MemberList } from './MemberList';
import { getAllMembers, getWorkspaceBySlug } from '@/services/workspaceService';

export const metadata = {
  title: 'Members | SaaS Project Management',
};

export default async function MembersPage() {
  // Hardcoded for now until dynamic routing is implemented
  const workspace = await getWorkspaceBySlug('demo-workspace');
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
