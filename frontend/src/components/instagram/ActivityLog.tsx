import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    CheckCircle2, XCircle, AlertTriangle, MessageCircle, 
    Search, RefreshCw, FileText, Send, User, Bot
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
                        <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/60" />
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
                        className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
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
                        className="h-8 w-8 ml-auto shrink-0 border border-transparent hover:border-border hover:bg-muted"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Logs List - Chat UI */}
            {filteredLogs.length === 0 ? (
                <div className="card-vercel flex flex-col items-center justify-center py-16 text-center bg-muted/30">
                    <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
                    <h3 className="text-[14px] font-bold text-foreground tracking-tight">No conversations found</h3>
                    <p className="mt-1.5 text-sm text-muted-vercel max-w-sm">
                        {searchTerm || statusFilter !== "ALL" 
                            ? "Try tweaking your filters or search terms." 
                            : "When users comment on your posts, the automated conversations will appear here."}
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
                <div className="space-y-6">
                    <AnimatePresence>
                        {filteredLogs.map((log, i) => {
                            const isError = log.dmStatus !== "SENT"
                            const rule = log.rule as any
                            const ruleButtons = rule?.dmButtons as Array<{ title: string; url: string }> | null
                            
                            return (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: Math.min(i * 0.05, 0.3) }}
                                    className="card-vercel p-5 flex flex-col gap-5 border border-border shadow-sm"
                                >
                                    {/* --- User Message Bubble --- */}
                                    <div className="flex gap-3 justify-start items-end max-w-[85%]">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-[11px] font-medium text-muted-foreground ml-1">
                                                @{log.commenterUsername || "user"} • {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className="bg-muted px-4 py-2.5 rounded-2xl rounded-bl-sm border border-border text-[14px] text-foreground leading-relaxed shadow-sm">
                                                {log.commentText}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
                                                <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-widest bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                                                    Matched: {log.rule?.triggerKeyword}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Bot Reply Bubble --- */}
                                    <div className="flex gap-3 justify-end items-end w-full">
                                        <div className="flex flex-col gap-1 items-end w-full max-w-[75%]">
                                            <span className="text-[11px] font-medium text-muted-foreground mr-1 flex items-center gap-1.5">
                                                {isError ? (
                                                    <span className="text-destructive font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Failed</span>
                                                ) : (
                                                    <span className="text-emerald-500 font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sent</span>
                                                )}
                                                • Automation Bot
                                            </span>
                                            
                                            <div className="w-full flex flex-col gap-1.5">
                                                <div className={`px-4 py-2.5 rounded-2xl rounded-br-sm text-[14px] leading-relaxed shadow-sm text-left ${isError ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                                                    {(log.rule as any)?.dmMessage || "No message content"}
                                                </div>
                                                
                                                {/* Rich DM Buttons Preview */}
                                                {!isError && ruleButtons && ruleButtons.length > 0 && (
                                                    <div className="flex flex-col gap-1.5 ml-auto w-full max-w-[280px]">
                                                        {ruleButtons.map((btn, idx) => (
                                                            <div key={idx} className="w-full py-2 bg-muted/50 border border-border rounded-lg text-center text-[13px] font-medium text-primary hover:bg-muted transition-colors truncate px-3">
                                                                {btn.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Error Message Details */}
                                            {isError && log.errorMessage && (
                                                <div className="text-[11px] text-destructive/80 font-mono bg-destructive/5 px-2.5 py-1.5 rounded border border-destructive/10 mt-1 self-end text-right">
                                                    {log.errorMessage}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${isError ? 'bg-destructive/10 border-destructive/20' : 'bg-primary/10 border-primary/20'}`}>
                                            <Bot className={`h-4 w-4 ${isError ? 'text-destructive' : 'text-primary'}`} />
                                        </div>
                                    </div>

                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    )
}
