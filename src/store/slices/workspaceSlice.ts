import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface WorkspaceState {
  currentWorkspaceId: string | null;
  currentWorkspaceSlug: string | null;
  isLoading: boolean;
}

const initialState: WorkspaceState = {
  currentWorkspaceId: null,
  currentWorkspaceSlug: null,
  isLoading: false,
};

export const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (
      state,
      action: PayloadAction<{ id: string; slug: string }>
    ) => {
      state.currentWorkspaceId = action.payload.id;
      state.currentWorkspaceSlug = action.payload.slug;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCurrentWorkspace, setLoading } = workspaceSlice.actions;
export default workspaceSlice.reducer;
