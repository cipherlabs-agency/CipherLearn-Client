"use client";

import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";
import { AnimatedBlock } from "../AnimatedBlock";
import { Users, GraduationCap, TrendingUp, Award, Clock, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export const STAT_ICONS: Record<string, any> = {
  Users, GraduationCap, TrendingUp, Award, Clock
};

const Counter = ({ value, suffix = "" }: { value: number, suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{count}{suffix}</span>;
};

export const StatsBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title } = block.content;
  const { theme, updateBlock } = useBuilderStore();

  const paddingStyle = {
    paddingTop: `${block.styles?.paddingTop ?? 100}px`,
    paddingBottom: `${block.styles?.paddingBottom ?? 100}px`,
  };

  const bgStyles: Record<string, string> = {
    color: "bg-zinc-50",
    minimal: "bg-white",
    glass: "bg-white/70 backdrop-blur-xl",
    gradient: "bg-gradient-to-b from-white to-zinc-50"
  };

  const defaultStats = [
    { label: "Success Rate", value: 98, suffix: "%", icon: "TrendingUp" },
    { label: "Total Students", value: 5000, suffix: "+", icon: "Users" },
    { label: "Hours of Content", value: 200, suffix: "+", icon: "Clock" },
    { label: "Avg. Rank Improvement", value: 45, suffix: "%", icon: "GraduationCap" },
  ];

  const stats = block.content.stats || defaultStats;

  const updateStatLabel = (index: number, label: string) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], label };
    updateBlock(block.id, { content: { ...block.content, stats: newStats } });
  };

  return (
    <section 
      style={{ ...paddingStyle, fontFamily: theme.fontFamily }}
      className={`relative px-6 transition-all duration-500 ${bgStyles[block.styles?.backgroundType || 'minimal']}`}
    >
      <div className="max-w-7xl mx-auto">
        {title && (
          <div className="mb-20">
            <h2 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: { ...block.content, title: e.currentTarget.innerText } })}
              className="text-4xl md:text-5xl font-[1000] tracking-[-0.04em] text-zinc-900 outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
            >
              {title}
            </h2>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8">
          {stats.map((stat: any, i: number) => {
            const Icon = STAT_ICONS[stat.icon] || TrendingUp;
            return (
              <AnimatedBlock key={i} animation="fade" delay={i * 100}>
                <div className="flex flex-col items-start group">
                  <div 
                    style={{ color: theme.primaryColor }}
                    className="mb-6 group-hover:scale-110 transition-transform duration-500"
                  >
                    <Icon className="w-8 h-8 opacity-40" />
                  </div>
                  <div className="text-6xl md:text-7xl font-[1000] text-zinc-900 mb-3 tracking-[-0.06em] leading-none">
                    <Counter value={Number(stat.value) || 0} suffix={stat.suffix || ""} />
                  </div>
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => updateStatLabel(i, e.currentTarget.innerText)}
                    className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] outline-none hover:bg-blue-50/50 focus:bg-blue-50/80 rounded transition-all p-1 -ml-1"
                  >
                    {stat.label}
                  </div>
                
                {/* Minimal Accent line */}
                <div 
                  className="w-12 h-1 mt-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
            </AnimatedBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const StatsBlockSettings = ({ block, updateBlock }: any) => {
  const defaultStats = [
    { label: "Success Rate", value: 98, suffix: "%", icon: "TrendingUp" },
    { label: "Total Students", value: 5000, suffix: "+", icon: "Users" },
    { label: "Hours of Content", value: 200, suffix: "+", icon: "Clock" },
    { label: "Avg. Rank Improvement", value: 45, suffix: "%", icon: "GraduationCap" },
  ];

  const stats = block.content.stats || defaultStats;

  const updateStat = (index: number, key: string, value: string | number) => {
    const newStats = [...stats];
    newStats[index] = { ...newStats[index], [key]: value };
    updateBlock(block.id, { content: { ...block.content, stats: newStats } });
  };

  const removeStat = (index: number) => {
    const newStats = stats.filter((_: any, i: number) => i !== index);
    updateBlock(block.id, { content: { ...block.content, stats: newStats } });
  };

  const addStat = () => {
    const newStats = [...stats, { label: "New Stat", value: 100, suffix: "+", icon: "Award" }];
    updateBlock(block.id, { content: { ...block.content, stats: newStats } });
  };

  return (
    <div className="flex flex-col gap-4 text-sm font-sans pt-2">
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Heading (Optional)</label>
        <input 
          type="text"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-6">
        <label className="text-gray-800 font-black text-xs uppercase tracking-widest flex items-center justify-between">
          <span>Manage Stats</span>
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{stats.length} Items</span>
        </label>
        <p className="text-[10px] font-medium text-gray-500 mb-2">Configure graphic counters and values.</p>
        
        <div className="space-y-3">
          {stats.map((stat: any, idx: number) => (
             <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-center">
                  <input 
                    type="text"
                    value={stat.label}
                    onChange={(e) => updateStat(idx, "label", e.target.value)}
                    className="text-[11px] font-black tracking-tight text-gray-700 uppercase bg-transparent w-full outline-none focus:text-blue-600 flex-1"
                  />
                  <button onClick={() => removeStat(idx)} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-all ml-2">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Value</label>
                    <input 
                      type="number" 
                      value={stat.value} 
                      onChange={(e) => updateStat(idx, "value", Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[11px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Suffix</label>
                    <input 
                      type="text" 
                      value={stat.suffix || ""} 
                      onChange={(e) => updateStat(idx, "suffix", e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[11px] font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Icon</label>
                  <select 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-[11px] font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                    value={stat.icon}
                    onChange={(e) => updateStat(idx, "icon", e.target.value)}
                  >
                    {Object.keys(STAT_ICONS).map(key => <option key={key} value={key}>{key}</option>)}
                  </select>
                </div>
             </div>
          ))}
          <button 
             onClick={addStat}
             className="w-full py-3 mt-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
          >
             <Plus className="w-4 h-4"/> Add Stat
          </button>
        </div>
      </div>
    </div>
  );
};
