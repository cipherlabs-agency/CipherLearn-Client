"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap, Plus, Trash2, Play, Pause, Send, ExternalLink,
    Heart, MessageCircle, Clock, CheckCircle2, XCircle, AlertTriangle,
    ChevronDown, ChevronUp, Link as LinkIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    useGetAutomationRulesQuery,
    useCreateAutomationRuleMutation,
    useUpdateAutomationRuleMutation,
    useDeleteAutomationRuleMutation,
    useGetRuleLogsQuery,
} from "@/redux/api/instagramApi"
import type { IgMedia, AutomationRule } from "@/redux/api/instagramApi"

interface AutomationPanelProps {
    post: IgMedia
    onClose: () => void
}

export function AutomationPanel({ post, onClose }: AutomationPanelProps) {
    const { data: rules = [], isLoading } = useGetAutomationRulesQuery({
        mediaId: post.id,
    })
    const [createRule, { isLoading: creating }] = useCreateAutomationRuleMutation()
    const [updateRule] = useUpdateAutomationRuleMutation()
    const [deleteRule] = useDeleteAutomationRuleMutation()

    const [showForm, setShowForm] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [dmMessage, setDmMessage] = useState("")
    
    // Rich DM State
    const [dmType, setDmType] = useState<"TEXT" | "TEMPLATE">("TEXT")
    const [buttons, setButtons] = useState<Array<{ title: string; url: string }>>([])
    
    // Follow Gate State
    const [isFollowGated, setIsFollowGated] = useState(false)
    const [unfollowedMessage, setUnfollowedMessage] = useState("")

    const [expandedLog, setExpandedLog] = useState<number | null>(null)

    const handleAddButton = () => {
        if (buttons.length < 3) {
            setButtons([...buttons, { title: "", url: "" }])
            setDmType("TEMPLATE")
        }
    }

    const handleRemoveButton = (index: number) => {
        const newBtns = buttons.filter((_, i) => i !== index)
        setButtons(newBtns)
        if (newBtns.length === 0) setDmType("TEXT")
    }

    const updateButton = (index: number, field: "title" | "url", value: string) => {
        const newBtns = [...buttons]
        newBtns[index][field] = value
        setButtons(newBtns)
    }

    const handleCreate = async () => {
        if (!keyword.trim() || !dmMessage.trim()) return
        
        // Clean buttons
        const validButtons = buttons.filter(b => b.title.trim() && b.url.trim())

        try {
            await createRule({
                mediaId: post.id,
                mediaUrl: post.thumbnail_url || post.media_url,
                mediaCaption: post.caption?.slice(0, 200),
                mediaType: post.media_type,
                triggerKeyword: keyword,
                dmMessage,
                dmType: validButtons.length > 0 ? "TEMPLATE" : "TEXT",
                dmButtons: validButtons.length > 0 ? validButtons : undefined,
                isFollowGated,
                unfollowedMessage: isFollowGated ? unfollowedMessage : undefined,
            }).unwrap()
            
            setKeyword("")
            setDmMessage("")
            setButtons([])
            setDmType("TEXT")
            setIsFollowGated(false)
            setUnfollowedMessage("")
            setShowForm(false)
        } catch (err: any) {
            alert(err?.data?.message || "Failed to create rule")
        }
    }

    const handleToggle = (rule: AutomationRule) => {
        updateRule({
            id: rule.id,
            status: rule.status === "ACTIVE" ? "PAUSED" : "ACTIVE",
        })
    }

    const handleDelete = (ruleId: number) => {
        if (confirm("Delete this automation rule?")) {
            deleteRule(ruleId)
        }
    }

    return (
        <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-0 border-l border-border bg-background">
                <div className="flex flex-col h-full">
                    {/* Header area with Post details */}
                    <div className="relative border-b border-border bg-muted/30">
                        {/* Background blurred post image */}
                        <div 
                            className="absolute inset-0 opacity-10 bg-cover bg-center blur-sm"
                            style={{ backgroundImage: `url(${post.thumbnail_url || post.media_url})` }}
                        />
                        <div className="relative p-6 px-8">
                            <SheetHeader>
                                <SheetTitle className="text-xl font-bold tracking-tight">Post Automations</SheetTitle>
                                <SheetDescription className="text-muted-vercel">
                                    Manage DM triggers for this specific post
                                </SheetDescription>
                            </SheetHeader>
                            
                            <div className="mt-6 flex items-start gap-4">
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm">
                                    {(post.media_url || post.thumbnail_url) ? (
                                        <img src={post.thumbnail_url || post.media_url} alt="Post" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">No media</div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 pt-1">
                                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                                        <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {post.like_count ?? 0}</span>
                                        <span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {post.comments_count ?? 0}</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(post.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="line-clamp-2 text-[13px] text-foreground font-medium leading-relaxed">
                                        {post.caption || "No caption"}
                                    </p>
                                    <a href={post.permalink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary hover:underline">
                                        <ExternalLink className="h-3 w-3" /> View on Instagram
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="p-8 flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[14px] font-bold tracking-tight text-foreground">
                                Active Rules
                            </h3>
                            <Button
                                onClick={() => setShowForm(!showForm)}
                                variant={showForm ? "outline" : "default"}
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-bold"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                {showForm ? "Cancel" : "Add New Rule"}
                            </Button>
                        </div>

                        {/* Create form */}
                        <AnimatePresence>
                            {showForm && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden mb-6"
                                >
                                    <div className="space-y-5 rounded-xl border border-primary/20 bg-primary/5 p-6 shadow-sm">
                                        <div>
                                            <label className="mb-1.5 block text-[13px] font-bold text-foreground">
                                                Trigger Keyword
                                            </label>
                                            <input
                                                type="text"
                                                value={keyword}
                                                onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                                                placeholder='e.g. LINK, INFO, FEES...'
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm uppercase placeholder:normal-case focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                            />
                                            <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
                                                When someone comments this exact word, a DM will be sent
                                            </p>
                                        </div>

                                        <div className="pt-2 border-t border-primary/10">
                                            <div className="flex justify-between items-center mb-1.5">
                                                <label className="block text-[13px] font-bold text-foreground">
                                                    DM Message
                                                </label>
                                                <span className="text-[10px] font-bold uppercase text-primary tracking-wider bg-primary/10 px-1.5 py-0.5 rounded">
                                                    {buttons.length > 0 ? "Rich Template" : "Text"}
                                                </span>
                                            </div>
                                            <textarea
                                                value={dmMessage}
                                                onChange={(e) => setDmMessage(e.target.value)}
                                                placeholder="Hi! 👋 Thanks for your interest. Here are our batch details..."
                                                rows={3}
                                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/50"
                                            />
                                            
                                            {/* Link Buttons Builder */}
                                            <div className="mt-3 space-y-2">
                                                {buttons.map((btn, idx) => (
                                                    <div key={idx} className="flex gap-2">
                                                        <input 
                                                            type="text" 
                                                            placeholder="Button Title (e.g. Enroll Now)" 
                                                            value={btn.title}
                                                            onChange={(e) => updateButton(idx, "title", e.target.value)}
                                                            className="w-1/3 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                        <input 
                                                            type="url" 
                                                            placeholder="https://your-link.com" 
                                                            value={btn.url}
                                                            onChange={(e) => updateButton(idx, "url", e.target.value)}
                                                            className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                                        />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveButton(idx)}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {buttons.length < 3 && (
                                                    <Button variant="outline" size="sm" onClick={handleAddButton} className="h-8 text-xs gap-1.5 text-muted-foreground border-dashed w-full bg-transparent hover:bg-background">
                                                        <LinkIcon className="h-3 w-3" /> Add Link Button
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Require Follow Toggle */}
                                        <div className="pt-4 border-t border-primary/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[13px] font-bold text-foreground flex items-center gap-2">
                                                    Require Follow
                                                    {isFollowGated && (
                                                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest">Active</span>
                                                    )}
                                                </label>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                  <input type="checkbox" className="sr-only peer" checked={isFollowGated} onChange={(e) => setIsFollowGated(e.target.checked)} />
                                                  <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary border border-border"></div>
                                                </label>
                                            </div>
                                            {isFollowGated && (
                                                <div className="mt-3 bg-muted/50 p-3 rounded-lg border border-border">
                                                    <label className="mb-1.5 block text-[11px] font-bold tracking-wider uppercase text-muted-foreground">
                                                        Unfollowed Message
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={unfollowedMessage}
                                                        onChange={(e) => setUnfollowedMessage(e.target.value)}
                                                        placeholder='e.g. Please follow us first to get the link!'
                                                        className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                                                    />
                                                    <p className="mt-1.5 text-[10px] font-medium text-muted-foreground leading-relaxed">
                                                        If the user doesn't follow you, they will receive this message with a <span className="text-primary font-bold">"Yes, I followed! ✅"</span> button. 
                                                        They must click this before getting the actual link.
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Instagram Bubble Preview */}
                                        {dmMessage && (
                                            <div className="pt-2">
                                                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    Preview
                                                </p>
                                                <div className="flex flex-col gap-1 max-w-[85%]">
                                                    <div className="rounded-[20px] rounded-tl-sm bg-muted border border-border p-3 text-[13px] text-foreground leading-snug whitespace-pre-wrap">
                                                        {dmMessage}
                                                    </div>
                                                    {buttons.length > 0 && (
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            {buttons.map((b, i) => (
                                                                b.title ? (
                                                                    <div key={i} className="text-center rounded-xl bg-background border border-border p-2 text-[12px] font-bold text-blue-500 shadow-sm">
                                                                        {b.title}
                                                                    </div>
                                                                ) : null
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleCreate}
                                            disabled={!keyword.trim() || !dmMessage.trim() || creating}
                                            className="w-full gap-2 h-10 font-bold shadow-sm"
                                        >
                                            <Zap className="h-4 w-4" />
                                            Save Rule
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Rules list */}
                        {isLoading ? (
                            <div className="space-y-3">
                                {[1, 2].map((i) => (
                                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/60" />
                                ))}
                            </div>
                        ) : rules.length === 0 && !showForm ? (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center bg-muted/30">
                                <Zap className="mb-3 h-10 w-10 text-muted-foreground/50" />
                                <h4 className="font-bold text-[14px] text-foreground tracking-tight">No rules set up</h4>
                                <p className="mt-1.5 text-sm text-muted-vercel">
                                    Add a trigger keyword to start sending DMs automatically.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-8">
                                {rules.map((rule) => (
                                    <RuleCard
                                        key={rule.id}
                                        rule={rule}
                                        expanded={expandedLog === rule.id}
                                        onToggleExpand={() =>
                                            setExpandedLog(expandedLog === rule.id ? null : rule.id)
                                        }
                                        onToggleStatus={() => handleToggle(rule)}
                                        onDelete={() => handleDelete(rule.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── RuleCard sub-component ───────────────────

function RuleCard({
    rule,
    expanded,
    onToggleExpand,
    onToggleStatus,
    onDelete,
}: {
    rule: AutomationRule
    expanded: boolean
    onToggleExpand: () => void
    onToggleStatus: () => void
    onDelete: () => void
}) {
    const { data: logData } = useGetRuleLogsQuery(
        { ruleId: rule.id },
        { skip: !expanded }
    )

    const isActive = rule.status === "ACTIVE"

    return (
        <motion.div
            layout
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
        >
            <div className="flex items-center gap-4 p-4">
                {/* Status indicator button */}
                <button
                    onClick={onToggleStatus}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${isActive
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                    title={isActive ? "Pause" : "Activate"}
                >
                    {isActive ? <Play className="h-4 w-4 ml-0.5" /> : <Pause className="h-4 w-4" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-widest uppercase">
                            {rule.triggerKeyword}
                        </span>
                        {rule.dmType === "TEMPLATE" && (
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted border border-border px-1.5 py-0.5 rounded">
                                Rich DM
                            </span>
                        )}
                        {rule.isFollowGated && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 uppercase tracking-widest px-1.5 py-0.5 rounded">
                                Follow Gated
                            </span>
                        )}
                    </div>
                    <p className="truncate text-[13px] font-medium text-foreground">
                        {rule.dmMessage}
                    </p>
                </div>

                {/* Stats & Actions */}
                <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground shrink-0">
                    <span className="flex items-center gap-1.5 opacity-80">
                        <Send className="h-3.5 w-3.5" /> {rule.dmsSentCount} DMs
                    </span>
                    <div className="flex items-center gap-1 border-l border-border pl-4">
                        <button onClick={onToggleExpand} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors">
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onDelete}
                            className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive transition-colors"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded log panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden bg-muted/30 border-t border-border"
                    >
                        <div className="p-4 px-5">
                            <h5 className="mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Recent Activity
                            </h5>
                            {!logData?.logs?.length ? (
                                <p className="text-xs font-medium text-muted-vercel">
                                    No DMs sent yet for this rule.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {logData.logs.slice(0, 5).map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center gap-3 rounded-lg bg-background border border-border px-3 py-2.5 shadow-sm"
                                        >
                                            {log.dmStatus === "SENT" ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                            ) : log.dmStatus === "RATE_LIMITED" ? (
                                                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                                            )}
                                            <span className="flex-1 truncate text-[13px] font-medium text-foreground">
                                                @{log.commenterUsername || log.commenterId}
                                                <span className="text-muted-vercel font-normal ml-1">
                                                    commented &quot;{log.commentText}&quot;
                                                </span>
                                            </span>
                                            <span className="text-[11px] font-medium text-muted-foreground shrink-0 tabular-nums">
                                                {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
