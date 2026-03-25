import { BuilderBlock } from "../types";
import { useBuilderStore } from "../store";
import { AnimatedBlock } from "../AnimatedBlock";

export const TrustBlockComponent = ({ block }: { block: BuilderBlock }) => {
  const { theme } = useBuilderStore();
  
  const logos = [
    { name: "IIT Delhi", url: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/IIT_Delhi_logo.svg/1200px-IIT_Delhi_logo.svg.png" },
    { name: "BITS Pilani", url: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/BITS_Pilani-logo.svg/1200px-BITS_Pilani-logo.svg.png" },
    { name: "NIT Trichy", url: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/NIT_Trichy_logo.svg/1200px-NIT_Trichy_logo.svg.png" },
    { name: "IISC Bangalore", url: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/IISc_logo.svg/1200px-IISc_logo.svg.png" }
  ];

  return (
    <section className="py-12 px-6 bg-white border-y border-zinc-100 flex flex-col items-center">
      <AnimatedBlock animation="fade">
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-12">Trusted by Alumni from Leading Institutions</p>
      </AnimatedBlock>
      
      <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 px-4">
        {logos.map((logo, i) => (
          <AnimatedBlock key={i} animation="fade" delay={i * 100}>
            <img 
              src={logo.url} 
              alt={logo.name} 
              className="h-8 md:h-10 object-contain opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 cursor-crosshair pb-1" 
            />
          </AnimatedBlock>
        ))}
      </div>
    </section>
  );
};

export const TrustBlockSettings = ({ block, updateBlock }: any) => {
  return (
    <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-zinc-100">
      <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">
        Academic Institutional Logos are dynamically managed for elite brand alignment.
      </p>
    </div>
  );
};
