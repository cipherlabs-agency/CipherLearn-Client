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
import { Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import { AddTeacherDialog } from "./AddTeacherDialog"
import { FC, useState } from "react"
import { useGetTeachersQuery, useDeleteTeacherMutation } from "@/redux/slices/teachers/teachersApi"
import { toast } from "sonner"
import { Teacher } from "@/types"

const LIMIT = 20

export const TeacherTable: FC = () => {
    const [page, setPage] = useState(1)
    const { data, isLoading, isError, isFetching } = useGetTeachersQuery({ page, limit: LIMIT })
    const [deleteTeacher, { isLoading: isDeleting }] = useDeleteTeacherMutation()

    const teachers = data?.teachers ?? []
    const pagination = data?.pagination

    const handleDelete = async (id: number): Promise<void> => {
        try {
            await deleteTeacher(id).unwrap()
            toast.success("Teacher deleted successfully")
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to delete teacher")
        }
    }

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border-b border-border bg-muted/5 px-6 py-3">
                    <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-3 w-20" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-6 py-4 border-b border-border/60 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <Card className="text-center py-20 bg-destructive/5 border-dashed border-destructive/30 m-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight text-destructive uppercase">Connection Error</h3>
                <p className="text-[13.5px] text-muted-foreground mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">Failed to load teacher data. Verify your authorization.</p>
                <Button variant="outline" className="mt-8 h-8 px-4 text-[13px] font-semibold uppercase tracking-widest border-destructive/20 hover:bg-destructive hover:text-white transition-all" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </Card>
        )
    }

    if (teachers.length === 0) {
        return (
            <Card className="text-center py-24 border-dashed border-border/60 bg-muted/5 m-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">No Teachers</h3>
                <p className="text-[13.5px] text-muted-foreground mt-2 max-w-[260px] mx-auto font-medium leading-relaxed">No teachers have been added yet. Add a teacher to get started.</p>
                <div className="mt-10">
                    <AddTeacherDialog />
                </div>
            </Card>
        )
    }

    return (
        <>
            <Table>
                <TableHeader className="bg-muted/5">
                    <TableRow className="hover:bg-transparent border-border/60">
                        <TableHead className="w-[280px] text-[13px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Name</TableHead>
                        <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Email</TableHead>
                        <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Status</TableHead>
                        <TableHead className="text-[13px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Added</TableHead>
                        <TableHead className="text-right text-[13px] font-semibold uppercase tracking-widest py-4 pr-10 text-muted-foreground">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {teachers.map((teacher: Teacher) => (
                        <TableRow key={teacher.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                            <TableCell className="py-4 pl-8">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-[13px] border border-foreground/10 transition-transform duration-300 group-hover:scale-105">
                                        {teacher.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-sm tracking-tight leading-none text-foreground">{teacher.name}</span>
                                        <span className="text-[12.5px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 opacity-40">ID • {teacher.id}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-[13.5px] font-medium tracking-tight text-foreground/80">{teacher.email}</span>
                            </TableCell>
                            <TableCell>
                                {teacher.isPasswordSet ? (
                                    <div className="text-[13px] font-semibold px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 w-fit uppercase tracking-tighter text-emerald-600 dark:text-emerald-400">
                                        Active
                                    </div>
                                ) : (
                                    <div className="text-[13px] font-semibold px-2 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 w-fit uppercase tracking-tighter text-amber-600 dark:text-amber-400">
                                        Pending Setup
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground font-medium text-xs lowercase tracking-tighter tabular-nums">
                                {new Date(teacher.createdAt).toLocaleDateString("en-US", {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                })}
                            </TableCell>
                            <TableCell className="text-right pr-10">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                        onClick={() => handleDelete(teacher.id)}
                                        disabled={isDeleting}
                                    >
                                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
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
    )
}
