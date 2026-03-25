import { BuilderBlock } from "../types";
import { Star } from "lucide-react";
import { useBuilderStore } from "../store";

export const TestimonialsBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title } = block.content;
  const { theme } = useBuilderStore();
  
  const testimonials = [
    { text: "The first principles approach changed everything for me. I finally stopped memorizing formulas and started actually understanding the logic.", author: "Rohan M.", role: "AIR 43, JEE Adv 2023" },
    { text: "My coordinate geometry was terrible until I took this course. The visualization and foundational emphasis is unmatched.", author: "Priya S.", role: "AIR 112, JEE Adv 2023" },
    { text: "Highly structured, disciplined, and genuinely focuses on deep learning rather than superficial tricks.", author: "Karthik V.", role: "BITS Pilani" }
  ];

  return (
    <section 
      style={{ fontFamily: theme.fontFamily }}
      className="py-24 px-6 bg-gray-50 flex flex-col items-center"
    >
      <div className="max-w-6xl w-full">
        
        <div className="text-center mb-20 px-4">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6 tracking-tight">
            {title || "Student Success"}
          </h2>
          <div 
            style={{ backgroundColor: theme.primaryColor }}
            className="w-24 h-1.5 mx-auto rounded-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {testimonials.map((t, idx) => (
            <div 
              key={idx}
              className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-between transition-all hover:shadow-xl hover:border-gray-200 active:scale-[0.98]"
            >
              <div className="mb-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      style={{ color: theme.primaryColor, fill: theme.primaryColor }}
                      className="w-5 h-5 opacity-80" 
                    />
                  ))}
                </div>
                <p className="text-gray-600 italic text-[17px] leading-relaxed font-medium">
                  "{t.text}"
                </p>
              </div>
              <div className="border-t border-gray-50 pt-6">
                <span className="block font-black text-gray-900 text-[16px]">{t.author}</span>
                <span 
                  style={{ color: theme.primaryColor }}
                  className="block text-[12px] font-black uppercase tracking-widest mt-1 opacity-80"
                >
                  {t.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const TestimonialsBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Heading</label>
        <textarea 
          placeholder="Student Success"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
    </div>
  );
};
