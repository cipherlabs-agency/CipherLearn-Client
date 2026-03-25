import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";

export const CurriculumBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { title, autoSync = true } = block.content;
  const { batchContext } = useBuilderStore();
  
  const modules = [
    { title: "Foundation: Limits & Continuity", hours: "12 hours", desc: "A rigorous ground-up approach to infinitesimal calculus without rote formulas." },
    { title: "Advanced Derivatives", hours: "16 hours", desc: "Chain rule complexities, implicit differentiation, and optimization problems." },
    { title: "Coordinate Geometry", hours: "24 hours", desc: "Conic sections, deep locus analysis, and intersection logic." },
  ];

  const dbModules = batchContext?.lectures?.map((lecture: any) => ({
    title: lecture.title,
    hours: `${lecture.duration} Mins`,
    desc: lecture.description || "Live interactive session covering core principles."
  })) || [];

  const displayModules = autoSync && dbModules.length > 0 ? dbModules : modules;
  const { theme } = useBuilderStore();

  return (
    <section 
      style={{ fontFamily: theme.fontFamily }}
      className="py-24 px-6 bg-gray-50 flex flex-col items-center"
    >
      <div className="max-w-4xl w-full">
        
        <div className="mb-20 px-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 mb-6">
            {title || "Course Syllabus"}
          </h2>
          <div 
            style={{ backgroundColor: theme.primaryColor }}
            className="w-20 h-1.5 rounded-full"
          />
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          {displayModules.map((mod: any, idx: number) => (
            <div 
              key={idx}
              className={`p-8 sm:p-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6 transition-colors hover:bg-gray-50/50 ${
                idx !== displayModules.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <span 
                    style={{ backgroundColor: `${theme.primaryColor}10`, color: theme.primaryColor }}
                    className="flex items-center justify-center w-10 h-10 rounded-2xl font-black text-sm shrink-0"
                  >
                    {idx + 1}
                  </span>
                  <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                    {mod.title}
                  </h3>
                </div>
                <p className="text-gray-500 text-[17px] leading-relaxed pl-14 font-medium">
                  {mod.desc}
                </p>
              </div>
              <div className="sm:text-right pl-14 sm:pl-0 mt-2 sm:mt-0">
                <div 
                  style={{ backgroundColor: `${theme.primaryColor}05`, color: theme.primaryColor, borderColor: `${theme.primaryColor}10` }}
                  className="inline-flex items-center px-4 py-1.5 border rounded-full text-[12px] font-black uppercase tracking-widest shadow-sm"
                >
                  {mod.hours}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const CurriculumBlockSettings = ({ block, updateBlock }: any) => {
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
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Heading</label>
        <textarea 
          placeholder="Course Syllabus"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[100px] shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
    </div>
  );
};
