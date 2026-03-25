import { BuilderBlock } from "../types";
import { motion } from "framer-motion";
import { useBuilderStore } from "../store";
import { AlignCenter, AlignLeft, ChevronLeft, User, Sparkles } from "lucide-react";
import { useState } from "react";
import { LeadModal } from "../LeadModal";
import { AnimatedBlock } from "../AnimatedBlock";

export const HeroBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title, subtitle, ctaText, variant = "split" } = block.content;
  const { theme, batchContext, updateBlock } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const paddingStyle = {
    paddingTop: `${block.styles?.paddingTop ?? 120}px`,
    paddingBottom: `${block.styles?.paddingBottom ?? 120}px`,
  };

  const bgStyles: Record<string, string> = {
    color: "bg-zinc-50",
    minimal: "bg-white",
    glass: "bg-white/70 backdrop-blur-xl",
    gradient: "bg-gradient-to-b from-white to-zinc-50"
  };

  return (
    <>
      <section 
        style={{ ...paddingStyle, fontFamily: theme.fontFamily }}
        className={`relative overflow-hidden w-full transition-all duration-500 ${bgStyles[block.styles?.backgroundType || 'minimal']}`}
      >
        {/* Subtle Background Layer - Modern Grid */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Soft Background Glows */}
        <div 
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: `${theme.primaryColor}20` }}
        />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className={`flex flex-col ${variant === "split" ? "md:flex-row items-center text-left" : "items-center text-center"} gap-16 md:gap-24`}>
            
            {/* Content Column */}
            <div className={`flex-1 ${variant === "split" ? "" : "max-w-4xl"}`}>
              <AnimatedBlock animation="fade">
                <div 
                  style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}
                  className="px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] inline-flex items-center gap-2 mb-8 border border-current/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Enrollment Now Open • Academic Year 2026
                </div>
              </AnimatedBlock>

              <AnimatedBlock animation="slide-up">
                <h1 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlock(block.id, { content: { ...block.content, title: e.currentTarget.innerText } })}
                  className="text-5xl md:text-7xl font-black text-zinc-900 leading-[1.1] tracking-tight mb-8 outline-none hover:bg-blue-50/50 focus:bg-blue-50/80 rounded-xl transition-all duration-300 p-2 border-2 border-transparent focus:border-blue-200/50"
                >
                  {title || "Master Competitive Mathematics"}
                </h1>
                
                <p 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => updateBlock(block.id, { content: { ...block.content, subtitle: e.currentTarget.innerText } })}
                  className="text-lg md:text-xl text-zinc-500 mb-12 max-w-2xl leading-relaxed font-medium outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
                >
                  {subtitle || "A rigorous ground-up approach to infinitesimal calculus without rote formulas, completely from first principles."}
                </p>

                <div className={`flex flex-col sm:flex-row items-center ${variant === "split" ? "justify-start" : "justify-center"} gap-8`}>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    style={{ backgroundColor: theme.primaryColor }}
                    className="relative px-10 py-5 text-white font-black rounded-2xl text-lg hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-teal-500/20 group overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {ctaText || "Secure Your Seat"}
                      <ChevronLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                  
                  <div className="flex flex-col items-start">
                    <div className="flex -space-x-2.5 mb-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                          {i === 4 ? "5k" : <User className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Global Student Community</p>
                  </div>
                </div>
              </AnimatedBlock>
            </div>

            {/* Visual Column (Variant Dependent) */}
            {variant === "split" && (
              <div className="flex-1 w-full max-w-2xl">
                <AnimatedBlock animation="fade" delay={200}>
                  <div className="relative aspect-[4/3] rounded-[3rem] bg-zinc-50 border border-zinc-100 shadow-2xl overflow-hidden group">
                    <img 
                      src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=2000" 
                      alt="Education" 
                      className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                    
                    {/* Floating Info UI Card */}
                    <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-2xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-teal-500 flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-900 uppercase">Top 1% Coach</p>
                          <p className="text-[10px] font-medium text-zinc-500">Mentoring Olympiad Winners</p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-600 text-[10px] font-bold">
                        Live Sessions
                      </div>
                    </div>
                  </div>
                </AnimatedBlock>
              </div>
            )}
          </div>
        </div>
      </section>

      <LeadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        batchId={batchContext?.batch?.id}
      />
    </>
  );
};

export const HeroBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="space-y-3">
        <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Layout Variant</label>
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
          <button
            onClick={() => updateBlock(block.id, { content: { ...block.content, variant: "centered" } })}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              (block.content.variant || "split") === "centered" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlignCenter className="w-4 h-4" />
            <span className="text-xs font-bold">Centered</span>
          </button>
          <button
            onClick={() => updateBlock(block.id, { content: { ...block.content, variant: "split" } })}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
              (block.content.variant || "split") === "split" ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span className="text-xs font-bold">Split</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Headline</label>
        <textarea 
          placeholder="Main Title"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Subtitle</label>
        <textarea 
          placeholder="Supporting text"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[120px] shadow-sm"
          value={block.content.subtitle || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, subtitle: e.target.value } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Top Divider</label>
          <select 
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={block.styles?.dividerBottom || "none"}
            onChange={(e) => updateBlock(block.id, { styles: { ...block.styles, dividerBottom: e.target.value } })}
          >
            <option value="none">None</option>
            <option value="wave">Wave</option>
            <option value="curve">Curve</option>
          </select>
        </div>
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

      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">CTA Text</label>
        <input 
          type="text"
          placeholder="Enroll Now"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          value={block.content.ctaText || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, ctaText: e.target.value } })}
        />
      </div>
    </div>
  );
};
