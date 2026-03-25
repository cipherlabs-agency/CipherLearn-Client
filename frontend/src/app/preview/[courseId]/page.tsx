"use client";

import { useEffect, useState } from "react";
import { getBlockDefinition } from "@/components/builder/registry";
import { BuilderBlock } from "@/components/builder/types";

export default function PreviewPage() {
  const [blocks, setBlocks] = useState<BuilderBlock[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const fetchFromDB = async () => {
      // Get courseId from URL
      const pathParts = window.location.pathname.split('/');
      const courseId = pathParts[pathParts.length - 1];
      
      if (!courseId || courseId === "demo") return;

      try {
        const res = await fetch(`/api/v1/dashboard/batches/${courseId}/landing-page`);
        const json = await res.json();
        if (json.success && json.data) {
          setBlocks(json.data.config);
        }
      } catch (e) {
        console.error("Failed to fetch from DB", e);
      }
    };

    // Try local storage first (for instant preview)
    const stored = localStorage.getItem("builder-storage");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.state && parsed.state.blocks) {
          setBlocks(parsed.state.blocks);
          return; // Skip DB fetch if we have local unsaved changes
        }
      } catch (e) {}
    }

    fetchFromDB();
  }, []);

  if (!isClient) return null;

  if (blocks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <p className="text-white/40">No blocks published yet.</p>
      </div>
    );
  }

  const { theme } = JSON.parse(localStorage.getItem("builder-storage") || "{}")?.state || { theme: { backgroundColor: "#000000", textColor: "#ffffff" } };

  return (
    <div 
      className="min-h-screen font-sans selection:bg-purple-500/30 transition-colors duration-500"
      style={{ 
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
        fontFamily: theme.fontFamily
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
