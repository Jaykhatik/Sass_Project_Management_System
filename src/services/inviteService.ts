import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export const getPendingInvites = async (workspaceId: string) => {
  try {
    const res = await axios.get(`${API_BASE}/workspaces/${workspaceId}/invites`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to fetch invites");
  }
};

export const createInvite = async (workspaceId: string, email: string, role: string) => {
  try {
    const res = await axios.post(`${API_BASE}/workspaces/${workspaceId}/invites`, { email, role });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create invite");
  }
};

export const revokeInvite = async (workspaceId: string, inviteId: string) => {
  try {
    const res = await axios.delete(`${API_BASE}/workspaces/${workspaceId}/invites/${inviteId}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to revoke invite");
  }
};

export const getInviteDetails = async (token: string) => {
  try {
    const res = await axios.get(`${API_BASE}/invites/${token}`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Invalid invite");
  }
};

export const acceptInvite = async (token: string) => {
  try {
    const res = await axios.post(`${API_BASE}/invites/${token}/accept`);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to accept invite");
  }
};
