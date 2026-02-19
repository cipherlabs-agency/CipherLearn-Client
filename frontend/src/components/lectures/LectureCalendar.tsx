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
import { CalendarDays } from "lucide-react"

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

    if (isLoading) {
        return (
            <div className="rounded-xl border border-border overflow-hidden bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-32 rounded-lg" />
                        <Skeleton className="h-9 w-20 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                <div className="grid grid-cols-7">
                    {[...Array(7)].map((_, i) => (
                        <Skeleton key={i} className="h-10 rounded-none" />
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {[...Array(35)].map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-none opacity-50" />
                    ))}
                </div>
            </div>
        )
    }

    if (lectures.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(28,25,23,0.06)] flex flex-col items-center justify-center py-20 text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <CalendarDays className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-[16px] font-bold text-foreground">Your calendar is clear</h3>
                <p className="text-[14px] text-muted-foreground mt-1.5 max-w-[280px] leading-relaxed">
                    No classes scheduled yet. Add your first class and it will appear right here on the calendar.
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-[0_1px_3px_rgba(28,25,23,0.06),0_4px_12px_rgba(28,25,23,0.04)]">
            <CalendarProvider startDay={1}>
                <CalendarDate>
                    <CalendarDatePicker>
                        <CalendarMonthPicker />
                        <CalendarYearPicker start={currentYear - 2} end={currentYear + 3} />
                    </CalendarDatePicker>
                    <CalendarDatePagination />
                </CalendarDate>
                <CalendarHeader />
                <CalendarBody features={features}>
                    {({ feature }) => (
                        <CalendarItem key={feature.id} feature={feature} />
                    )}
                </CalendarBody>
            </CalendarProvider>

            {/* Status legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t border-border bg-muted/20">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[12.5px] font-medium text-muted-foreground">
                            {STATUS_LABELS[status as LectureStatus]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
