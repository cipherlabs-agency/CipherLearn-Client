"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LectureTable } from "@/components/lectures/LectureTable"
import { LectureCalendar } from "@/components/lectures/LectureCalendar"
import { AddLectureDialog } from "@/components/lectures/AddLectureDialog"
import { CalendarDays, List } from "lucide-react"
import { cn } from "@/lib/utils"

type ViewMode = "calendar" | "list"

export default function LecturesPage() {
    const [view, setView] = useState<ViewMode>("calendar")

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">
                        Teaching Schedule
                    </h1>
                    <p className="text-[14.5px] text-muted-foreground mt-1 leading-relaxed">
                        Plan your week — schedule classes, assign rooms, and keep students informed.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {/* View toggle */}
                    <div className="inline-flex items-center rounded-lg border border-border bg-secondary/60 p-0.5">
                        <button
                            onClick={() => setView("calendar")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all",
                                view === "calendar"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            Calendar
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={cn(
                                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold transition-all",
                                view === "list"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="h-3.5 w-3.5" />
                            List
                        </button>
                    </div>

                    <AddLectureDialog />
                </div>
            </div>

            {/* Calendar View */}
            {view === "calendar" && (
                <LectureCalendar />
            )}

            {/* List View */}
            {view === "list" && (
                <Card className="!p-0 overflow-hidden">
                    <LectureTable />
                </Card>
            )}
        </div>
    )
}
