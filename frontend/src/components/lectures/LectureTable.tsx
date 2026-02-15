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
import { Trash2, Loader2 } from "lucide-react"
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

const STATUS_STYLES: Record<LectureStatus, { label: string; className: string }> = {
    SCHEDULED: { label: "Scheduled", className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    IN_PROGRESS: { label: "Ongoing", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    COMPLETED: { label: "Completed", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    CANCELLED: { label: "Cancelled", className: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400" },
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
            toast.success("Lecture deleted successfully")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to delete lecture")
        }
    }

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="px-6 py-3 border-b border-border/60">
                    <Skeleton className="h-8 w-[180px] bg-muted/30 rounded-md" />
                </div>
                <div className="border-b border-border bg-muted/5 px-6 py-3">
                    <div className="grid grid-cols-7 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton key={i} className="h-3 w-20 bg-muted/40" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <div className="space-y-1.5">
                                <Skeleton className="h-4 w-36 bg-muted/20" />
                                <Skeleton className="h-3 w-16 bg-muted/10" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-24 bg-muted/20" />
                        <Skeleton className="h-3 w-20 bg-muted/20" />
                        <Skeleton className="h-3 w-28 bg-muted/20" />
                        <div className="space-y-1">
                            <Skeleton className="h-3 w-16 bg-muted/20" />
                            <Skeleton className="h-3 w-24 bg-muted/10" />
                        </div>
                        <Skeleton className="h-5 w-16 bg-muted/30 rounded-md" />
                        <Skeleton className="h-8 w-8 bg-muted/40 rounded-md" />
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <Card className="text-center py-20 bg-destructive/5 border-dashed border-destructive/30 m-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight text-destructive uppercase">Connection Error</h3>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">Failed to load lecture data.</p>
                <Button variant="outline" className="mt-8 h-8 px-4 text-[10px] font-semibold uppercase tracking-widest border-destructive/20 hover:bg-destructive hover:text-white transition-all" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Card>
        )
    }

    return (
        <div>
            <div className="px-6 py-3 border-b border-border/60 flex items-center gap-3">
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="h-8 w-[180px] text-[12px]">
                        <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Batches</SelectItem>
                        {batches?.map((batch) => (
                            <SelectItem key={batch.id} value={String(batch.id)}>{batch.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {lectures.length === 0 ? (
                <Card className="text-center py-24 border-dashed border-border/60 bg-muted/5 m-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">No Lectures</h3>
                    <p className="text-[11px] text-muted-foreground mt-2 max-w-[260px] mx-auto font-medium leading-relaxed">No lectures have been scheduled yet.</p>
                    <div className="mt-10">
                        <AddLectureDialog />
                    </div>
                </Card>
            ) : (
                <Table>
                    <TableHeader className="bg-muted/5">
                        <TableRow className="hover:bg-transparent border-border/60">
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Title</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Subject</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Batch</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Teacher</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Schedule</TableHead>
                            <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Status</TableHead>
                            <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest py-4 pr-10 text-muted-foreground">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lectures.map((lecture: Lecture) => {
                            const statusStyle = STATUS_STYLES[lecture.status]
                            return (
                                <TableRow key={lecture.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                                    <TableCell className="py-4 pl-8">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm tracking-tight leading-none text-foreground">{lecture.title}</span>
                                            {lecture.room && (
                                                <span className="text-[10px] text-muted-foreground mt-1">{lecture.room}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[11px] font-medium tracking-tight text-foreground/80">{lecture.subject}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-[11px] font-medium text-foreground/80">{lecture.batch.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        {lecture.teacher ? (
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-medium text-foreground/80">{lecture.teacher.name}</span>
                                                {lecture.assignedBy === "auto" && (
                                                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">auto</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground italic">Unassigned</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-medium tabular-nums text-foreground/80">
                                                {new Date(lecture.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                                {lecture.startTime} - {lecture.endTime}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border w-fit uppercase tracking-tighter ${statusStyle.className}`}>
                                            {statusStyle.label}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-10">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                                onClick={() => handleDelete(lecture.id)}
                                                disabled={isDeleting}
                                            >
                                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
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
