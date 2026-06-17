import axios from "axios";
import { BOARD_API_ROUTES } from "./api/routes";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/**
 * Creates a new column (section) in a project board.
 * Used in: `src/components/project/BoardView.tsx`
 */
export const createBoardColumn = async (
  boardId: string,
  data: {
    workspaceId: string;
    name: string;
    color?: string;
    taskLimit?: number;
  }
) => {
  try {
    const res = await axios.post(`${API_BASE}${BOARD_API_ROUTES.columns(boardId)}`, data);
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.error || "Failed to create board column");
  }
};
