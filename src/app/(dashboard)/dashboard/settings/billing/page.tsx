import { BillingClient } from './BillingClient';
import { getPrimaryWorkspaceForUser, getSessionUser } from '@/lib/auth';
import { notFound } from 'next/navigation';
import prisma from "@/lib/prisma";

export const metadata = {
  title: 'Billing | SaaS Project Management',
};

export default async function BillingPage() {
  const user = await getSessionUser();
  if (!user) notFound();
  
  const workspace = await getPrimaryWorkspaceForUser(user.id);
  if (!workspace) notFound();
  
  const memberCount = await prisma.workspaceMember.count({
    where: { workspaceId: workspace.id }
  });
  
  const projectCount = await prisma.project.count({
    where: { workspaceId: workspace.id }
  });
  
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & Subscription</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your plan, limits, and billing details.</p>
      </div>
      
      <BillingClient 
        workspaceId={workspace.id} 
        currentMembers={memberCount} 
        currentProjects={projectCount} 
      />
    </div>
  );
}
