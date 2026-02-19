"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from "lucide-react"
import { BatchList } from "@/components/batches/BatchList"
import { CreateBatchDialog } from "@/components/batches/CreateBatchDialog"

export default function BatchesPage() {
    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Batches
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">Organise your classes, schedules, and student groups.</p>
                </div>
                <CreateBatchDialog />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        type="search"
                        placeholder="Search batches..."
                        className="w-full pl-9 pr-4 h-9 bg-muted/30 border border-border/50 rounded-md text-[13px] focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none"
                    />
                </div>
                <Button 
                    variant="outline" 
                    className="h-9 px-3 gap-2 border-border/80 text-xs font-semibold hover:bg-muted transition-colors"
                >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                </Button>
            </div>

            <BatchList />
        </div>
    )
}
