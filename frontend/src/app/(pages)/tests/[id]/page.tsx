"use client"

import { use, useState } from "react"
import { Card } from "@/components/ui/card"
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
import { ArrowLeft, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useGetTestByIdQuery, useGetTestScoresQuery, useGetTestStatsQuery, usePublishTestMutation } from "@/redux/slices/tests/testsApi"
import { ScoreUploadDialog } from "@/components/tests/ScoreUploadDialog"
import { BulkScoreUploadDialog } from "@/components/tests/BulkScoreUploadDialog"
import { toast } from "sonner"
import { ScoreStatus, TestType, TestStatus } from "@/types"

const SCORES_PER_PAGE = 50

const TYPE_LABELS: Record<TestType, string> = {
    UNIT_TEST: "Unit Test",
    MIDTERM: "Midterm",
    FINAL: "Final",
    QUIZ: "Quiz",
    PRACTICE: "Practice",
}

const STATUS_STYLES: Record<TestStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "border-zinc-500/30 bg-zinc-500/10 text-zinc-600 dark:text-zinc-400" },
    SCHEDULED: { label: "Scheduled", className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    ONGOING: { label: "Ongoing", className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    COMPLETED: { label: "Completed", className: "border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400" },
    PUBLISHED: { label: "Published", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
}

const SCORE_STATUS_STYLES: Record<ScoreStatus, { label: string; className: string }> = {
    PASS: { label: "Pass", className: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    FAIL: { label: "Fail", className: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30" },
    ABSENT: { label: "Absent", className: "text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/30" },
}

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const testId = Number(id)
    const [scorePage, setScorePage] = useState(1)

    const { data: test, isLoading, isError } = useGetTestByIdQuery(testId)
    const { data: scoresData, isLoading: scoresLoading, isFetching: scoresFetching } = useGetTestScoresQuery(
        { id: testId, page: scorePage, limit: SCORES_PER_PAGE },
        { skip: !test }
    )
    const { data: stats } = useGetTestStatsQuery(testId)
    const [publishTest, { isLoading: isPublishing }] = usePublishTestMutation()

    const scores = scoresData?.scores ?? []
    const pagination = scoresData?.pagination

    const handlePublish = async () => {
        try {
            await publishTest(testId).unwrap()
            toast.success("Test scores published to students")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to publish")
        }
    }

    if (isLoading) {
        return (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center gap-4 border-b border-border/40 pb-8">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-lg border border-border/60 p-4 space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
                <div className="rounded-lg border border-border/60 overflow-hidden">
                    <div className="border-b border-border bg-muted/5 px-6 py-3">
                        <div className="grid grid-cols-6 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <Skeleton key={i} className="h-3 w-16" />
                            ))}
                        </div>
                    </div>
                    {[1, 2, 3, 4, 5].map((row) => (
                        <div key={row} className="px-6 py-4 border-b border-border/60 flex items-center gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-5 w-12 rounded-md" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (isError || !test) {
        return (
            <div className="max-w-[1400px] mx-auto">
                <Card className="text-center py-20 bg-destructive/5 border-dashed border-destructive/30 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-destructive uppercase">Test Not Found</h3>
                    <Link href="/tests" className="mt-6">
                        <Button variant="outline" size="sm">Back to Tests</Button>
                    </Link>
                </Card>
            </div>
        )
    }

    const statusStyle = STATUS_STYLES[test.status]

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 border-b border-border/40 pb-8">
                <div className="flex items-center gap-4">
                    <Link href="/tests">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tighter text-foreground">{test.title}</h1>
                            <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase tracking-tighter ${statusStyle.className}`}>
                                {statusStyle.label}
                            </div>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {test.subject} &bull; {TYPE_LABELS[test.testType]} &bull; {test.batch.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ScoreUploadDialog testId={testId} batchId={test.batchId} />
                    <BulkScoreUploadDialog testId={testId} />
                    {test.status !== "PUBLISHED" && (
                        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={handlePublish} disabled={isPublishing}>
                            {isPublishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span>Publish</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Test Info + Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-border/60">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Marks</p>
                    <p className="text-2xl font-bold tabular-nums mt-1">{test.totalMarks}</p>
                    {test.passingMarks && <p className="text-[11px] text-muted-foreground">Pass: {test.passingMarks}</p>}
                </Card>
                <Card className="p-4 border-border/60">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Date</p>
                    <p className="text-lg font-semibold mt-1">
                        {new Date(test.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {test.time && <p className="text-[11px] text-muted-foreground">{test.time}</p>}
                    {test.duration && <p className="text-[11px] text-muted-foreground">{test.duration} mins</p>}
                </Card>
                {stats && (
                    <>
                        <Card className="p-4 border-border/60">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Average</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">{stats.average}</p>
                            <p className="text-[11px] text-muted-foreground">Pass rate: {stats.passPercentage}%</p>
                        </Card>
                        <Card className="p-4 border-border/60">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Appeared</p>
                            <p className="text-2xl font-bold tabular-nums mt-1">{stats.appeared}/{stats.totalStudents}</p>
                            <p className="text-[11px] text-muted-foreground">{stats.absent} absent</p>
                        </Card>
                    </>
                )}
            </div>

            {/* Scores Table */}
            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                {/* Table header row with score count */}
                <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-muted/5">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Scores
                        {pagination && (
                            <span className="ml-2 font-normal normal-case tracking-normal text-muted-foreground/70">
                                — {pagination.total} total
                            </span>
                        )}
                    </p>
                    {scoresLoading || scoresFetching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    ) : null}
                </div>

                {scoresLoading ? (
                    <div className="divide-y divide-border/40">
                        {[1, 2, 3, 4, 5].map((row) => (
                            <div key={row} className="px-6 py-4 flex items-center gap-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-8" />
                                <Skeleton className="h-5 w-12 rounded-md" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                ) : scores.length === 0 ? (
                    <div className="text-center py-16">
                        <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">No Scores Yet</h3>
                        <p className="text-[11px] text-muted-foreground mt-2">Upload scores using the buttons above.</p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader className="bg-muted/5">
                                <TableRow className="hover:bg-transparent border-border/60">
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Student</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Marks</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Percentage</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Grade</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Status</TableHead>
                                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Remarks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scores.map((score) => {
                                    const scoreStyle = SCORE_STATUS_STYLES[score.status]
                                    return (
                                        <TableRow key={score.id} className="border-border/40 hover:bg-muted/10 transition-colors">
                                            <TableCell className="py-3 pl-8">
                                                <span className="font-semibold text-sm tracking-tight text-foreground">{score.student.fullname}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[13px] font-semibold tabular-nums">{score.marksObtained}/{test.totalMarks}</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[13px] font-medium tabular-nums">{score.percentage}%</span>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[13px] font-bold">{score.grade || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className={`text-[10px] font-semibold px-2 py-0.5 rounded border w-fit uppercase tracking-tighter ${scoreStyle.className}`}>
                                                    {scoreStyle.label}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-[11px] text-muted-foreground">{score.remarks || "-"}</span>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-3 border-t border-border/60 bg-muted/5">
                                <p className="text-[11px] text-muted-foreground tabular-nums">
                                    Page {pagination.page} of {pagination.totalPages}
                                    <span className="ml-2 text-muted-foreground/60">
                                        ({(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total})
                                    </span>
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={pagination.page <= 1 || scoresFetching}
                                        onClick={() => setScorePage(p => p - 1)}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={pagination.page >= pagination.totalPages || scoresFetching}
                                        onClick={() => setScorePage(p => p + 1)}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    )
}
