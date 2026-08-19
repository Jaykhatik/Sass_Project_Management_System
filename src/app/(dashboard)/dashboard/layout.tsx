import React from 'react';
import { notFound } from 'next/navigation';
import { Sidebar } from '@/components/shared/Sidebar';
import { Header } from '@/components/shared/Header';
import { getSessionUser, getPrimaryWorkspaceForUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

import prisma from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  const workspace = await getPrimaryWorkspaceForUser(user.id);

  if (!workspace) {
    notFound();
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id,
      },
    },
  });

  const isOwner = workspace.ownerId === user.id || membership?.role === "owner";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar workspaceSlug={workspace.slug} isOwner={isOwner} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header workspaceId={workspace.id} />
        
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
