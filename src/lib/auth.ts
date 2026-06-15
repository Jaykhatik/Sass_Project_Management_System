import crypto from "crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/errors";

const ACCESS_COOKIE = "spm_access";
const REFRESH_COOKIE = "spm_refresh";
const ACCESS_TTL_MS = 15 * 60 * 1000;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const hashPassword = (password: string) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto.scryptSync(password, salt, 64);
  const actual = Buffer.from(hash, "hex");
  if (actual.length !== verify.length) return false;
  return crypto.timingSafeEqual(actual, verify);
};

export const createSession = async (userId: string) => {
  const accessToken = crypto.randomBytes(32).toString("hex");
  const refreshToken = crypto.randomBytes(48).toString("hex");
  const now = Date.now();
  const accessTokenExpiresAt = new Date(now + ACCESS_TTL_MS);
  const refreshTokenExpiresAt = new Date(now + REFRESH_TTL_MS);

  await prisma.session.create({
    data: {
      userId,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};

export const refreshSession = async (refreshToken: string) => {
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  if (!session || session.refreshTokenExpiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { refreshToken } }).catch(() => {});
    }
    return null;
  }

  const newAccessToken = crypto.randomBytes(32).toString("hex");
  const accessTokenExpiresAt = new Date(Date.now() + ACCESS_TTL_MS);

  await prisma.session.update({
    where: { refreshToken },
    data: {
      accessToken: newAccessToken,
      accessTokenExpiresAt,
    },
  });

  return {
    user: session.user,
    accessToken: newAccessToken,
    refreshToken: session.refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  };
};

export const setSessionCookies = async (
  accessToken: string,
  refreshToken: string,
  accessTokenExpiresAt: Date,
  refreshTokenExpiresAt: Date,
) => {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: accessTokenExpiresAt,
    path: "/",
  });
  cookieStore.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: refreshTokenExpiresAt,
    path: "/",
  });
};

export const clearSessionCookies = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_COOKIE);
  cookieStore.delete(REFRESH_COOKIE);
};

export const getSessionUser = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    const session = await prisma.session.findUnique({
      where: { accessToken },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (session && session.accessTokenExpiresAt >= new Date()) {
      return session.user;
    }
  }

  return null;
};

export const getSessionUserWithRefresh = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const session = await prisma.session.findUnique({
      where: { accessToken },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    if (session && session.accessTokenExpiresAt >= new Date()) {
      return session.user;
    }
  }

  if (!refreshToken) return null;

  const refreshed = await refreshSession(refreshToken);
  if (!refreshed) {
    await clearSessionCookies();
    return null;
  }

  await setSessionCookies(
    refreshed.accessToken,
    refreshed.refreshToken,
    refreshed.accessTokenExpiresAt,
    refreshed.refreshTokenExpiresAt,
  );

  return refreshed.user;
};

export const requireSessionUser = async () => {
  const user = await getSessionUser();
  if (!user) {
    throw new UnauthorizedError("Please sign in to continue");
  }
  return user;
};

export const getPrimaryWorkspaceForUser = async (userId: string) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "asc" },
    include: { workspace: true },
  });

  if (membership?.workspace) {
    return membership.workspace;
  }

  return prisma.workspace.findFirst({
    where: { ownerId: userId },
  });
};

export const authCookieNames = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
};
