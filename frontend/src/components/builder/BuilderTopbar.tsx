"use client";

import { useBuilderStore } from "./store";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Globe, Laptop, Layout, Monitor, Smartphone, Save, Eye, ExternalLink, Database, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function BuilderTopbar({ courseId }: { courseId: string }) {
  const { deviceMode, setDeviceMode, batchContext, setBatchContext } = useBuilderStore();
  const [batches, setBatches] = useState<any[]>([]);
  const [isFetchingBatches, setIsFetchingBatches] = useState(false);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchBatches = async () => {
      setIsFetchingBatches(true);
      try {
        const res = await fetch(`${apiUrl}/dashboard/batches`, { 
          headers: { "Authorization": `Bearer ${token}` },
          credentials: "include" 
        });
        const json = await res.json();
        if (json.success) setBatches(json.batches || []);
      } catch (e) {} finally {
        setIsFetchingBatches(false);
      }
    };
    fetchBatches();
  }, []);

  const handleSave = async () => {
    const context = batchContext?.batch;
    const isDemo = !context || context.id === "demo";

    if (isDemo) {
      toast.error("Batch Not Selected", { 
        description: "Please select a real batch from the dropdown first." 
      });
      return;
    }

    const courseId = context.id;
    const { blocks, theme } = useBuilderStore.getState();

    const saveToast = toast.loading("Deploying changes...");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const res = await fetch(`${apiUrl}/dashboard/batches/${courseId}/landing-page`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ config: blocks, theme })
      });

      const json = await res.json();
      if (res.ok) {
        toast.dismiss(saveToast);
        toast.success("Design published successfully!", {
          description: `Your page is live at /${json.data.slug}`,
          action: {
            label: "View Live",
            onClick: () => window.open(`/${json.data.slug}`, "_blank")
          }
        });
      } else {
        toast.dismiss(saveToast);
        toast.error("Save Failed", { description: "Failed to publish changes. Please try again." });
      }
    } catch (error) {
      toast.dismiss(saveToast);
      toast.error("Save Failed", { description: "Check your connection and try again." });
    }
  };

  const handlePreview = () => {
    const courseId = batchContext?.batch?.id || "demo";
    window.open(`/preview/${courseId}`, "_blank");
  };

  const handleBatchSelect = async (batchId: string) => {
    if (!batchId) return;
    const loadToast = toast.loading("Linking to batch...");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
      const res = await fetch(`${apiUrl}/dashboard/batches/${batchId}/landing-context`, { 
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include" 
      });
      const json = await res.json();
      if (json.success) {
        setBatchContext(json.data);
        toast.dismiss(loadToast);
        toast.success(`Linked to ${json.data.batch.name}`);
      }
    } catch (e) {
      toast.dismiss(loadToast);
    }
  };

  const context = batchContext?.batch;
  const isDemo = !context || context.id === "demo";

  return (
    <header className="h-[70px] bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-30 transition-all duration-300">
      
      {/* Left Axis */}
      <div className="flex items-center gap-6">
        <Link 
          href="/dashboard" 
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 group active:scale-90"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
        </Link>
        
        <div className="flex items-center gap-3 border-l border-gray-100 pl-6">
          <div className="flex flex-col">
            <h1 className="text-[15px] font-black text-gray-900 tracking-tight leading-none mb-1">
              Curriculum Builder <span className="text-[10px] text-blue-600 font-black uppercase ml-1 px-1.5 py-0.5 bg-blue-50 rounded">PRO</span>
            </h1>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                {isDemo ? 'Drafting (Demo Mode)' : `Live: ${context.name}`}
              </span>
            </div>
          </div>

          {isDemo && (
            <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-500">
              <div className="h-8 w-px bg-gray-100 mx-2" />
              <div className="relative flex items-center">
                <Database className="absolute left-3 w-4 h-4 text-gray-400" />
                <select 
                  onChange={(e) => handleBatchSelect(e.target.value)}
                  className="pl-9 pr-8 h-10 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select Target Batch</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {isFetchingBatches && <Loader2 className="absolute right-3 w-3.5 h-3.5 animate-spin text-gray-400" />}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Axis - Viewport Control */}
      <div className="flex flex-1 items-center justify-center absolute left-1/2 -translate-x-1/2 scale-90 sm:scale-100">
        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200/50">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 text-[13px] font-medium ${
              deviceMode === "desktop" 
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            onClick={() => setDeviceMode("mobile")}
            className={`px-4 py-1.5 rounded-md transition-all flex items-center gap-2 text-[13px] font-medium ${
              deviceMode === "mobile" 
                ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Right Axis */}
      <div className="flex items-center gap-4">
        <button 
          onClick={handlePreview}
          className="text-[13px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest px-4"
        >
          Preview
        </button>
        <div className="flex items-center gap-3">
          {batchContext && (
            <a 
              href={`/${batchContext.slug || `batch-${batchContext.id}`}`}
              target="_blank"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
            >
              View Live
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={!courseId}
            className="px-6 py-2.5 rounded-xl text-xs font-black bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-black/10 dark:shadow-white/5 active:scale-95"
          >
            Deploy Changes
          </button>
        </div>
      </div>
    </header>
  );
}
