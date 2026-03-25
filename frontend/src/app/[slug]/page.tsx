"use client";

import { useEffect, useState, use } from "react";
import { getBlockDefinition } from "@/components/builder/registry";
import { BuilderBlock } from "@/components/builder/types";
import { Loader2 } from "lucide-react";
import { useBuilderStore } from "@/components/builder/store";

export default function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [theme, setTheme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setBatchContext } = useBuilderStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
        const res = await fetch(`${apiUrl}/public/landing-pages/${slug}`);
        const json = await res.json();
        if (json.success && json.data) {
          setBlocks(json.data.config);
          setTheme(json.data.theme);
          
          if (json.data.batch) {
            setBatchContext({ batch: json.data.batch });
          }
        }
      } catch (e) {
        console.error("Failed to fetch landing page", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600/20" />
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-400 font-sans p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="max-w-xs text-gray-500">The landing page you're looking for might have been moved or hasn't been published yet.</p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans selection:bg-blue-500/10 transition-colors duration-500" 
      style={{ 
        fontFamily: theme?.fontFamily,
        backgroundColor: theme?.backgroundColor,
        color: theme?.textColor
      }}
    >
        {blocks.map((block) => {
          const def = getBlockDefinition(block.type);
          if (def && def.component) {
            const Component = def.component;
            return <Component key={block.id} block={block} />;
          }
          return null;
        })}
    </div>
  );
}
