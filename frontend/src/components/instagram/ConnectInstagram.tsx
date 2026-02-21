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
                className="relative overflow-hidden rounded-2xl border border-[var(--color-warm-200)] bg-white"
            >
                {/* Gradient header */}
                <div className="relative bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-8 py-10 text-white">
                    <div className="relative z-10">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                            <Instagram className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold">
                            Connect Your Instagram
                        </h2>
                        <p className="mt-2 text-lg text-white/80">
                            Auto-DM leads when they comment on your posts. Like ManyChat, but built for coaching classes.
                        </p>
                    </div>
                    {/* Decorative circles */}
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
                    <div className="absolute -bottom-4 right-16 h-20 w-20 rounded-full bg-white/10" />
                </div>

                {/* Features */}
                <div className="p-8">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--color-warm-400)]">
                        How it works
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                icon: MessageCircle,
                                title: "Student comments \"LINK\" on your reel",
                                desc: "You set the trigger keyword — it can be anything",
                            },
                            {
                                icon: Zap,
                                title: "Instant DM sent automatically",
                                desc: "Admission form, batch details, fees — whatever you choose",
                            },
                            {
                                icon: TrendingUp,
                                title: "More leads, zero manual work",
                                desc: "Every comment turns into a private conversation",
                            },
                        ].map((item, i) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-start gap-4 rounded-xl bg-[var(--color-warm-50)] p-4"
                            >
                                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 p-2 text-white">
                                    <item.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-[var(--color-warm-900)]">
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-[var(--color-warm-500)]">
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
                        transition={{ delay: 0.6 }}
                        className="mt-8"
                    >
                        <Button
                            onClick={handleConnect}
                            className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-500 py-6 text-lg font-semibold text-white hover:from-purple-700 hover:to-pink-600"
                        >
                            <Instagram className="h-5 w-5" />
                            Connect Instagram Account
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--color-warm-400)]">
                            <Shield className="h-3.5 w-3.5" />
                            Requires Instagram Business or Creator account
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}
