"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ReactNode } from "react";
import { BuilderBlock } from "./types";
import { useBuilderStore } from "./store";
import { GripVertical } from "lucide-react";

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
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute top-2 left-1/2 -translate-x-1/2 w-8 h-6 bg-white border border-gray-200 shadow-sm rounded-md flex items-center justify-center cursor-grab active:cursor-grabbing z-20 opacity-0 group-hover:opacity-100 transition-opacity ${
          isSelected ? "opacity-100" : ""
        }`}
      >
        <GripVertical className="w-4 h-4 text-gray-500" />
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
