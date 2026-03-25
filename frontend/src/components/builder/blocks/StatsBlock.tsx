"use client";

import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";
import { AnimatedBlock } from "../AnimatedBlock";
import { Users, GraduationCap, TrendingUp, Award, Clock } from "lucide-react";
import { useEffect, useState } from "react";

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

  const stats = [
    { label: "Success Rate", value: 98, suffix: "%", icon: TrendingUp },
    { label: "Total Students", value: 5000, suffix: "+", icon: Users },
    { label: "Hours of Content", value: 200, suffix: "+", icon: Clock },
    { label: "Avg. Rank Improvement", value: 45, suffix: "%", icon: GraduationCap },
  ];

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
          {stats.map((stat, i) => (
            <AnimatedBlock key={i} animation="fade" delay={i * 100}>
              <div className="flex flex-col items-start group">
                <div 
                  style={{ color: theme.primaryColor }}
                  className="mb-6 group-hover:scale-110 transition-transform duration-500"
                >
                  <stat.icon className="w-8 h-8 opacity-40" />
                </div>
                <div className="text-6xl md:text-7xl font-[1000] text-zinc-900 mb-3 tracking-[-0.06em] leading-none">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">{stat.label}</div>
                
                {/* Minimal Accent line */}
                <div 
                  className="w-12 h-1 mt-6 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"
                  style={{ backgroundColor: theme.primaryColor }}
                />
              </div>
            </AnimatedBlock>
          ))}
        </div>
      </div>
    </section>
  );
};

export const StatsBlockSettings = ({ block, updateBlock }: any) => {
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
    </div>
  );
};
