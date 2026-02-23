"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Instagram, Zap, MessageCircle, BarChart3, Clock, CheckCircle2, ShieldCheck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ConnectInstagram } from "@/components/instagram/ConnectInstagram"
import { PostGrid } from "@/components/instagram/PostGrid"
import { AutomationPanel } from "@/components/instagram/AutomationPanel"
import { ActivityLog } from "@/components/instagram/ActivityLog"
import { useGetInstagramAccountQuery, useGetAnalyticsQuery, useDisconnectInstagramMutation } from "@/redux/api/instagramApi"
import type { IgMedia } from "@/redux/api/instagramApi"

export default function InstagramPage() {
    const { data: account, isLoading: isAccountLoading } = useGetInstagramAccountQuery()
    const { data: analytics } = useGetAnalyticsQuery(undefined, { skip: !account })
    const [disconnectInstagram] = useDisconnectInstagramMutation()
    
    const [selectedPost, setSelectedPost] = useState<IgMedia | null>(null)
    const [connected, setConnected] = useState(false)

    // Check for OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get("connected") === "true") {
            setConnected(true)
            window.history.replaceState({}, "", "/instagram")
        }
    }, [])

    const isConnected = !!account || connected

    if (isAccountLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                    <Instagram className="h-8 w-8 text-muted-vercel" />
                </motion.div>
            </div>
        )
    }

    if (!isConnected) {
        return <ConnectInstagram />
    }

    return (
        <div className="space-y-8 animate-fade-in p-1">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-3">
                    <Instagram className="h-8 w-8 text-primary" />
                    Instagram Automations
                    <span className="badge-info text-[10px] ml-1">BETA</span>
                </h1>
                <p className="mt-2 text-[15px] text-muted-vercel">
                    Turn Instagram comments into qualified leads automatically.
                </p>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total DMs Sent", value: analytics?.totalDmsSent ?? 0, icon: MessageCircle },
                    { label: "Active Rules", value: analytics?.activeRules ?? 0, icon: Zap },
                    { label: "Success Rate", value: `${analytics?.successRate ?? 100}%`, icon: CheckCircle2 },
                    { label: "Posts Monitored", value: analytics?.postsMonitored ?? 0, icon: BarChart3 },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="stat-card flex flex-col gap-3"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground opacity-80">{stat.label}</span>
                            <stat.icon className="h-4 w-4 text-muted-vercel" />
                        </div>
                        <span className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="automations" className="space-y-6">
                <TabsList className="bg-transparent border-b border-border w-full justify-start h-12 rounded-none p-0">
                    <TabsTrigger value="automations" className="data-[state=active]:bg-transparent relative h-12 rounded-none px-6 font-semibold">
                        Automations
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-transparent relative h-12 rounded-none px-6 font-semibold">
                        Activity Log
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-transparent relative h-12 rounded-none px-6 font-semibold">
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Automations Tab */}
                <TabsContent value="automations" className="animate-fade-in outline-none">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold tracking-tight">Select a Post</h2>

                    </div>
                    <PostGrid onSelectPost={setSelectedPost} />
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity" className="animate-fade-in outline-none">
                    <ActivityLog />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="animate-fade-in outline-none">
                    <div className="card-vercel p-6 max-w-2xl">
                        <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border/50">
                            {account?.profilePictureUrl ? (
                                <img src={account.profilePictureUrl} alt="Profile" className="w-16 h-16 rounded-full border border-border" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-border">
                                    <Instagram className="h-6 w-6 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <h3 className="text-lg font-bold tracking-tight">@{account?.username}</h3>
                                <p className="text-sm text-muted-vercel flex items-center gap-1.5 mt-1">
                                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                                    Connected securely
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold tracking-tight text-destructive">Danger Zone</h4>
                            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                                <div>
                                    <p className="font-semibold text-sm">Disconnect Account</p>
                                    <p className="text-xs text-muted-foreground mt-1">This will pause all active automations</p>
                                </div>
                                <Button variant="destructive" size="sm" onClick={() => disconnectInstagram()}>
                                    Disconnect
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Automation Panel Side Sheet */}
            {selectedPost && (
                <AutomationPanel
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                />
            )}
        </div>
    )
}
