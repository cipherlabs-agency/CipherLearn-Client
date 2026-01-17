"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { AnnouncementsList } from "@/components/announcements/AnnouncementsList"
import { AddAnnouncementDialog } from "@/components/announcements/AddAnnouncementDialog"
import { AnnouncementPriority } from "@/redux/slices/announcements/announcementsApi"

export default function AnnouncementsPage() {
    const [priorityFilter, setPriorityFilter] = useState<AnnouncementPriority | "">("")
    const [activeFilter, setActiveFilter] = useState<string>("")

    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === "ADMIN"

    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Announcements
                    </h1>
                    <p className="text-muted-vercel mt-2">Important notices and updates for students and staff.</p>
                </div>
                {isAdmin && <AddAnnouncementDialog />}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Priority</label>
                    <div className="relative group">
                        <select
                            className="h-10 w-full sm:w-48 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer"
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value as AnnouncementPriority | "")}
                        >
                            <option value="" className="bg-background text-foreground lowercase">All priorities</option>
                            <option value="URGENT" className="bg-background text-foreground lowercase">Urgent</option>
                            <option value="HIGH" className="bg-background text-foreground lowercase">High</option>
                            <option value="NORMAL" className="bg-background text-foreground lowercase">Normal</option>
                            <option value="LOW" className="bg-background text-foreground lowercase">Low</option>
                        </select>
                    </div>
                </div>

                {isAdmin && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Status</label>
                        <div className="relative group">
                            <select
                                className="h-10 w-full sm:w-48 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer"
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value)}
                            >
                                <option value="" className="bg-background text-foreground lowercase">All</option>
                                <option value="true" className="bg-background text-foreground lowercase">Active</option>
                                <option value="false" className="bg-background text-foreground lowercase">Inactive</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="card-vercel !px-0 !py-0 border-border/40 overflow-hidden">
                <AnnouncementsList
                    priorityFilter={priorityFilter || undefined}
                    activeFilter={activeFilter ? activeFilter === "true" : undefined}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    )
}
