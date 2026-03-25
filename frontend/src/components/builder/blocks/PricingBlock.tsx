import { BuilderBlock } from "../types";
import { Check } from "lucide-react";
import { useState } from "react";
import { useBuilderStore } from "../store";
import { LeadModal } from "../LeadModal";

export const PricingBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title, subtitle, autoSync = true } = block.content;
  const { theme, batchContext, updateBlock } = useBuilderStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const tiers = [
    {
      name: "Standard Access",
      price: "₹4,999",
      period: "one-time",
      desc: "Complete access to all pre-recorded modules and standard problem sets.",
      features: ["All Recorded Lectures", "Standard Assignments", "Email Support"],
      popular: false,
    },
    {
      name: "Premium Mentorship",
      price: "₹9,999",
      period: "one-time",
      desc: "Dedicated attention, live doubts, and advanced placement tracking.",
      features: ["All Recorded Lectures", "Live Weekend Sessions", "1-on-1 Mentorship", "Priority Whatsapp Support"],
      popular: true,
    }
  ];

  const dbTiers = batchContext?.fees?.map((fee: any) => ({
    name: fee.name,
    price: `₹${fee.amount}`,
    period: fee.frequency.toLowerCase(),
    desc: fee.description || "Comprehensive fee structure.",
    features: ["Access to all modules", "Live Doubt Resolution", "Standard Support"],
    popular: fee.amount > 2000,
  })) || [];

  const displayTiers = autoSync && dbTiers.length > 0 ? dbTiers : tiers;

  return (
    <>
      <section 
        style={{ fontFamily: theme.fontFamily }}
        className="py-24 px-6 bg-white relative"
      >
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-20 lg:max-w-2xl">
            <h2 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: { ...block.content, title: e.currentTarget.innerText } })}
              className="text-4xl md:text-5xl font-[1000] tracking-[-0.04em] text-zinc-900 mb-6 outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
            >
              {title || "Transparent Investment"}
            </h2>
            <p 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => updateBlock(block.id, { content: { ...block.content, subtitle: e.currentTarget.innerText } })}
              className="text-lg md:text-xl text-zinc-500 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 rounded-lg transition-all"
            >
              {subtitle || "No hidden fees. Select the structure that best fits your preparation intensity."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {displayTiers.map((tier: any, idx: number) => (
              <div 
                key={idx}
                className={`relative flex flex-col p-10 md:p-14 rounded-3xl border transition-all duration-500 hover:shadow-2xl ${
                  tier.popular 
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-2xl shadow-zinc-900/20" 
                  : "bg-white border-zinc-100 text-zinc-900 shadow-sm"
                }`}
              >
                {tier.popular && (
                  <div 
                    style={{ backgroundColor: theme.primaryColor }}
                    className="absolute top-8 right-8 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full"
                  >
                    Best Value
                  </div>
                )}

                <div className="mb-10">
                  <h3 className="text-xl font-black uppercase tracking-widest mb-4 opacity-60">{tier.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-[1000] tracking-[-0.04em]">{tier.price}</span>
                    <span className="text-sm font-bold opacity-40 uppercase tracking-widest">/{tier.period}</span>
                  </div>
                </div>

                <p className={`text-lg font-medium mb-10 leading-relaxed ${tier.popular ? "text-zinc-400" : "text-zinc-500"}`}>
                  {tier.desc}
                </p>

                <div className="space-y-4 flex-1 mb-12">
                  {tier.features.map((feature: string, fIdx: number) => (
                    <div key={fIdx} className="flex items-start gap-4">
                      <div 
                        style={{ color: (theme.primaryColor) }}
                        className="mt-1 p-0.5"
                      >
                        <Check className="w-4 h-4" strokeWidth={4} />
                      </div>
                      <span className={`text-[15px] font-bold ${tier.popular ? "text-zinc-200" : "text-zinc-700"}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setIsModalOpen(true)}
                  style={{ 
                    backgroundColor: tier.popular ? theme.primaryColor : "transparent",
                    color: tier.popular ? "#ffffff" : "inherit",
                    borderColor: tier.popular ? "transparent" : "#e5e7eb"
                  }}
                  className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] border-2"
                >
                  Enroll Now
                </button>
              </div>
            ))}
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

export const PricingBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl shadow-inner">
        <label className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">Connect Database</label>
        <input 
          type="checkbox" 
          checked={block.content.autoSync !== false}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, autoSync: e.target.checked } })}
          className="accent-blue-600 w-5 h-5 cursor-pointer rounded-lg"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Headline</label>
        <textarea 
          placeholder="Transparent Investment"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Subtitle</label>
        <textarea 
          placeholder="No hidden fees..."
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[120px] shadow-sm"
          value={block.content.subtitle || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, subtitle: e.target.value } })}
        />
      </div>
    </div>
  );
};
