import { getAxiosInstance } from "../config";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export const WORKSPACE_API = getAxiosInstance(BASE);
