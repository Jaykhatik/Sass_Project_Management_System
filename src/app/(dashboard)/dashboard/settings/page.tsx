import { SettingsForm } from './SettingsForm';
import { getPrimaryWorkspaceForUser, getSessionUser } from '@/lib/auth';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Settings | SaaS Project Management',
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  
  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences and details.</p>
      </div>
      
      <div className="border rounded-xl bg-card shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">General</h2>
        <SettingsForm workspace={workspace} />
      </div>

      <div className="border rounded-xl border-destructive/20 bg-destructive/5 p-6 space-y-3">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting a workspace is irreversible and will remove all associated projects, tasks, and data.
        </p>
        <button className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm">
          Delete Workspace
        </button>
      </div>
    </div>
  );
}
