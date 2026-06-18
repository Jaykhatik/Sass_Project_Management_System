import axios from "axios";
import { AUTH_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Authenticates a user and establishes a session.
 * Used in: `src/app/(auth)/login/page.tsx`
 */
export const login = async (data: Record<string, string>) => {
  try {
    const res = await axios.post(`${API_BASE}${AUTH_API_ROUTES.login}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Unable to sign in");
  }
};

/**
 * Registers a new user account.
 * Used in: `src/app/(auth)/signup/page.tsx`
 */
export const register = async (data: Record<string, any>) => {
  try {
    const res = await axios.post(`${API_BASE}${AUTH_API_ROUTES.register}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create account");
  }
};

/**
 * Logs the current user out by destroying their server-side session.
 * Used in: `src/components/shared/Header.tsx` (Logout button)
 */
export const logout = async () => {
  try {
    await axios.post(`${API_BASE}${AUTH_API_ROUTES.logout}`, {}, { withCredentials: true });
  } catch (error) {
    throw new Error("Failed to logout");
  }
};

/**
 * Silently refreshes the user's authentication token/session to keep them logged in.
 * Used in: `src/components/shared/Sidebar.tsx` (Background polling)
 */
export const refreshSession = async () => {
  try {
    await axios.post(`${API_BASE}${AUTH_API_ROUTES.refresh}`, {}, { withCredentials: true });
  } catch (error) {
    throw new Error("Failed to refresh session");
  }
};

/**
 * Gets the currently authenticated user
 */
export const getCurrentUser = async () => {
  try {
    const res = await axios.get(`${API_BASE}${AUTH_API_ROUTES.me}`);
    return res.data;
  } catch (error) {
    return null;
  }
};
