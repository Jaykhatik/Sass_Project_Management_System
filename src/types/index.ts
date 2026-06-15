export interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface WorkspaceMember {
  id: string;
  role: string;
  joinedAt: Date | string;
  workspaceId: string;
  userId: string;
  user: User;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  ownerId: string;
  plan: string;
}
