"use client"

import { motion } from "framer-motion"
import { Instagram, ArrowRight, Shield, Zap, MessageCircle, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetConnectUrlQuery } from "@/redux/api/instagramApi"

export function ConnectInstagram() {
    const { data } = useGetConnectUrlQuery()

    const handleConnect = () => {
        if (data?.url) {
            window.location.href = data.url
        }
    }

    return (
        <div className="mx-auto max-w-2xl py-12">
            {/* Hero card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="card-vercel overflow-hidden relative"
            >
                {/* Header Area */}
                <div className="relative border-b border-border bg-muted/30 px-8 py-10">
                    <div className="relative z-10">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                            <Instagram className="h-8 w-8 text-primary" />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-foreground">
                            Connect Your Instagram
                        </h2>
                        <p className="mt-2 text-[15px] text-muted-vercel max-w-[400px]">
                            Auto-DM leads when they comment on your posts. Like ManyChat, but built natively into your dashboard.
                        </p>
                    </div>
                </div>

                {/* Features */}
                <div className="p-8 pb-10">
                    <h3 className="mb-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                        How it works
                    </h3>
                    <div className="grid gap-6">
                        {[
                            {
                                icon: MessageCircle,
                                title: "Student comments on your reel",
                                desc: "You set the trigger keyword — it can be anything like 'LINK' or 'INFO'",
                            },
                            {
                                icon: Zap,
                                title: "Instant DM sent automatically",
                                desc: "Send an admission form, batch details, or a checkout link privately",
                            },
                            {
                                icon: TrendingUp,
                                title: "More leads, zero manual work",
                                desc: "Every comment turns into a secure, automated conversation",
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-4"
                            >
                                <div className="rounded-lg bg-primary/10 border border-primary/20 p-2.5 text-primary shrink-0">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div className="pt-0.5">
                                    <p className="font-bold text-[14px] text-foreground leading-tight tracking-tight">
                                        {item.title}
                                    </p>
                                    <p className="mt-1 text-[13px] text-muted-vercel leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Connect button */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-10"
                    >
                        <Button
                            onClick={handleConnect}
                            className="w-full h-12 gap-2 text-[14px] font-bold shadow-sm transition-all"
                        >
                            <Instagram className="h-4 w-4" />
                            Connect Instagram Account
                            <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            <Shield className="h-3 w-3" />
                            Requires Instagram Business or Creator account
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
