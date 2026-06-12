# 🧠 Redux Toolkit & React-Redux (Package 2)

## What is it?
**Redux Toolkit (RTK)** is the official, opinionated, batteries-included toolset for efficient Redux development. It simplifies the setup of a Redux store, and it includes **RTK Query** for powerful data fetching and caching.

## Why do we need it in our project?
In a complex SaaS Project Management System, many different components need to know about the same data without passing "props" down deeply through multiple files. 
1. **Global State:** We need to know if the sidebar is open, which workspace is currently active, or if dark mode is enabled. Redux stores this globally.
2. **Data Fetching (RTK Query):** Instead of using a separate tool (like React Query) or setting up Redis for caching, RTK Query handles all polling, caching, and background data updates. For example, when a user navigates from "Projects" to "My Tasks" and back, the data loads instantly from the cache.

## Basic Usage Example

**1. Defining a Slice (State piece):**
```typescript
import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    }
  }
})
export const { toggleSidebar } = uiSlice.actions
export default uiSlice.reducer
```

**2. Using it in a Component:**
```tsx
import { useDispatch, useSelector } from 'react-redux'

function SidebarToggle() {
  const isOpen = useSelector((state: RootState) => state.ui.sidebarOpen)
  const dispatch = useDispatch()

  return <button onClick={() => dispatch(toggleSidebar())}>Toggle</button>
}
```
