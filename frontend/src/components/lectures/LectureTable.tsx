"use client"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Trash2, Loader2, CalendarDays } from "lucide-react"
import { AddLectureDialog } from "./AddLectureDialog"
import { FC, useState } from "react"
import { useGetLecturesQuery, useDeleteLectureMutation } from "@/redux/slices/lectures/lecturesApi"
import { toast } from "sonner"
import { Lecture, LectureStatus } from "@/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { cn } from "@/lib/utils"

// Status pills — warm, readable, clearly differentiated
const STATUS_STYLES: Record<LectureStatus, { label: string; className: string }> = {
    SCHEDULED: {
        label: "Scheduled",
        className: "bg-primary/10 text-primary border-primary/20"
    },
    IN_PROGRESS: {
        label: "In Progress",
        className: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400"
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400"
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400"
    },
}

export const LectureTable: FC = () => {
    const [batchFilter, setBatchFilter] = useState<string>("")
    const { data: batches } = useGetAllBatchesQuery()

    const queryParams = batchFilter && batchFilter !== "all" ? { batchId: Number(batchFilter) } : undefined
    const { data, isLoading, isError } = useGetLecturesQuery(queryParams)
    const [deleteLecture, { isLoading: isDeleting }] = useDeleteLectureMutation()

    const lectures = data?.lectures ?? []

    const handleDelete = async (id: number): Promise<void> => {
        try {
            await deleteLecture(id).unwrap()
            toast.success("Class removed from your schedule")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Couldn't delete this class. Try again.")
        }
    }

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="px-5 py-3 border-b border-border">
                    <Skeleton className="h-9 w-44 rounded-lg" />
                </div>
                <div className="border-b border-border bg-secondary/30 px-5 py-3">
                    <div className="grid grid-cols-7 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton key={i} className="h-3.5 w-20" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3.5 w-20" />
                        </div>
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3.5 w-24" />
                        <Skeleton className="h-3.5 w-32" />
                        <div className="space-y-1.5">
                            <Skeleton className="h-3.5 w-20" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <CalendarDays className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="text-[16px] font-bold text-foreground">Couldn&apos;t load your schedule</h3>
                <p className="text-[14px] text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
                    There was a problem connecting to the server. Please check your connection and try again.
                </p>
                <Button
                    variant="outline"
                    className="mt-6"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </div>
        )
    }

    return (
        <div>
            {/* Filter toolbar */}
            <div className="px-5 py-3 border-b border-border flex items-center gap-3">
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="h-9 w-44 text-[13.5px]">
                        <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {batches?.map((batch) => (
                            <SelectItem key={batch.id} value={String(batch.id)}>
                                {batch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Empty state */}
            {lectures.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <CalendarDays className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-[16px] font-bold text-foreground">Your schedule is clear</h3>
                    <p className="text-[14px] text-muted-foreground mt-2 max-w-[280px] leading-relaxed">
                        No classes have been scheduled yet. Add your first class and get started — it only takes a minute.
                    </p>
                    <div className="mt-6">
                        <AddLectureDialog />
                    </div>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="pl-5">Class</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Batch</TableHead>
                            <TableHead>Teacher</TableHead>
                            <TableHead>When</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right pr-5">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lectures.map((lecture: Lecture) => {
                            const statusStyle = STATUS_STYLES[lecture.status]
                            return (
                                <TableRow key={lecture.id} className="group">
                                    {/* Class title + room */}
                                    <TableCell className="pl-5">
                                        <div>
                                            <p className="font-semibold text-[14px] text-foreground leading-tight">
                                                {lecture.title}
                                            </p>
                                            {lecture.room && (
                                                <p className="text-[13px] text-muted-foreground mt-0.5">
                                                    Room {lecture.room}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>

                                    {/* Subject */}
                                    <TableCell>
                                        <span className="text-[14px] text-foreground/80">{lecture.subject}</span>
                                    </TableCell>

                                    {/* Batch */}
                                    <TableCell>
                                        <span className="text-[14px] text-foreground/80">{lecture.batch.name}</span>
                                    </TableCell>

                                    {/* Teacher */}
                                    <TableCell>
                                        {lecture.teacher ? (
                                            <div>
                                                <p className="text-[14px] text-foreground/80">{lecture.teacher.name}</p>
                                                {lecture.assignedBy === "auto" && (
                                                    <p className="text-[12px] text-muted-foreground">Auto-assigned</p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[13.5px] text-muted-foreground italic">Not assigned</span>
                                        )}
                                    </TableCell>

                                    {/* Schedule */}
                                    <TableCell>
                                        <p className="text-[14px] font-medium text-foreground/80">
                                            {new Date(lecture.date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric"
                                            })}
                                        </p>
                                        <p className="text-[13px] text-muted-foreground">
                                            {lecture.startTime} – {lecture.endTime}
                                        </p>
                                    </TableCell>

                                    {/* Status pill */}
                                    <TableCell>
                                        <span className={cn(
                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold",
                                            statusStyle.className
                                        )}>
                                            {statusStyle.label}
                                        </span>
                                    </TableCell>

                                    {/* Delete */}
                                    <TableCell className="text-right pr-5">
                                        <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                                                onClick={() => handleDelete(lecture.id)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />
                                                }
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            )}
        </div>
    )
}
