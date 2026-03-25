"use client"

import {
    CalendarBody,
    CalendarDate,
    CalendarDatePagination,
    CalendarDatePicker,
    CalendarHeader,
    CalendarItem,
    CalendarMonthPicker,
    CalendarProvider,
    CalendarYearPicker,
    type Feature,
} from "@/components/ui/calendar"
import { useGetLecturesQuery } from "@/redux/slices/lectures/lecturesApi"
import { type Lecture, type LectureStatus } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"
import { CalendarDays, Clock, MapPin, User, BookOpen } from "lucide-react"
import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { AddLectureDialog } from "./AddLectureDialog"
import { cn } from "@/lib/utils"

// Status → color mapping for calendar events
const STATUS_COLORS: Record<LectureStatus, string> = {
    SCHEDULED: "#0F766E",   // Teal — upcoming class
    IN_PROGRESS: "#D97706", // Amber — class happening now
    COMPLETED: "#16A34A",   // Green — done
    CANCELLED: "#DC2626",   // Red — cancelled
}

const STATUS_LABELS: Record<LectureStatus, string> = {
    SCHEDULED: "Scheduled",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
}

const STATUS_BADGE_STYLES: Record<LectureStatus, string> = {
    SCHEDULED: "bg-primary/10 text-primary border-primary/20",
    IN_PROGRESS: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
    COMPLETED: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
    CANCELLED: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400",
}

function lectureToFeature(lecture: Lecture): Feature {
    const date = new Date(lecture.date)
    return {
        id: String(lecture.id),
        name: `${lecture.title} · ${lecture.batch.name}`,
        startAt: date,
        endAt: date,
        status: {
            id: lecture.status,
            name: STATUS_LABELS[lecture.status],
            color: STATUS_COLORS[lecture.status],
        },
    }
}

const currentYear = new Date().getFullYear()

export function LectureCalendar() {
    const { data, isLoading } = useGetLecturesQuery(undefined)
    const lectures = data?.lectures ?? []
    const features: Feature[] = lectures.map(lectureToFeature)

    // Build a map from feature ID → Lecture for quick lookup
    const lectureMap = new Map<string, Lecture>()
    lectures.forEach((l) => lectureMap.set(String(l.id), l))

    // State for the event detail dialog
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)

    // State for the "schedule on date" dialog
    const [scheduleDate, setScheduleDate] = useState<string | undefined>(undefined)
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

    const handleEventClick = (featureId: string) => {
        const lecture = lectureMap.get(featureId)
        if (lecture) setSelectedLecture(lecture)
    }

    const handleDateClick = (date: Date) => {
        // Format as YYYY-MM-DD using local time (avoid UTC offset issues)
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, "0")
        const d = String(date.getDate()).padStart(2, "0")
        setScheduleDate(`${y}-${m}-${d}`)
        setScheduleDialogOpen(true)
    }

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)] flex flex-col h-full">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-32 rounded-lg" />
                        <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                <div className="grid grid-cols-7 shrink-0">
                    {[...Array(7)].map((_, i) => (
                        <Skeleton key={i} className="h-9 rounded-none" />
                    ))}
                </div>
                <div className="flex-1 grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
                    {[...Array(35)].map((_, i) => (
                        <Skeleton key={i} className="rounded-none opacity-50" />
                    ))}
                </div>
            </div>
        )
    }

    if (lectures.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)] flex flex-col h-full">
                {/* Still show the calendar header with add capability */}
                <CalendarProvider startDay={1} className="flex-1 min-h-0">
                    <CalendarDate>
                        <CalendarDatePicker>
                            <CalendarMonthPicker />
                            <CalendarYearPicker start={currentYear - 2} end={currentYear + 3} />
                        </CalendarDatePicker>
                        <CalendarDatePagination />
                    </CalendarDate>
                    <CalendarHeader />
                    <CalendarBody features={[]} onDateClick={handleDateClick}>
                        {({ feature }) => (
                            <CalendarItem key={feature.id} feature={feature} />
                        )}
                    </CalendarBody>
                </CalendarProvider>
                <div className="flex items-center justify-center gap-3 py-4 border-t border-border bg-muted/20 shrink-0">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <p className="text-[13.5px] text-muted-foreground">
                        No classes yet — click any date to schedule your first class
                    </p>
                </div>

                {/* Schedule dialog triggered from date click — key remounts on new date */}
                <AddLectureDialog
                    key={scheduleDate}
                    open={scheduleDialogOpen}
                    onOpenChange={setScheduleDialogOpen}
                    defaultDate={scheduleDate}
                    hideTrigger
                />
            </div>
        )
    }

    return (
        <>
            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)] flex flex-col h-full">
                <CalendarProvider startDay={1} className="flex-1 min-h-0">
                    <CalendarDate>
                        <CalendarDatePicker>
                            <CalendarMonthPicker />
                            <CalendarYearPicker start={currentYear - 2} end={currentYear + 3} />
                        </CalendarDatePicker>
                        <CalendarDatePagination />
                    </CalendarDate>
                    <CalendarHeader />
                    <CalendarBody features={features} onDateClick={handleDateClick}>
                        {({ feature }) => (
                            <CalendarItem
                                key={feature.id}
                                feature={feature}
                                onClick={() => handleEventClick(feature.id)}
                            />
                        )}
                    </CalendarBody>
                </CalendarProvider>

                {/* Status legend */}
                <div className="flex flex-wrap items-center gap-4 px-4 py-2.5 border-t border-border bg-muted/20 shrink-0">
                    {Object.entries(STATUS_COLORS).map(([status, color]) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="text-[12px] font-medium text-muted-foreground">
                                {STATUS_LABELS[status as LectureStatus]}
                            </span>
                        </div>
                    ))}
                    <span className="text-[12px] text-muted-foreground ml-auto opacity-60">
                        Click any date to schedule · Click an event for details
                    </span>
                </div>
            </div>

            {/* Lecture detail dialog */}
            <Dialog open={!!selectedLecture} onOpenChange={(open) => !open && setSelectedLecture(null)}>
                <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
                    <VisuallyHidden><DialogTitle>Lecture Details</DialogTitle></VisuallyHidden>
                    {selectedLecture && (
                        <>
                            {/* Colored top strip */}
                            <div
                                className="h-1.5 w-full"
                                style={{ backgroundColor: STATUS_COLORS[selectedLecture.status] }}
                            />
                            <div className="px-6 pt-5 pb-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-[17px] font-bold text-foreground leading-tight truncate">
                                            {selectedLecture.title}
                                        </h3>
                                        <p className="text-[13.5px] text-muted-foreground mt-0.5">{selectedLecture.subject}</p>
                                    </div>
                                    <span className={cn(
                                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold shrink-0 mt-0.5",
                                        STATUS_BADGE_STYLES[selectedLecture.status]
                                    )}>
                                        {STATUS_LABELS[selectedLecture.status]}
                                    </span>
                                </div>
                            </div>

                            <div className="px-6 pb-6 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                                        <CalendarDays className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                                            <p className="text-[13.5px] font-semibold text-foreground mt-0.5">
                                                {new Date(selectedLecture.date).toLocaleDateString("en-US", {
                                                    weekday: "short", month: "short", day: "numeric"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                                        <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Time</p>
                                            <p className="text-[13.5px] font-semibold text-foreground mt-0.5">
                                                {selectedLecture.startTime} – {selectedLecture.endTime}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                                        <BookOpen className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Batch</p>
                                            <p className="text-[13.5px] font-semibold text-foreground mt-0.5">
                                                {selectedLecture.batch.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                                        <User className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Teacher</p>
                                            <p className="text-[13.5px] font-semibold text-foreground mt-0.5">
                                                {selectedLecture.teacher?.name || "Not assigned"}
                                            </p>
                                            {selectedLecture.assignedBy === "auto" && (
                                                <p className="text-[11px] text-muted-foreground">Auto-assigned</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedLecture.room && (
                                    <div className="flex items-start gap-2.5 rounded-lg bg-secondary/40 px-3 py-2.5">
                                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Room</p>
                                            <p className="text-[13.5px] font-semibold text-foreground mt-0.5">
                                                Room {selectedLecture.room}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {selectedLecture.description && (
                                    <p className="text-[13.5px] text-muted-foreground leading-relaxed border-t border-border pt-3">
                                        {selectedLecture.description}
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Schedule-on-date dialog — key remounts on new date selection */}
            <AddLectureDialog
                key={scheduleDate}
                open={scheduleDialogOpen}
                onOpenChange={setScheduleDialogOpen}
                defaultDate={scheduleDate}
                hideTrigger
            />
        </>
    )
}
