"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, ArrowLeft, Zap, TrendingUp, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConnectInstagram } from "@/components/instagram/ConnectInstagram"
import { PostGrid } from "@/components/instagram/PostGrid"
import { AutomationPanel } from "@/components/instagram/AutomationPanel"
import { useGetInstagramAccountQuery } from "@/redux/api/instagramApi"
import type { IgMedia } from "@/redux/api/instagramApi"

export default function InstagramPage() {
    const { data: account, isLoading } = useGetInstagramAccountQuery()
    const [selectedPost, setSelectedPost] = useState<IgMedia | null>(null)
    const [connected, setConnected] = useState(false)

    // Check for OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("connected") === "true") {
            setConnected(true)
            // Clean the URL
            window.history.replaceState({}, "", "/instagram")
        }
    }, [])

    const isConnected = !!account || connected

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Instagram className="h-8 w-8 text-[var(--color-warm-600)]" />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-1">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {selectedPost && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedPost(null)}
                            className="gap-1"
                        >
                            <ArrowLeft className="h-4 w-4" /> Back
                        </Button>
                    )}
                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-[var(--color-warm-900)]">
                            <Instagram className="h-7 w-7" />
                            Instagram Automation
                            <span className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 text-xs font-semibold text-white">
                                BETA
                            </span>
                        </h1>
                        <p className="text-sm text-[var(--color-warm-500)]">
                            {selectedPost
                                ? "Set up keyword triggers to auto-DM followers"
                                : "Turn Instagram comments into leads — automatically"
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats bar for connected accounts */}
            {isConnected && account && !selectedPost && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-3 gap-4"
                >
                    {[
                        {
                            label: "Active Rules",
                            value: account.automationRules?.filter(r => r.status === "ACTIVE").length ?? 0,
                            icon: Zap,
                            color: "text-emerald-600 bg-emerald-50",
                        },
                        {
                            label: "Posts Monitored",
                            value: new Set(account.automationRules?.map(r => r.mediaId)).size,
                            icon: TrendingUp,
                            color: "text-blue-600 bg-blue-50",
                        },
                        {
                            label: "Total Rules",
                            value: account.automationRules?.length ?? 0,
                            icon: MessageCircle,
                            color: "text-purple-600 bg-purple-50",
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="flex items-center gap-3 rounded-xl border border-[var(--color-warm-200)] bg-white p-4"
                        >
                            <div className={`rounded-lg p-2 ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-[var(--color-warm-900)]">{stat.value}</p>
                                <p className="text-xs text-[var(--color-warm-500)]">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {/* Main content */}
            <AnimatePresence mode="wait">
                {!isConnected ? (
                    <motion.div
                        key="connect"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <ConnectInstagram />
                    </motion.div>
                ) : selectedPost ? (
                    <motion.div
                        key="automation"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <AutomationPanel
                            post={selectedPost}
                            onBack={() => setSelectedPost(null)}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <PostGrid onSelectPost={setSelectedPost} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
