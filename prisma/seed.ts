import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("Starting seed...");

  // 1. Create Demo Users
  const user1 = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      emailVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "Alice",
      emailVerified: true,
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      ownerId: user1.id,
      members: {
        create: [
          { userId: user1.id, role: "owner" },
          { userId: user2.id, role: "member" },
        ],
      },
    },
  });

  // 3. Create Project
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: "Website Redesign",
      description: "Overhauling the main corporate website.",
      createdById: user1.id,
    },
  });

  // 4. Create Board for the project
  const board = await prisma.board.create({
    data: {
      name: "Main Board",
      projectId: project.id,
      workspaceId: workspace.id,
      isDefault: true,
    },
  });

  // 5. Create Columns for the board
  const [todoCol, inProgressCol] = await Promise.all([
    prisma.column.create({
      data: {
        name: "To Do",
        position: 0,
        boardId: board.id,
        workspaceId: workspace.id,
      },
    }),
    prisma.column.create({
      data: {
        name: "In Progress",
        position: 1,
        boardId: board.id,
        workspaceId: workspace.id,
      },
    }),
    prisma.column.create({
      data: {
        name: "Review",
        position: 2,
        boardId: board.id,
        workspaceId: workspace.id,
      },
    }),
    prisma.column.create({
      data: {
        name: "Done",
        position: 3,
        boardId: board.id,
        workspaceId: workspace.id,
        isDoneCol: true,
      },
    }),
  ]);

  // 6. Create Tasks
  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      boardId: board.id,
      columnId: todoCol.id,
      title: "Design new landing page",
      description: "Create high-fidelity mockups for the new homepage.",
      priority: "high",
      status: "todo",
      createdById: user1.id,
      assignees: { create: [{ userId: user1.id }] },
    },
  });

  await prisma.task.create({
    data: {
      workspaceId: workspace.id,
      projectId: project.id,
      boardId: board.id,
      columnId: inProgressCol.id,
      title: "Setup Next.js Project",
      description: "Initialize repo with Prisma and Tailwind.",
      priority: "critical",
      status: "in_progress",
      createdById: user2.id,
      assignees: { create: [{ userId: user2.id }] },
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
