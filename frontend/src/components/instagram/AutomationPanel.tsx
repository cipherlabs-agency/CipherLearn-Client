"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Zap, Plus, Trash2, Play, Pause, Send, ExternalLink,
    Heart, MessageCircle, Clock, CheckCircle2, XCircle, AlertTriangle,
    ChevronDown, ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
    onBack: () => void
}

export function AutomationPanel({ post }: AutomationPanelProps) {
    const { data: rules = [], isLoading } = useGetAutomationRulesQuery({
        mediaId: post.id,
    })
    const [createRule, { isLoading: creating }] = useCreateAutomationRuleMutation()
    const [updateRule] = useUpdateAutomationRuleMutation()
    const [deleteRule] = useDeleteAutomationRuleMutation()

    const [showForm, setShowForm] = useState(false)
    const [keyword, setKeyword] = useState("")
    const [dmMessage, setDmMessage] = useState("")
    const [expandedLog, setExpandedLog] = useState<number | null>(null)

    const handleCreate = async () => {
        if (!keyword.trim() || !dmMessage.trim()) return
        try {
            await createRule({
                mediaId: post.id,
                mediaUrl: post.thumbnail_url || post.media_url,
                mediaCaption: post.caption?.slice(0, 200),
                mediaType: post.media_type,
                triggerKeyword: keyword,
                dmMessage,
            }).unwrap()
            setKeyword("")
            setDmMessage("")
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
        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
            {/* Post preview (left) */}
            <div className="space-y-4">
                <div className="overflow-hidden rounded-xl border border-[var(--color-warm-200)] bg-white">
                    {/* Image */}
                    <div className="relative aspect-square bg-[var(--color-warm-50)]">
                        {(post.media_url || post.thumbnail_url) ? (
                            <img
                                src={post.thumbnail_url || post.media_url}
                                alt="Post"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-[var(--color-warm-300)]">
                                No preview
                            </div>
                        )}
                    </div>

                    {/* Post meta */}
                    <div className="space-y-2 p-4">
                        <div className="flex items-center gap-4 text-sm text-[var(--color-warm-500)]">
                            <span className="flex items-center gap-1">
                                <Heart className="h-4 w-4" /> {post.like_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" /> {post.comments_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {new Date(post.timestamp).toLocaleDateString()}
                            </span>
                        </div>
                        {post.caption && (
                            <p className="line-clamp-3 text-sm text-[var(--color-warm-700)]">
                                {post.caption}
                            </p>
                        )}
                        <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline"
                        >
                            <ExternalLink className="h-3 w-3" /> View on Instagram
                        </a>
                    </div>
                </div>
            </div>

            {/* Rules panel (right) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[var(--color-warm-900)]">
                        Automation Rules
                    </h3>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        variant={showForm ? "outline" : "default"}
                        size="sm"
                        className="gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        {showForm ? "Cancel" : "Add Rule"}
                    </Button>
                </div>

                {/* Create form */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="space-y-4 rounded-xl border-2 border-dashed border-purple-300 bg-purple-50/50 p-5">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-warm-700)]">
                                        Trigger Keyword
                                    </label>
                                    <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => setKeyword(e.target.value.toUpperCase())}
                                        placeholder='e.g. LINK, INFO, FEES, ENROLL'
                                        className="w-full rounded-lg border border-[var(--color-warm-300)] bg-white px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <p className="mt-1 text-xs text-[var(--color-warm-400)]">
                                        When someone comments this word, a DM will be sent
                                    </p>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-[var(--color-warm-700)]">
                                        DM Message
                                    </label>
                                    <textarea
                                        value={dmMessage}
                                        onChange={(e) => setDmMessage(e.target.value)}
                                        placeholder="Hi! 👋 Thanks for your interest. Here are our batch details and fees structure..."
                                        rows={4}
                                        className="w-full rounded-lg border border-[var(--color-warm-300)] bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>

                                {/* Preview */}
                                {dmMessage && (
                                    <div className="rounded-lg border border-[var(--color-warm-200)] bg-white p-3">
                                        <p className="mb-1 text-xs font-medium text-[var(--color-warm-400)]">
                                            DM Preview
                                        </p>
                                        <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-3 text-sm text-white">
                                            {dmMessage}
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleCreate}
                                    disabled={!keyword.trim() || !dmMessage.trim() || creating}
                                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                                    loading={creating}
                                >
                                    <Zap className="h-4 w-4" />
                                    Create Automation
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Rules list */}
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-24 animate-pulse rounded-xl bg-[var(--color-warm-100)]" />
                        ))}
                    </div>
                ) : rules.length === 0 && !showForm ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-warm-300)] py-12 text-center">
                        <Zap className="mb-2 h-10 w-10 text-[var(--color-warm-300)]" />
                        <h4 className="font-semibold text-[var(--color-warm-600)]">No rules yet</h4>
                        <p className="mt-1 text-sm text-[var(--color-warm-400)]">
                            Add a rule to start auto-DMing when someone comments on this post
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
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
            className="overflow-hidden rounded-xl border border-[var(--color-warm-200)] bg-white"
        >
            <div className="flex items-center gap-3 p-4">
                {/* Status indicator */}
                <button
                    onClick={onToggleStatus}
                    className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isActive
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                            : "bg-[var(--color-warm-100)] text-[var(--color-warm-400)] hover:bg-[var(--color-warm-200)]"
                        }`}
                    title={isActive ? "Pause" : "Activate"}
                >
                    {isActive ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                            {rule.triggerKeyword}
                        </span>
                        <span className={`text-xs ${isActive ? "text-emerald-600" : "text-[var(--color-warm-400)]"}`}>
                            {isActive ? "● Active" : "○ Paused"}
                        </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-[var(--color-warm-600)]">
                        {rule.dmMessage}
                    </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-[var(--color-warm-400)]">
                    <span className="flex items-center gap-1">
                        <Send className="h-3 w-3" /> {rule.dmsSentCount} DMs
                    </span>
                    <button onClick={onToggleExpand} className="hover:text-[var(--color-warm-600)]">
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={onDelete}
                        className="text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Expanded log panel */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[var(--color-warm-100)]"
                    >
                        <div className="p-4">
                            <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-warm-400)]">
                                Recent Activity
                            </h5>
                            {!logData?.logs?.length ? (
                                <p className="text-sm text-[var(--color-warm-400)]">
                                    No DMs sent yet for this rule
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {logData.logs.slice(0, 5).map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-center gap-2 rounded-lg bg-[var(--color-warm-50)] px-3 py-2"
                                        >
                                            {log.dmStatus === "SENT" ? (
                                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            ) : log.dmStatus === "RATE_LIMITED" ? (
                                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            <span className="flex-1 text-sm text-[var(--color-warm-700)]">
                                                @{log.commenterUsername || log.commenterId}
                                                <span className="text-[var(--color-warm-400)]">
                                                    {" "}commented &quot;{log.commentText}&quot;
                                                </span>
                                            </span>
                                            <span className="text-xs text-[var(--color-warm-400)]">
                                                {new Date(log.createdAt).toLocaleString()}
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
