import { BuilderBlock } from "../types";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useBuilderStore } from "../store";

export const FAQBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title } = block.content;
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { theme } = useBuilderStore();

  const faqs = [
    { q: "Is this suitable for absolute beginners?", a: "Yes. We start from absolute first principles. However, the pacing is rigorous, so be prepared to put in the hours." },
    { q: "Do you cover Advanced level problems?", a: "Every concept builds up to Advanced tier. We don't separate 'Mains' from 'Advanced'; mathematics is unified." },
    { q: "Can I watch recordings if I miss a live class?", a: "Yes, all enrolled students have unrestricted access to HD recordings within 24 hours of the live session." },
    { q: "Is doubt resolving included?", a: "Premium Mentorship includes priority Whatsapp resolution and live weekend doubt classes. Standard tier relies on forum support." }
  ];

  return (
    <section 
      style={{ fontFamily: theme.fontFamily }}
      className="py-24 px-6 bg-white flex flex-col items-center"
    >
      <div className="max-w-3xl w-full">
        <div className="text-center mb-20 px-4">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            {title || "Common Questions"}
          </h2>
          <div 
            style={{ backgroundColor: theme.primaryColor }}
            className="w-16 h-1.5 mx-auto rounded-full"
          />
        </div>

        <div className="flex flex-col gap-5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div 
                key={idx}
                className={`bg-white border rounded-[2rem] overflow-hidden transition-all duration-300 ${
                  isOpen ? "shadow-2xl" : "border-gray-100 hover:border-gray-200 shadow-sm"
                }`}
                style={{ borderColor: isOpen ? theme.primaryColor : undefined, boxShadow: isOpen ? `0 20px 40px -15px ${theme.primaryColor}15` : undefined }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-8 py-7 flex items-center justify-between text-left focus:outline-none"
                >
                  <span 
                    style={{ color: isOpen ? theme.primaryColor : undefined }}
                    className={`font-bold text-lg md:text-xl transition-colors ${isOpen ? "" : "text-gray-900"}`}
                  >
                    {faq.q}
                  </span>
                  <div 
                    style={{ backgroundColor: isOpen ? `${theme.primaryColor}10` : undefined, color: isOpen ? theme.primaryColor : undefined }}
                    className={`shrink-0 ml-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isOpen ? "" : "bg-gray-50 text-gray-400"}`}
                  >
                    <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[300px] opacity-100 pb-8" : "max-h-0 opacity-0"
                  }`}
                >
                  <p className="px-8 text-gray-500 leading-relaxed text-[17px] font-medium border-t border-gray-50 pt-6 mt-1">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const FAQBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Heading</label>
        <textarea 
          placeholder="Common Questions"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
    </div>
  );
};
