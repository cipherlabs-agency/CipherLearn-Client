import { BuilderBlock } from "../types";
import { BookOpen, Target, Award, LayoutGrid, List } from "lucide-react";
import { useBuilderStore } from "../store";
import { AnimatedBlock } from "../AnimatedBlock";

export const FeaturesBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title, layout = "grid" } = block.content;
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

  const features = [
    { title: "First Principles Logic", icon: BookOpen, desc: "We derive every single formula from scratch so you never have to blindly memorize." },
    { title: "Exam-Oriented Approach", icon: Target, desc: "Direct mapping of fundamental concepts to advanced competitive exam patterns." },
    { title: "Top Percentile Results", icon: Award, desc: "Our methodology consistently produces single-digit ranks in national examinations." }
  ];

  return (
    <section 
      style={{ ...paddingStyle, fontFamily: theme.fontFamily }}
      className={`relative px-6 transition-all duration-500 ${bgStyles[block.styles?.backgroundType || 'minimal']}`}
    >
      <div className="max-w-7xl mx-auto w-full">
        
        <div className="mb-20">
          <h2 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => updateBlock(block.id, { content: { ...block.content, title: e.currentTarget.innerText } })}
            className="text-4xl md:text-5xl font-[1000] tracking-[-0.04em] text-zinc-900 mb-6 lg:max-w-2xl outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
          >
            {title || "Why Choose Our Methodology?"}
          </h2>
          <div 
            style={{ backgroundColor: theme.primaryColor }}
            className="w-16 h-1 rounded-full opacity-30"
          />
        </div>

        <div className={`grid gap-16 md:gap-12 lg:gap-20 ${layout === "list" ? "grid-cols-1 max-w-3xl" : "grid-cols-1 md:grid-cols-3"}`}>
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <AnimatedBlock key={idx} animation={block.styles?.animation || "fade"} delay={idx * 100}>
                <div 
                  className={`flex flex-col items-start group ${
                    layout === "list" ? "md:flex-row md:items-center gap-10" : ""
                  }`}
                >
                  <div 
                    style={{ backgroundColor: `${theme.primaryColor}10`, color: theme.primaryColor }}
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-sm"
                  >
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">{feat.title}</h3>
                    <p className="text-zinc-500 text-lg leading-relaxed font-medium">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </AnimatedBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const FeaturesBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="space-y-3">
        <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Layout Style</label>
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => updateBlock(block.id, { content: { ...block.content, layout: "grid" } })}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              (block.content.layout || "grid") === "grid" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="text-xs font-bold">Grid</span>
          </button>
          <button
            onClick={() => updateBlock(block.id, { content: { ...block.content, layout: "list" } })}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              block.content.layout === "list" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <List className="w-4 h-4" />
            <span className="text-xs font-bold">List</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Heading</label>
        <textarea 
          placeholder="Features Title"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Entrance Animation</label>
        <select 
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          value={block.styles?.animation || "slide-up"}
          onChange={(e) => updateBlock(block.id, { styles: { ...block.styles, animation: e.target.value } })}
        >
          <option value="fade">Fade In</option>
          <option value="slide-up">Slide Up</option>
          <option value="slide-left">Slide Left</option>
          <option value="slide-right">Slide Right</option>
          <option value="zoom">Zoom In</option>
          <option value="none">None</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Top Divider</label>
          <select 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            value={block.styles?.dividerTop || "none"}
            onChange={(e) => updateBlock(block.id, { styles: { ...block.styles, dividerTop: e.target.value } })}
          >
            <option value="none">None</option>
            <option value="wave">Wave</option>
            <option value="curve">Curve</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Bottom Divider</label>
          <select 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            value={block.styles?.dividerBottom || "none"}
            onChange={(e) => updateBlock(block.id, { styles: { ...block.styles, dividerBottom: e.target.value } })}
          >
            <option value="none">None</option>
            <option value="wave">Wave</option>
            <option value="curve">Curve</option>
          </select>
        </div>
      </div>
    </div>
  );
};
