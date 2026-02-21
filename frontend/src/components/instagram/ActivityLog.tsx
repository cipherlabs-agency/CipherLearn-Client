"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    CheckCircle2, XCircle, AlertTriangle, MessageCircle, 
    Search, Filter, Clock, RefreshCw, FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetAllLogsQuery, useGetInstagramAccountQuery } from "@/redux/api/instagramApi"

export function ActivityLog() {
    const { data: account } = useGetInstagramAccountQuery()
    const { data: logData, isLoading, isError, refetch, isFetching } = useGetAllLogsQuery(
        {}, 
        { skip: !account }
    )
    
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "SENT" | "FAILED" | "RATE_LIMITED">("ALL")

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="h-10 w-full md:w-64 animate-pulse rounded-lg bg-muted" />
                    <div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/60" />
                    ))}
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="card-vercel flex flex-col items-center justify-center py-20 text-center w-full">
                <AlertTriangle className="mb-4 h-12 w-12 text-destructive opacity-50" />
                <h3 className="text-lg font-bold text-foreground tracking-tight">
                    Failed to load activity log
                </h3>
                <p className="mt-2 text-sm text-muted-vercel">
                    There was an error connecting to our servers.
                </p>
                <div className="mt-6">
                    <Button onClick={refetch} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const allLogs = logData?.logs || []
    
    // Client-side filtering
    const filteredLogs = allLogs.filter(log => {
        const matchesStatus = statusFilter === "ALL" || log.dmStatus === statusFilter
        const searchTarget = `${log.commenterUsername || ''} ${log.commentText || ''} ${log.rule?.triggerKeyword || ''}`.toLowerCase()
        const matchesSearch = !searchTerm || searchTarget.includes(searchTerm.toLowerCase())
        return matchesStatus && matchesSearch
    })

    return (
        <div className="space-y-6">
            {/* Header / Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                        type="text"
                        placeholder="Search users, comments, or intents..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                    />
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
                    <Button 
                        variant={statusFilter === "ALL" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setStatusFilter("ALL")}
                        className="rounded-full h-8 px-4 text-xs font-semibold whitespace-nowrap"
                    >
                        All Activity
                    </Button>
                    <Button 
                        variant={statusFilter === "SENT" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setStatusFilter("SENT")}
                        className="rounded-full h-8 px-4 text-xs font-semibold whitespace-nowrap"
                    >
                        Success
                    </Button>
                    <Button 
                        variant={statusFilter === "FAILED" ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setStatusFilter("FAILED")}
                        className="rounded-full h-8 px-4 text-xs font-semibold whitespace-nowrap"
                    >
                        Errors
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={refetch}
                        disabled={isFetching}
                        className="h-8 w-8 ml-auto shrink-0"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length === 0 ? (
                <div className="card-vercel flex flex-col items-center justify-center py-16 text-center bg-muted/30">
                    <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    <h3 className="text-[14px] font-bold text-foreground tracking-tight">No activity found</h3>
                    <p className="mt-1.5 text-sm text-muted-vercel">
                        {searchTerm || statusFilter !== "ALL" 
                            ? "Try tweaking your filters or search terms." 
                            : "When your automations start running, their activity will appear here."}
                    </p>
                    {(searchTerm || statusFilter !== "ALL") && (
                        <Button 
                            variant="link" 
                            className="mt-2 text-primary"
                            onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3 relative">
                    {/* Activity Line (Timeline visual) */}
                    <div className="absolute left-6 top-4 bottom-4 w-px bg-border/50 z-0 hidden sm:block" />
                    
                    <AnimatePresence>
                        {filteredLogs.map((log, i) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(i * 0.05, 0.5) }}
                                className="relative z-10 sm:pl-16" // Space for timeline
                            >
                                {/* Timeline Node (Desktop only) */}
                                <div className="absolute left-[20px] top-1/2 -translate-y-1/2 hidden sm:flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border">
                                    {log.dmStatus === "SENT" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    ) : log.dmStatus === "RATE_LIMITED" ? (
                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                </div>

                                {/* Main Card */}
                                <div className="card-vercel p-0 overflow-hidden transition-colors hover:border-primary/30 group">
                                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center">
                                        
                                        {/* Mobile Status Header */}
                                        <div className="flex sm:hidden items-center gap-2 w-full pb-3 border-b border-border/50">
                                            {log.dmStatus === "SENT" ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> SENT
                                                </div>
                                            ) : log.dmStatus === "RATE_LIMITED" ? (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500">
                                                    <AlertTriangle className="h-3.5 w-3.5" /> RATE_LIMITED
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                                                    <XCircle className="h-3.5 w-3.5" /> FAILED
                                                </div>
                                            )}
                                            <div className="ml-auto text-xs text-muted-vercel flex items-center gap-1 tabular-nums">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* User & Intent */}
                                        <div className="flex-1 min-w-0 w-full">
                                            <div className="flex items-baseline gap-2 mb-1.5">
                                                <span className="font-bold text-[14px] text-foreground tracking-tight truncate">
                                                    @{log.commenterUsername || "instagram_user"}
                                                </span>
                                                <span className="text-xs text-muted-vercel border border-border bg-muted/50 px-1.5 py-0.5 rounded">
                                                    {log.rule?.triggerKeyword}
                                                </span>
                                            </div>
                                            
                                            {/* Original Comment */}
                                            <div className="flex items-start gap-2 text-[13px] text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/50 w-full">
                                                <MessageCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 opacity-50" />
                                                <span className="line-clamp-2 leading-relaxed">"{log.commentText}"</span>
                                            </div>
                                        </div>

                                        {/* Desktop Meta & Status */}
                                        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0 min-w-[140px]">
                                            <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1 tabular-nums">
                                                <Clock className="h-3 w-3" />
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                <span className="text-border mx-1">•</span>
                                                {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                            </div>
                                            {(log.rule as any)?.dmType === "TEMPLATE" && (
                                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded">
                                                    Rich DM
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Error Details if any */}
                                    {log.dmStatus !== "SENT" && log.errorMessage && (
                                        <div className="bg-destructive/5 px-5 py-3 border-t border-destructive/10 text-[12px] text-destructive/80 font-medium font-mono">
                                            Error: {log.errorMessage}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
