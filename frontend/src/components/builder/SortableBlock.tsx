"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { BuilderBlock } from "./types";
import { useBuilderStore } from "./store";
import { GripVertical, Trash2 } from "lucide-react";

export function SortableBlock({ block, children }: { block: BuilderBlock; children: ReactNode }) {
  const { selectedBlockId, selectBlock } = useBuilderStore();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSelected = selectedBlockId === block.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ring-1 transition-all ${
        isSelected ? "ring-blue-500 z-10" : "ring-transparent hover:ring-gray-300 z-0"
      } ${isDragging ? "opacity-50 z-50 scale-100 shadow-2xl ring-blue-500" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        selectBlock(block.id);
      }}
    >
      {/* On-Canvas Controls */}
      <div
        className={`absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)] rounded-lg p-1 z-20 opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 ${
          isSelected ? "opacity-100 scale-100" : ""
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="w-8 h-7 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-gray-50 rounded-md transition-colors"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>
        <div className="w-[1px] h-4 bg-gray-200" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            useBuilderStore.getState().removeBlock(block.id);
          }}
          className="w-8 h-7 flex items-center justify-center cursor-pointer hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      {/* Component Content */}
      <div className={`relative ${isDragging ? "pointer-events-none" : ""}`}>
        {children}
      </div>

      {/* Selected Overlay Indicator */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none ring-2 ring-blue-500 ring-inset rounded-sm" />
      )}
    </div>
  );
}
