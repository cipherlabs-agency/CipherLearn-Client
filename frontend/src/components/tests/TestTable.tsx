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
import { Trash2, Loader2, Eye, Send, ChevronLeft, ChevronRight } from "lucide-react"
import { AddTestDialog } from "./AddTestDialog"
import { FC, useState } from "react"
import { useGetTestsQuery, useDeleteTestMutation, usePublishTestMutation } from "@/redux/slices/tests/testsApi"
import { toast } from "sonner"
import { Test, TestStatus, TestType } from "@/types"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import Link from "next/link"

const LIMIT = 20

const STATUS_STYLES: Record<TestStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
    SCHEDULED: { label: "Scheduled", className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    ONGOING: { label: "Ongoing", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    COMPLETED: { label: "Completed", className: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    PUBLISHED: { label: "Published", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

const TYPE_LABELS: Record<TestType, string> = {
    UNIT_TEST: "Unit Test",
    MIDTERM: "Midterm",
    FINAL: "Final",
    QUIZ: "Quiz",
    PRACTICE: "Practice",
}

export const TestTable: FC = () => {
    const [page, setPage] = useState(1)
    const [batchFilter, setBatchFilter] = useState<string>("")
    const [statusFilter, setStatusFilter] = useState<string>("")
    const { data: batches } = useGetAllBatchesQuery()

    const handleBatchFilter = (val: string) => { setBatchFilter(val); setPage(1) }
    const handleStatusFilter = (val: string) => { setStatusFilter(val); setPage(1) }

    const { data, isLoading, isError, isFetching } = useGetTestsQuery({
        ...(batchFilter && batchFilter !== "all" ? { batchId: Number(batchFilter) } : {}),
        ...(statusFilter && statusFilter !== "all" ? { status: statusFilter } : {}),
        page,
        limit: LIMIT,
    })
    const [deleteTest, { isLoading: isDeleting }] = useDeleteTestMutation()
    const [publishTest, { isLoading: isPublishing }] = usePublishTestMutation()

    const tests = data?.tests ?? []
    const pagination = data?.pagination

    const handleDelete = async (id: number): Promise<void> => {
        try {
            await deleteTest(id).unwrap()
            toast.success("Test deleted successfully")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to delete test")
        }
    }

    const handlePublish = async (id: number): Promise<void> => {
        try {
            await publishTest(id).unwrap()
            toast.success("Test scores published to students")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to publish test")
        }
    }

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="px-6 py-3 border-b border-border/60 flex items-center gap-3">
                    <Skeleton className="h-8 w-[180px] rounded-md" />
                    <Skeleton className="h-8 w-[140px] rounded-md" />
                </div>
                <div className="border-b border-border bg-muted/5 px-6 py-3">
                    <div className="grid grid-cols-8 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <Skeleton key={i} className="h-3 w-20" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-6 py-4 border-b border-border/60 flex items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-5 w-16 rounded-md" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-8 w-20 rounded-md" />
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <Card className="text-center py-20 bg-destructive/5 border-dashed border-destructive/30 m-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight text-destructive uppercase">Connection Error</h3>
                <p className="text-[13.5px] text-muted-foreground mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">Failed to load test data.</p>
                <Button variant="outline" className="mt-8 h-8 px-4 text-[13px] font-semibold uppercase tracking-widest border-destructive/20 hover:bg-destructive hover:text-white transition-all" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Card>
        )
    }

    return (
        <div>
            <div className="px-6 py-3 border-b border-border/60 flex items-center gap-3">
                <Select value={batchFilter} onValueChange={handleBatchFilter}>
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
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                    <SelectTrigger className="h-8 w-[140px] text-[12px]">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        {(Object.entries(STATUS_STYLES) as [TestStatus, { label: string }][]).map(([key, val]) => (
                            <SelectItem key={key} value={key}>{val.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {tests.length === 0 ? (
                <Card className="text-center py-24 border-dashed border-border/60 bg-muted/5 m-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">No Tests</h3>
                    <p className="text-[13.5px] text-muted-foreground mt-2 max-w-[260px] mx-auto font-medium leading-relaxed">No tests have been created yet.</p>
                    <div className="mt-10">
                        <AddTestDialog />
                    </div>
                </Card>
            ) : (
                <>
                    <Table>
                        <TableHeader className="bg-muted/5">
                            <TableRow className="hover:bg-transparent border-border/60">
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Title</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Type</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Batch</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Date</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Marks</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Status</TableHead>
                                <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Scores</TableHead>
                                <TableHead className="text-right text-[13px] font-semibold uppercase tracking-widest py-4 pr-10 text-muted-foreground">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tests.map((test: Test) => {
                                const statusStyle = STATUS_STYLES[test.status]
                                return (
                                    <TableRow key={test.id} className="group border-border/40 hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-4 pl-8">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-sm tracking-tight leading-none text-foreground">{test.title}</span>
                                                <span className="text-[13px] text-muted-foreground mt-1">{test.subject}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[13px] font-semibold px-1.5 py-0.5 rounded border border-border bg-muted/50 uppercase tracking-tighter">
                                                {TYPE_LABELS[test.testType]}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[13.5px] font-medium text-foreground/80">{test.batch.name}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[13.5px] font-medium tabular-nums text-foreground/80">
                                                {new Date(test.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[13.5px] font-medium tabular-nums text-foreground/80">{test.totalMarks}</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className={`text-[13px] font-semibold px-2 py-0.5 rounded border w-fit uppercase tracking-tighter ${statusStyle.className}`}>
                                                {statusStyle.label}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[13.5px] font-medium tabular-nums text-foreground/80">
                                                {test._count?.scores ?? 0}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                                <Link href={`/tests/${test.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-blue-500/5 hover:text-blue-500">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                                {test.status !== "PUBLISHED" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-md hover:bg-emerald-500/5 hover:text-emerald-500"
                                                        onClick={() => handlePublish(test.id)}
                                                        disabled={isPublishing}
                                                        title="Publish scores"
                                                    >
                                                        {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                                    onClick={() => handleDelete(test.id)}
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

                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-border/60 bg-muted/5">
                            <p className="text-[11px] text-muted-foreground tabular-nums">
                                Page {pagination.page} of {pagination.totalPages}
                                <span className="ml-2 text-muted-foreground/60">
                                    ({(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total})
                                </span>
                            </p>
                            <div className="flex items-center gap-1.5">
                                {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={pagination.page <= 1 || isFetching}
                                    onClick={() => setPage(p => p - 1)}
                                >
                                    <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7"
                                    disabled={pagination.page >= pagination.totalPages || isFetching}
                                    onClick={() => setPage(p => p + 1)}
                                >
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
