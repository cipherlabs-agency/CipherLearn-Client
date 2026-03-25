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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Trash2,
    Loader2,
    Mail,
    Phone,
    GraduationCap,
    ChevronRight,
} from "lucide-react"
import { AddStudentDialog } from "./AddStudentDialog"
import { ImportStudentCsvDialog } from "./ImportStudentCsvDialog"
import { FC, useState } from "react"
import { useDeleteStudentMutation } from "@/redux/slices/students/studentsApi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Student } from "@/types"

// ─── Helpers ──────────────────────────────────────────────

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.charAt(0).toUpperCase()
}

// ─── Props ────────────────────────────────────────────────

interface StudentTableProps {
    students: Student[]
    totalInDatabase: number | undefined
    batchNameMap: Record<number, string>
    isLoading: boolean
    search: string
}

// ─── Component ────────────────────────────────────────────

export const StudentTable: FC<StudentTableProps> = ({
    students,
    totalInDatabase,
    batchNameMap,
    isLoading,
    search,
}) => {
    const router = useRouter()
    const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation()
    const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)

    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await deleteStudent(deleteTarget.id).unwrap()
            toast.success(`${deleteTarget.fullname} has been removed.`)
            setDeleteTarget(null)
        } catch (error: any) {
            toast.error(error?.data?.message || "Couldn't remove this student. Please try again.")
        }
    }

    // ─── Loading ──────────────────────────────────────────

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border-b border-border bg-muted/5 px-5 py-3">
                    <div className="grid grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-3 w-20 bg-muted/40" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                    <div key={row} className="px-5 py-3 border-b border-border/30 flex items-center gap-4">
                        <Skeleton className="h-8 w-8 rounded-full bg-muted/20" />
                        <div className="space-y-1.5 flex-1">
                            <Skeleton className="h-3.5 w-32 bg-muted/20" />
                            <Skeleton className="h-2.5 w-20 bg-muted/10" />
                        </div>
                        <Skeleton className="h-3 w-28 bg-muted/15" />
                        <Skeleton className="h-5 w-16 bg-muted/20 rounded" />
                        <Skeleton className="h-3 w-16 bg-muted/15" />
                    </div>
                ))}
            </div>
        )
    }

    // ─── Error ────────────────────────────────────────────

    if (totalInDatabase === 0 && !search) {
        return (
            <Card className="text-center py-16 border-dashed border-border/60 bg-muted/5 m-5 flex flex-col items-center">
                <GraduationCap className="h-8 w-8 text-foreground/20 mb-3" />
                <h3 className="text-sm font-semibold tracking-tight mb-1">No students yet</h3>
                <p className="text-[13px] text-muted-foreground mt-1 max-w-[280px] mx-auto font-medium leading-relaxed">
                    Add your first student to get started. You can add them one by one or import from a spreadsheet.
                </p>
                <div className="mt-8 flex gap-3 justify-center items-center">
                    <AddStudentDialog />
                    <div className="h-5 w-px bg-border/60" />
                    <ImportStudentCsvDialog />
                </div>
            </Card>
        )
    }

    // ─── Empty search ─────────────────────────────────────

    if (students.length === 0 && search) {
        return (
            <div className="flex flex-col items-center justify-center py-14 text-center">
                <p className="text-[13px] font-medium text-muted-foreground mb-1">No results for &ldquo;{search}&rdquo;</p>
                <p className="text-[12px] text-muted-foreground/60">Try a different name, email, or batch.</p>
            </div>
        )
    }

    // ─── Table ────────────────────────────────────────────

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent border-border/50 bg-muted/20">
                        <TableHead className="text-[11px] font-semibold py-2.5 pl-5 text-muted-foreground/80 uppercase tracking-wider w-[220px]">Student</TableHead>
                        <TableHead className="text-[11px] font-semibold py-2.5 text-muted-foreground/80 uppercase tracking-wider w-[200px]">Contact</TableHead>
                        <TableHead className="text-[11px] font-semibold py-2.5 text-muted-foreground/80 uppercase tracking-wider w-[140px]">Batch</TableHead>
                        <TableHead className="text-[11px] font-semibold py-2.5 text-muted-foreground/80 uppercase tracking-wider w-[80px]">Grade</TableHead>
                        <TableHead className="text-[11px] font-semibold py-2.5 text-muted-foreground/80 uppercase tracking-wider w-[100px]">Joined</TableHead>
                        <TableHead className="text-[11px] font-semibold py-2.5 text-muted-foreground/80 uppercase tracking-wider text-right pr-5 w-[60px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student: Student) => (
                        <TableRow
                            key={student.id}
                            className="group border-border/25 hover:bg-muted/8 transition-colors cursor-pointer"
                            onClick={() => router.push(`/students/${student.id}`)}
                        >
                            {/* Student */}
                            <TableCell className="py-2.5 pl-5">
                                <div className="flex items-center gap-2.5">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0">
                                        {getInitials(student.fullname)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-[13px] text-foreground leading-tight truncate">{student.fullname}</p>
                                        {student.parentName && (
                                            <p className="text-[10.5px] text-muted-foreground/60 leading-tight truncate mt-px">c/o {student.parentName}</p>
                                        )}
                                    </div>
                                </div>
                            </TableCell>

                            {/* Contact */}
                            <TableCell className="py-2.5">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[12.5px] text-foreground/75 font-medium flex items-center gap-1.5 truncate">
                                        <Mail className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                                        {student.email}
                                    </span>
                                    {student.phone && (
                                        <span className="text-[11px] text-muted-foreground/50 font-medium flex items-center gap-1.5 tabular-nums">
                                            <Phone className="h-2.5 w-2.5 text-muted-foreground/30 shrink-0" />
                                            {student.phone}
                                        </span>
                                    )}
                                </div>
                            </TableCell>

                            {/* Batch */}
                            <TableCell className="py-2.5">
                                <span className="inline-flex items-center text-[11.5px] font-semibold text-foreground/70 bg-muted/40 rounded-md px-2 py-0.5 border border-border/30 truncate max-w-[120px]">
                                    {batchNameMap[student.batchId] || `Batch #${student.batchId}`}
                                </span>
                            </TableCell>

                            {/* Grade */}
                            <TableCell className="py-2.5">
                                {student.grade ? (
                                    <span className="inline-flex items-center text-[11px] font-semibold text-foreground/70 bg-muted/50 rounded px-1.5 py-0.5 border border-border/30">
                                        {student.grade}
                                    </span>
                                ) : (
                                    <span className="text-[12px] text-muted-foreground/40">—</span>
                                )}
                            </TableCell>

                            {/* Joined */}
                            <TableCell className="py-2.5">
                                <span className="text-[11.5px] text-muted-foreground/60 tabular-nums">
                                    {new Date(student.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </span>
                            </TableCell>

                            {/* Actions */}
                            <TableCell className="py-2.5 text-right pr-5">
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(student); }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {deleteTarget?.fullname}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove them from their batch. Their data can be restored later from Settings if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Removing...</>
                            ) : (
                                "Remove Student"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
