import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";

export const InstructorBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { name: manualName, title: manualTitle, bio: manualBio, autoSync = true } = block.content;
  const { batchContext } = useBuilderStore();
  
  const dbTeacher = batchContext?.teachers?.[0];
  
  const displayName = autoSync && dbTeacher ? dbTeacher.name : (manualName || "Abhishek Sharma");
  const displayTitle = autoSync && dbTeacher ? (dbTeacher.qualification || "Lead Instructor") : (manualTitle || "B.Tech IIT Delhi");
  const displayBio = autoSync && dbTeacher ? (dbTeacher.bio || "An expert educator focused on first principles.") : (manualBio || "With over 10 years of experience coaching students for national level exams, Abhishek simplifies complex mathematics into logical, derivation-based steps rather than blind memorization.");
  const { theme } = useBuilderStore();
  
  return (
    <section 
      style={{ fontFamily: theme.fontFamily }}
      className="py-24 px-6 bg-white flex justify-center overflow-hidden"
    >
      <div className="max-w-4xl w-full bg-gray-50 border border-gray-100 rounded-[2.5rem] p-10 md:p-14 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-12 transition-all hover:shadow-xl hover:bg-gray-50/80">
        
        {/* Profile Avatar */}
        <div 
          style={{ borderColor: theme.primaryColor }}
          className="w-48 h-48 md:w-64 md:h-64 shrink-0 rounded-[2.5rem] bg-white border-4 shadow-2xl overflow-hidden relative group"
        >
          <img 
            src="/professional_instructor_portrait_math_1774373652459.png" 
            alt={displayName}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div 
            style={{ backgroundColor: theme.primaryColor }}
            className="absolute inset-0 opacity-10 mix-blend-overlay"
          />
        </div>

        {/* Bio Content */}
        <div className="flex-1 flex flex-col text-center md:text-left pt-2">
          <div 
            style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}
            className="font-black uppercase tracking-widest text-[11px] px-4 py-1.5 rounded-full w-fit mb-6 mx-auto md:ml-0"
          >
            Lead Educator
          </div>
          
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-3 tracking-tight">
            {displayName}
          </h2>
          
          <h3 className="text-xl md:text-2xl text-gray-400 font-bold mb-8">
            {displayTitle}
          </h3>
          
          <p className="text-[17px] text-gray-600 leading-relaxed font-medium">
            {displayBio}
          </p>
        </div>
      </div>
    </section>
  );
};

export const InstructorBlockSettings = ({ block, updateBlock }: any) => {
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
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Name</label>
        <input 
          type="text"
          placeholder="Instructor Name"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          value={block.content.name || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, name: e.target.value } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Title / Credentials</label>
        <input 
          type="text"
          placeholder="B.Tech IIT Delhi"
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-bold placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
          value={block.content.title || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, title: e.target.value } })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Biography</label>
        <textarea 
          style={{ height: "140px" }}
          placeholder="Brief bio..."
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none shadow-sm"
          value={block.content.bio || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, bio: e.target.value } })}
        />
      </div>
    </div>
  );
};
