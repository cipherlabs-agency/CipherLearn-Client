"use client";

import { useBuilderStore } from "./store";
import { BlockType } from "./types";
import { getBlockDefinition } from "./registry";
import { Settings2, Plus, GripVertical, Trash2, Palette, Box, Check, User } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { LeadsTab } from "./LeadsTab";

const AVAILABLE_BLOCKS: BlockType[] = [
  "hero", "trust", "stats", "features", "curriculum", "instructor", "pricing", "testimonials", "faq", "rich-text"
];

const PRESETS = [
  { id: "midnight", name: "Midnight Calculus", primary: "#60a5fa", bg: "#09090b", text: "#ffffff" },
  { id: "ivory", name: "Ivory Academy", primary: "#2563eb", bg: "#f8fafc", text: "#0f172a" },
  { id: "startup", name: "Startup Violet", primary: "#8b5cf6", bg: "#0f172a", text: "#ffffff" },
];

const THEMES = [
  { id: "blue", name: "Classic Blue", color: "#2563eb", class: "theme-blue" },
  { id: "emerald", name: "Enterprise Emerald", color: "#059669", class: "theme-emerald" },
  { id: "violet", name: "Startup Violet", color: "#7c3aed", class: "theme-violet" },
  { id: "rose", name: "Editorial Rose", color: "#e11d48", class: "theme-rose" },
  { id: "slate", name: "Apple Slate", color: "#334155", class: "theme-slate" },
  { id: "amber", name: "Modern Amber", color: "#d97706", class: "theme-amber" },
];

const FONTS = [
  { id: "inter", name: "Inter (Standard)", family: "'Inter', sans-serif" },
  { id: "playfair", name: "Playfair (Editorial)", family: "'Playfair Display', serif" },
  { id: "outfit", name: "Outfit (Modern)", family: "'Outfit', sans-serif" },
];

function BlockTemplate({ type }: { type: BlockType }) {
  const definition = getBlockDefinition(type);
  const { blocks } = useBuilderStore();
  
  // Singleton Rule: Certain blocks should only appear once
  const SINGLETON_BLOCKS = ["hero", "instructor", "pricing", "faq"];
  const isAlreadyAdded = SINGLETON_BLOCKS.includes(type) && blocks.some(b => b.type === type);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `template-${type}`,
    disabled: isAlreadyAdded,
    data: {
      type: "block-template",
      blockType: type,
    },
  });

  if (!definition) return null;
  const Icon = definition.icon;

  return (
    <div
      ref={setNodeRef}
      {...(isAlreadyAdded ? {} : listeners)}
      {...(isAlreadyAdded ? {} : attributes)}
      className={`relative group p-3 flex items-center gap-3 rounded-xl border transition-all ${
        isAlreadyAdded 
          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed" 
          : "bg-white border-gray-200 cursor-grab hover:border-blue-300 hover:shadow-md hover:scale-[1.02]"
      } ${isDragging ? "opacity-30 scale-95" : ""}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
        isAlreadyAdded ? "bg-gray-200 text-gray-400" : "bg-blue-50 text-blue-600"
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <span className="text-[14px] font-bold text-gray-900 leading-tight truncate">{definition.name}</span>
        <span className="text-[11px] text-gray-400 leading-tight mt-0.5 font-medium truncate">
          {isAlreadyAdded ? "Already on canvas" : definition.description}
        </span>
      </div>
      {isAlreadyAdded && (
        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter">
          Added
        </div>
      )}
    </div>
  );
}

function GlobalSettings() {
  const { theme, updateTheme } = useBuilderStore();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
      <div className="space-y-4">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Premium Presets</label>
        <div className="grid grid-cols-1 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => updateTheme({ primaryColor: p.primary, backgroundColor: p.bg, textColor: p.text })}
              className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all group ${
                theme.backgroundColor === p.bg ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-gray-100 hover:border-gray-200 bg-white"
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex overflow-hidden border border-gray-100 shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                <div style={{ backgroundColor: p.bg }} className="flex-1" />
                <div style={{ backgroundColor: p.primary }} className="w-3" />
              </div>
              <div className="flex flex-col items-start gap-0.5">
                <span className="text-[13px] font-bold text-gray-900">{p.name}</span>
                <span className="text-[10px] text-gray-400 font-medium">Full visual remaster</span>
              </div>
              {theme.backgroundColor === p.bg && <Check className="w-4 h-4 ml-auto text-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Accent Color</label>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateTheme({ primaryColor: t.color })}
              className={`group relative aspect-square rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                theme.primaryColor === t.color ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200 bg-white"
              }`}
            >
              <div 
                className="w-6 h-6 rounded-full shadow-inner" 
                style={{ backgroundColor: t.color }}
              />
              <span className={`text-[10px] font-bold ${theme.primaryColor === t.color ? "text-blue-700" : "text-gray-500"}`}>
                {t.name.split(' ')[1]}
              </span>
              {theme.primaryColor === t.color && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Typography Axis</label>
        <div className="flex flex-col gap-2">
          {FONTS.map((f) => (
            <button
              key={f.id}
              onClick={() => updateTheme({ fontFamily: f.family })}
              className={`w-full px-4 py-3 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                theme.fontFamily === f.family ? "border-blue-600 bg-blue-50/50" : "border-gray-100 hover:border-gray-200 bg-white"
              }`}
            >
              <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: f.family }}>
                {f.name}
              </span>
              {theme.fontFamily === f.family && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <p className="text-[11px] text-gray-500 leading-relaxed italic">
          Changing the global theme will instantly remap all button colors, icons, and text across your entire landing page.
        </p>
      </div>
    </div>
  );
}

export function BuilderSidebar() {
  const { blocks, selectedBlockId, selectBlock, removeBlock, updateBlock, batchContext } = useBuilderStore();
  const [activeTab, setActiveTab] = useState<"blocks" | "theme" | "layout" | "leads">("blocks");
  const [subTab, setSubTab] = useState<"content" | "design">("content");
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <aside className="w-[300px] sm:w-[340px] bg-white border-l border-gray-200 flex flex-col h-full shrink-0 z-20 overflow-hidden">
      {selectedBlock ? (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="sticky top-0 bg-white/95 backdrop-blur z-10 border-b border-gray-100 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center">
                <Settings2 className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-[14px] font-semibold text-gray-900 capitalize tracking-tight">
                {selectedBlock.type} Settings
              </h2>
            </div>
            <button 
              onClick={() => selectBlock(null)}
              className="px-3 py-1 rounded-full bg-gray-100 text-[11px] font-bold uppercase text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Done
            </button>
          </div>

          <div className="flex border-b border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setSubTab("content")}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                subTab === "content" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setSubTab("design")}
              className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 ${
                subTab === "design" ? "border-blue-600 text-blue-600 bg-white" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Design
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto bg-white">
            {subTab === "content" ? (
              (() => {
                const def = getBlockDefinition(selectedBlock.type as BlockType);
                if (def && def.settingsComponent) {
                  const SettingsComponent = def.settingsComponent;
                  return <SettingsComponent block={selectedBlock} updateBlock={updateBlock} />;
                }
                return (
                  <div className="text-[13px] text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    No advanced content settings.
                  </div>
                );
              })()
            ) : (
              <div className="space-y-8 pb-10">
                {/* Spacing */}
                <div className="space-y-4">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Vertical Padding</label>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-medium text-gray-600">Top Padding</span>
                        <span className="text-[12px] font-bold text-blue-600">{(selectedBlock.styles?.paddingTop ?? 100)}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="250" step="10"
                        value={selectedBlock.styles?.paddingTop ?? 100}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, paddingTop: parseInt(e.target.value) }})}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[12px] font-medium text-gray-600">Bottom Padding</span>
                        <span className="text-[12px] font-bold text-blue-600">{(selectedBlock.styles?.paddingBottom ?? 100)}px</span>
                      </div>
                      <input 
                        type="range" min="0" max="250" step="10"
                        value={selectedBlock.styles?.paddingBottom ?? 100}
                        onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, paddingBottom: parseInt(e.target.value) }})}
                        className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Section Background</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["color", "glass", "minimal", "gradient"].map((type) => (
                      <button
                        key={type}
                        onClick={() => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, backgroundType: type as any }})}
                        className={`px-3 py-2 rounded-lg border text-[11px] font-bold uppercase tracking-tight transition-all ${
                          (selectedBlock.styles?.backgroundType || 'minimal') === type 
                            ? "border-blue-600 bg-blue-50 text-blue-600" 
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Animation */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Entrance Effect</label>
                  <select 
                    value={selectedBlock.styles?.animation || "slide-up"}
                    onChange={(e) => updateBlock(selectedBlock.id, { styles: { ...selectedBlock.styles, animation: e.target.value as any }})}
                    className="w-full p-2.5 rounded-xl border border-gray-200 text-[13px] font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="none">No Animation</option>
                    <option value="fade">Fade In</option>
                    <option value="slide-up">Slide Up</option>
                    <option value="zoom">Zoom Scale</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 p-4 bg-gray-50 mt-auto">
            <button
              onClick={() => {
                removeBlock(selectedBlock.id);
                selectBlock(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[13px] font-medium transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Remove Component
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full animate-in fade-in duration-300">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button
              onClick={() => setActiveTab("blocks")}
              className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1.5 transition-all border-b-2 ${
                activeTab === "blocks" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <Box className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Blocks</span>
            </button>
            <button
              onClick={() => setActiveTab("theme")}
              className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1.5 transition-all border-b-2 ${
                activeTab === "theme" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <Palette className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Themes</span>
            </button>
            <button
              onClick={() => setActiveTab("layout")}
              className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1.5 transition-all border-b-2 ${
                activeTab === "layout" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <GripVertical className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Layout</span>
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`flex-1 min-w-[80px] py-4 flex flex-col items-center justify-center gap-1.5 transition-all border-b-2 ${
                activeTab === "leads" ? "border-blue-600 text-blue-600 bg-blue-50/10" : "border-transparent text-gray-400 hover:text-gray-900"
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-wider">Leads</span>
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            {activeTab === "blocks" ? (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-[14px] font-semibold text-gray-900 tracking-tight">Add Components</h2>
                  <p className="text-[12px] text-gray-500">Drag items to the canvas.</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {AVAILABLE_BLOCKS.map((type) => (
                    <BlockTemplate key={type} type={type} />
                  ))}
                </div>
              </div>
            ) : activeTab === "layout" ? (
              <div className="space-y-6">
                 <div className="space-y-1">
                  <h2 className="text-[14px] font-semibold text-gray-900 tracking-tight">Active Components</h2>
                  <p className="text-[12px] text-gray-500">Overview of your page structure.</p>
                </div>
                <div className="space-y-2">
                  {blocks.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 font-bold uppercase">Canvas is empty</p>
                    </div>
                  ) : (
                    blocks.map((block, index) => {
                      const def = getBlockDefinition(block.type as any);
                      const Icon = def?.icon || Box;
                      return (
                        <div 
                          key={block.id}
                          onClick={() => selectBlock(block.id)}
                          className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer group"
                        >
                          <div className="w-5 h-5 text-gray-300 group-hover:text-blue-400 rotate-90">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-gray-900 capitalize leading-tight">{block.type}</span>
                            <span className="text-[10px] text-gray-400 font-medium">Position #{index + 1}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeBlock(block.id);
                            }}
                            className="ml-auto opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="text-[10px] text-gray-400 italic px-2">Tip: Click a component to edit its details. Use the canvas to drag and reorder.</p>
              </div>
            ) : activeTab === "leads" ? (
              <LeadsTab batchId={batchContext?.batch?.id} />
            ) : (
              <GlobalSettings />
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
