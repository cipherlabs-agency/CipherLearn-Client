"use client";

import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutTemplate, ArrowRight, MousePointer2, Sparkles, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Batch } from "@/types";

export default function BuilderIndexPage() {
  const { data: batches, isLoading, isError } = useGetAllBatchesQuery();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-muted/40" />
          <Skeleton className="h-4 w-96 bg-muted/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl bg-muted/20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Axis */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-10">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 w-fit">
            <Sparkles className="w-3.5 h-3.5 fill-blue-600/20" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Growth Engine</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Landing Page Builder
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl font-medium leading-relaxed">
            Select a batch to design its official marketing page. All data syncs automatically with your curriculum and fee structure.
          </p>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 text-muted-foreground/40 pb-2">
          <div className="flex flex-col items-center gap-1">
            <MousePointer2 className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Drag</span>
          </div>
          <div className="w-8 h-[1px] bg-border/40" />
          <div className="flex flex-col items-center gap-1">
            <Globe className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase">Publish</span>
          </div>
        </div>
      </div>

      {/* Batch Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {batches?.map((batch: Batch) => (
          <div 
            key={batch.id}
            onClick={() => router.push(`/builder/${batch.id}`)}
            className="group relative bg-white border border-border/60 rounded-[2rem] p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col h-full active:scale-[0.98]"
          >
            <div className="flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-border/40 flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                <LayoutTemplate className="w-7 h-7 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-700 transition-colors">
                {batch.name}
              </h3>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-6">
                Generate a high-converting landing page for {batch.name}. Includes pricing, schedule, and instructor data.
              </p>
            </div>

            <div className="pt-6 border-t border-border/40 flex items-center justify-between">
              <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest">
                ID: {batch.id}
              </span>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <span>Start Building</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Subtle Gradient Hover Effect */}
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
          </div>
        ))}

        {(!batches || batches.length === 0) && !isLoading && (
          <div className="col-span-full py-20 border-2 border-dashed border-border/40 rounded-[2rem] flex flex-col items-center justify-center text-center bg-muted/5">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <LayoutTemplate className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No active batches found</h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              You need at least one active batch to create a landing page.
            </p>
            <button 
              onClick={() => router.push("/batches")}
              className="px-6 py-2.5 bg-foreground text-background font-bold rounded-full hover:opacity-90 active:scale-95 transition-all text-sm"
            >
              Go to Batches
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
