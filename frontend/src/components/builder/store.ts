import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BuilderBlock, DeviceMode } from "./types";

interface BuilderState {
  blocks: BuilderBlock[];
  selectedBlockId: string | null;
  deviceMode: DeviceMode;
  theme: {
    primaryColor: string;
    fontFamily: string;
    backgroundColor: string;
    textColor: string;
  };
  batchContext: any;
  isContextLoading: boolean;

  // Actions
  addBlock: (block: BuilderBlock, index?: number) => void;
  updateBlock: (id: string, updates: Partial<BuilderBlock>) => void;
  removeBlock: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  selectBlock: (id: string | null) => void;
  setDeviceMode: (mode: DeviceMode) => void;
  updateTheme: (updates: Partial<BuilderState["theme"]>) => void;
  setBlocks: (blocks: BuilderBlock[]) => void;
  setBatchContext: (context: any) => void;
  fetchBatchContext: (courseId: string) => Promise<void>;
}

export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      blocks: [],
      selectedBlockId: null,
      deviceMode: "desktop",
      theme: {
        primaryColor: "#000000",
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#ffffff",
        textColor: "#111827",
      },
      batchContext: null,
      isContextLoading: false,

  addBlock: (block, index) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      if (index !== undefined) {
        newBlocks.splice(index, 0, block);
      } else {
        newBlocks.push(block);
      }
      return { blocks: newBlocks, selectedBlockId: block.id };
    }),

  updateBlock: (id, updates) =>
    set((state) => ({
      blocks: state.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    })),

  reorderBlocks: (fromIndex, toIndex) =>
    set((state) => {
      const newBlocks = [...state.blocks];
      const [moved] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, moved);
      return { blocks: newBlocks };
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setDeviceMode: (mode) => set({ deviceMode: mode }),

  updateTheme: (updates) =>
    set((state) => ({ theme: { ...state.theme, ...updates } })),
    
  setBlocks: (blocks) => set({ blocks }),

  setBatchContext: (context) => set({ batchContext: context }),

  fetchBatchContext: async (courseId) => {
    set({ isContextLoading: true });
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const res = await fetch(`${apiUrl}/dashboard/batches/${courseId}/landing-context`, { 
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include" 
      });
      const json = await res.json();
      if (json.success) {
        set({ batchContext: json.data, isContextLoading: false });
      } else {
        set({ isContextLoading: false });
      }
    } catch (error) {
      console.error("Failed to fetch landing context:", error);
      set({ isContextLoading: false });
    }
  },
    }),
    {
      name: "builder-storage",
      partialize: (state) => ({ blocks: state.blocks, theme: state.theme }),
    }
  )
);
