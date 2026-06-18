import { MemberList } from './MemberList';
import { getPrimaryWorkspaceForUser, getSessionUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';

export const metadata = {
  title: 'Members | SaaS Project Management',
};

async function getMembers(workspaceId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/${workspaceId}/members`,
    {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    }
  );

  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

async function getInvites(workspaceId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/workspaces/${workspaceId}/invites`,
    {
      cache: 'no-store',
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
    }
  );

  if (!res.ok) return [];
  return res.json();
}

export default async function MembersPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  
  const membersData = await getMembers(workspace.id);
  const invites = await getInvites(workspace.id);
  
  // The API returns { members: [...] } so we extract the array
  const members = membersData.members || membersData;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-0">
      <div className="pt-2 sm:pt-0 text-center sm:text-left">
        <h1 className="text-2xl font-bold tracking-tight">Team Members</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage who has access to this workspace and their roles.</p>
      </div>
      
      <MemberList initialMembers={members} initialInvites={invites} workspaceId={workspace.id} currentUserId={user.id} />
    </div>
  );
}
