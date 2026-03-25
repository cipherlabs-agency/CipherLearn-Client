import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";

export const RichTextBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { content } = block.content;
  const { theme } = useBuilderStore();
  
  return (
    <section 
      style={{ fontFamily: theme.fontFamily }}
      className="py-24 px-6 bg-white flex justify-center"
    >
      <div className="max-w-3xl w-full">
        <article className="prose prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed font-medium">
          <div 
            className="rich-text-container"
            style={{ 
              '--tw-prose-headings': '#111827',
              '--tw-prose-links': theme.primaryColor,
              '--tw-prose-bold': '#111827',
              '--tw-prose-bullets': theme.primaryColor,
            } as any}
            dangerouslySetInnerHTML={{ __html: content || `
            <h2>Program Methodology</h2>
            <p>Our curriculum is built entirely around <strong>first-principles thinking</strong>. We do not provide sheets of formulas to memorize. Instead, we begin with foundational axioms and rigorously prove every subsequent lemma.</p>
            <ul>
              <li><strong>Rigorous Axiomatic Foundation:</strong> Every class begins with basic truths.</li>
              <li><strong>Geometric Visualization:</strong> Algebraic concepts are mapped to geometric realities.</li>
              <li><strong>Progressive Overload:</strong> Problems systematically transition from trivial to Olympian.</li>
            </ul>
            <p>If you are looking for quick hacks or rote algorithms, this course is not for you. If you want to view mathematics as a cohesive, deterministic framework, enroll today.</p>
          `}} />
        </article>
      </div>
    </section>
  );
};

export const RichTextBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="flex flex-col gap-6 text-sm font-sans pt-2">
      <div className="flex flex-col gap-2">
        <label className="text-gray-600 font-bold text-xs uppercase tracking-wider">Content (HTML)</label>
        <textarea 
          placeholder="<h2>Heading</h2><p>Text...</p>"
          className="w-full bg-white border border-gray-200 rounded-xl p-4 text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none min-h-[300px] font-mono text-xs leading-relaxed shadow-sm"
          value={block.content.content || ""}
          onChange={(e) => updateBlock(block.id, { content: { ...block.content, content: e.target.value } })}
        />
      </div>
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500 font-mono leading-relaxed">
        Supports h2, h3, p, ul, li, strong, em, and a tags. Styles automatically inherit your global theme.
      </div>
    </div>
  );
};
