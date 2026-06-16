export interface User {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface WorkspaceMember {
  membership_id: string;
  role: string;
  joinedAt: Date | string;
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

export interface ProjectInfo {
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  icon: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  project_id: string;
  workspaceId: string;
  projectInfo: ProjectInfo;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  defaultBoardId?: string | null;
  boards?: Board[]; // Populated when fetching single project details
  taskCount: number;
}

export interface Board {
  id: string;
  columns: Column[];
}

export interface Column {
  id: string;
  name: string;
  color: string | null;
  isDoneCol: boolean | null;
  taskLimit: number | null;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  columnId?: string;
  dueDate: string | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  storyPoints?: number | null;
  assignees?: Assignee[];
  labels?: Label[];
  subTasks?: Task[];
  blockedBy?: { blockerTaskId: string }[];
}

export interface Assignee {
  user: {
    id: string;
    name: string | null;
    email?: string;
    avatarUrl: string | null;
  };
}

export interface Label {
  label: {
    id: string;
    name: string;
    color: string;
  };
}
