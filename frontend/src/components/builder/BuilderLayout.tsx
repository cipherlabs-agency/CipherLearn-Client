"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  KeyboardSensor, 
  PointerSensor, 
  closestCenter, 
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BuilderTopbar } from "./BuilderTopbar";
import { BuilderSidebar } from "./BuilderSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { useBuilderStore } from "./store";
import { BlockType } from "./types";
import { getBlockDefinition } from "./registry";
import { Toaster } from "sonner";

export function BuilderLayout({ courseId }: { courseId?: string }) {
  const { blocks, addBlock, reorderBlocks, fetchBatchContext, isContextLoading } = useBuilderStore();
  const [activeDragType, setActiveDragType] = useState<BlockType | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  useEffect(() => {
    if (courseId) {
      fetchBatchContext(courseId);
    }
  }, [courseId, fetchBatchContext]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "block-template") {
      setActiveDragType(active.data.current.blockType);
    } else {
      setActiveDragId(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);
    setActiveDragId(null);

    if (!over) return;

    // Dropping a new block from sidebar onto canvas
    if (active.data.current?.type === "block-template" && over.id === "builder-canvas") {
      const type = active.data.current.blockType as BlockType;
      
      const definition = getBlockDefinition(type);
      
      addBlock({
        id: Math.random().toString(36).substring(2, 9),
        type,
        content: definition?.defaultContent || {},
        styles: definition?.defaultStyles || {},
      });
      return;
    }

    // Dropping a template directly over another block
    if (active.data.current?.type === "block-template" && over.id !== "builder-canvas") {
        const dropIndex = blocks.findIndex((b) => b.id === over.id);
        if (dropIndex !== -1) {
            const type = active.data.current.blockType as BlockType;
            const definition = getBlockDefinition(type);
            addBlock({
                id: Math.random().toString(36).substring(2, 9),
                type,
                content: definition?.defaultContent || {},
                styles: definition?.defaultStyles || {},
            }, dropIndex);
        }
        return;
    }

    // Reordering existing blocks
    if (active.id !== over.id && !active.data.current?.type) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id);
      const newIndex = blocks.findIndex((b) => b.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderBlocks(oldIndex, newIndex);
      }
    }
  };

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {isContextLoading ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-zinc-950 font-sans">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-blue-500/10 rounded-full" />
            <div 
              className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin" 
              style={{ borderTopColor: useBuilderStore.getState().theme.primaryColor || '#3b82f6' }}
            />
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight animate-pulse">Syncing Academy Assets...</h2>
          <p className="text-zinc-400 text-sm mt-2 font-medium">Preparing your immersive workspace</p>
        </div>
      ) : (
        <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
          <BuilderTopbar courseId={courseId || ""} />
          <div className="flex flex-1 overflow-hidden min-h-0">
            <BuilderCanvas />
            <BuilderSidebar />
          </div>
        </div>
      )}
      
      <DragOverlay>
        {activeDragType ? (
          <div className="p-4 border border-blue-500 bg-white/90 dark:bg-zinc-900/90 shadow-xl rounded-xl flex items-center justify-center backdrop-blur-md shadow-blue-500/10">
            <span className="text-sm font-bold capitalize text-blue-600 dark:text-blue-400 tracking-tight block">{activeDragType} Block</span>
          </div>
        ) : null}
        {activeDragId ? (
          <div className="p-4 bg-white/90 dark:bg-zinc-900/90 shadow-2xl border-2 border-blue-500 rounded-xl scale-105 transition-transform backdrop-blur-md">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400 tracking-tight">Moving block...</span>
          </div>
        ) : null}
      </DragOverlay>
      <Toaster position="bottom-right" theme="system" />
    </DndContext>
  );
}
