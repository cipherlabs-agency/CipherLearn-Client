"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useBuilderStore } from "./store";
import { SortableBlock } from "./SortableBlock";
import { BlockType } from "./types";
import { getBlockDefinition } from "./registry";
import { SectionDivider } from "./SectionDividers";

export function BuilderCanvas() {
  const { blocks, deviceMode, selectBlock, selectedBlockId, theme } = useBuilderStore();
  const { setNodeRef, isOver } = useDroppable({
    id: "builder-canvas",
  });

  return (
    <main 
      className="flex-1 overflow-y-auto relative bg-[#f1f1f1] flex justify-center py-12 px-6"
      onClick={() => selectBlock(null)}
    >
      <div 
        ref={setNodeRef}
        style={{ fontFamily: theme.fontFamily }}
        className={`relative min-h-[90vh] bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 ease-out origin-top 
          ${deviceMode === "mobile" ? "w-[390px] rounded-[3.5rem] p-4 scale-95 ring-[12px] ring-zinc-900 shadow-2xl" : "w-full max-w-[1300px] rounded-[1.5rem]"}
          ${isOver ? "ring-4 ring-blue-500/20" : ""}
        `}
      >
        {/* Minimal Global Aesthetic Layer */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {blocks.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 p-12 text-center">
            <div className="mb-8 w-20 h-20 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center animate-pulse">
              <svg className="w-8 h-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2 uppercase tracking-tight">Your Canvas is Open</h3>
            <p className="max-w-xs text-sm font-medium text-zinc-500 leading-relaxed">
              Drag components from the "Blocks" tab to begin crafting your elite learning experience.
            </p>
          </div>
        ) : (
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col w-full h-full relative font-inherit">
              {blocks.map((block) => (
                <SortableBlock key={block.id} block={block}>
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      selectBlock(block.id);
                    }}
                    className={`relative transition-all duration-500 cursor-pointer rounded-2xl ${
                      selectedBlockId === block.id 
                        ? "ring-[4px] ring-blue-600/20 border-2 border-blue-600 z-10 shadow-[0_20px_60px_-15px_rgba(37,99,235,0.2)] bg-white/5" 
                        : "hover:ring-[3px] hover:ring-blue-100/50 border-2 border-transparent"
                    }`}
                  >
                    {/* Active Selection Indicator - Master Edition Style */}
                    {selectedBlockId === block.id && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.4)] z-20 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        Master Editor Active
                      </div>
                    )}

                    <SectionDivider 
                      type={block.styles?.dividerTop || "none"} 
                      position="top" 
                      color={theme.backgroundColor} 
                    />
                    
                    {(() => {
                      const def = getBlockDefinition(block.type as BlockType);
                      if (!def) return <div className="p-4 text-red-500">Unknown block type</div>;
                      const Component = def.component;
                      return <Component block={block} />;
                    })()}

                    <SectionDivider 
                      type={block.styles?.dividerBottom || "none"} 
                      position="bottom" 
                      color="#ffffff" 
                    />
                  </div>
                </SortableBlock>
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </main>
  );
}
