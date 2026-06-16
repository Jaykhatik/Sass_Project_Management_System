import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { UnauthorizedError } from "@/lib/errors";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "super-secret-jwt-key-for-dev-1234567890123456");
const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";
const ACCESS_TTL_SEC = 15 * 60; // 15 minutes
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const generateTokens = async (userId: string, email: string, sessionId: string) => {
  const accessToken = await new SignJWT({ userId, email, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ userId, sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SEC}s`)
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
};

export const createSession = async (userId: string, email: string, deviceInfo?: string, ipAddress?: string) => {
  // We first create a session record to get an ID
  const session = await prisma.session.create({
    data: {
      userId,
      deviceInfo,
      ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
  });

  const { accessToken, refreshToken } = await generateTokens(userId, email, session.id);
  
  // Hash the refresh token before storing it
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await prisma.session.update({
    where: { id: session.id },
    data: { hashedRefreshToken },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + ACCESS_TTL_SEC * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
  };
};

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; email: string; sessionId: string };
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; sessionId: string };
  } catch (error) {
    return null;
  }
};

export const refreshSession = async (refreshToken: string, deviceInfo?: string, ipAddress?: string) => {
  const payload = await verifyRefreshToken(refreshToken);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, createdAt: true },
      },
    },
  });

  if (!session || !session.hashedRefreshToken || !session.expiresAt || session.expiresAt < new Date()) {
    // Session is invalid or expired
    if (session) {
      await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    }
    return null;
  }

  // Verify the refresh token hash
  const isValid = await bcrypt.compare(refreshToken, session.hashedRefreshToken);
  if (!isValid) {
    // Possible token theft, invalidate all user sessions as a security measure
    await prisma.session.deleteMany({ where: { userId: payload.userId } });
    return null;
  }

  // Token rotation: Generate new tokens
  const newTokens = await generateTokens(session.user.id, session.user.email, session.id);
  const hashedNewRefreshToken = await bcrypt.hash(newTokens.refreshToken, 10);

  // Update session
  await prisma.session.update({
    where: { id: session.id },
    data: {
      hashedRefreshToken: hashedNewRefreshToken,
      deviceInfo: deviceInfo || session.deviceInfo,
      ipAddress: ipAddress || session.ipAddress,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
    },
  });

  return {
    user: session.user,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + ACCESS_TTL_SEC * 1000),
    refreshTokenExpiresAt: new Date(Date.now() + REFRESH_TTL_SEC * 1000),
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
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, createdAt: true },
      });
      if (user) return user;
    }
  }

  return null;
};

export const getSessionUserWithRefresh = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, name: true, email: true, avatarUrl: true, emailVerified: true, createdAt: true },
      });
      if (user) return user;
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
  const user = await getSessionUserWithRefresh();
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

export const logoutFromCurrentDevice = async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      await prisma.session.delete({ where: { id: payload.sessionId } }).catch(() => {});
    }
  }
  await clearSessionCookies();
};

export const logoutFromAllDevices = async () => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      await prisma.session.deleteMany({ where: { userId: payload.userId } });
    }
  }
  await clearSessionCookies();
};
