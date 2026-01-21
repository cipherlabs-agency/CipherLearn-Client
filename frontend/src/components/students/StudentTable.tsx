"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    Edit, 
    Trash2, 
    Loader2, 
    Mail, 
    Calendar, 
    Users, 
    MoreHorizontal 
} from "lucide-react"
import { AddStudentDialog } from "./AddStudentDialog"
import { ImportStudentCsvDialog } from "./ImportStudentCsvDialog"
import { FC } from "react"
import { useGetStudentsQuery, useDeleteStudentMutation } from "@/redux/slices/students/studentsApi"
import { toast } from "sonner"
import { Student } from "@/types"

export const StudentTable: FC = () => {
    const { data: students, isLoading, isError } = useGetStudentsQuery(undefined);
    const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

    const handleDelete = async (id: number): Promise<void> => {
        try {
            await deleteStudent(id).unwrap();
            toast.success("Student deleted successfully");
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete student");
        }
    };

    if (isLoading) {
        return (
            <div className="w-full">
                <div className="border-b border-border bg-muted/5 px-6 py-3">
                    <div className="grid grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Skeleton key={i} className="h-3 w-20 bg-muted/40" />
                        ))}
                    </div>
                </div>
                {[1, 2, 3, 4, 5].map((row) => (
                    <div key={row} className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                            <Skeleton className="h-8 w-8 rounded-full bg-muted/30" />
                            <div className="space-y-1.5 flex-1">
                                <Skeleton className="h-4 w-32 bg-muted/20" />
                                <Skeleton className="h-3 w-16 bg-muted/10" />
                            </div>
                        </div>
                        <Skeleton className="h-3 w-32 bg-muted/20" />
                        <Skeleton className="h-3 w-20 bg-muted/20" />
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
                <h3 className="text-sm font-semibold tracking-tight text-destructive uppercase">Registry Fault</h3>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[220px] mx-auto font-medium leading-relaxed">Secure data link to the student registry has been compromised. Verify your authorization.</p>
                <Button variant="outline" className="mt-8 h-8 px-4 text-[10px] font-semibold uppercase tracking-widest border-destructive/20 hover:bg-destructive hover:text-white transition-all" onClick={() => window.location.reload()}>
                    Reset Connection
                </Button>
            </Card>
        )
    }

    if (!students || students.length === 0) {
        return (
            <Card className="text-center py-24 border-dashed border-border/60 bg-muted/5 m-6 flex flex-col items-center">
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80">Roster Empty</h3>
                <p className="text-[11px] text-muted-foreground mt-2 max-w-[260px] mx-auto font-medium leading-relaxed">No students are currently registered in the database. Initialize enrollment to populate the registry.</p>
                <div className="mt-10 flex gap-4 justify-center items-center">
                     <AddStudentDialog />
                     <div className="h-6 w-px bg-border/60" />
                     <ImportStudentCsvDialog />
                </div>
            </Card>
        )
    }

    return (
        <Table>
            <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent border-border/60">
                    <TableHead className="w-[300px] text-[10px] font-semibold uppercase tracking-widest py-4 pl-8 text-muted-foreground">Identity</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Metadata</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Program</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest py-4 text-muted-foreground">Enrollment</TableHead>
                    <TableHead className="text-right text-[10px] font-semibold uppercase tracking-widest py-4 pr-10 text-muted-foreground">Manage</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {students.map((student: Student) => (
                    <TableRow key={student.id} className="group border-border/40 hover:bg-muted/10 transition-colors">
                        <TableCell className="py-4 pl-8">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-[10px] border border-foreground/10 transition-transform duration-300 group-hover:scale-105">
                                    {student.fullname.substring(0, 1).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm tracking-tight leading-none text-foreground">{student.fullname}</span>
                                    <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 opacity-40">UUID • {student.id.toString().substring(0, 8)}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-medium tracking-tight text-foreground/80">{student.email}</span>
                                <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-widest opacity-30">Security Verified</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="text-[10px] font-semibold px-2 py-0.5 rounded border border-border/60 bg-muted/30 w-fit uppercase tracking-tighter text-muted-foreground">
                                Node {student.batchId}
                            </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-xs lowercase tracking-tighter tabular-nums">
                            {new Date(student.createdAt).toLocaleDateString("en-US", {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </TableCell>
                        <TableCell className="text-right pr-10">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md hover:bg-muted/50 hover:text-foreground">
                                    <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md hover:bg-rose-500/5 hover:text-rose-500"
                                    onClick={() => handleDelete(student.id)}
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
    )
}
