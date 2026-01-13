"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableCaption
} from "@/components/ui/table"
import { MoreHorizontal, Trash2 } from "lucide-react"
import { useGetStudentsQuery, useDeleteStudentMutation } from "@/redux/slices/students/studentsApi"
import { Loader2 } from "lucide-react"

export function StudentTable() {
    const { data, isLoading, isError } = useGetStudentsQuery(undefined);
    const students = data;
    const [deleteStudent, { isLoading: isDeleting }] = useDeleteStudentMutation();

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    if (isError) {
        return <div className="text-red-500 p-4">Failed to load students.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students?.map((student: any) => (
                        <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-muted-foreground">{student.email}</TableCell>
                            <TableCell>{student.batch}</TableCell>
                            <TableCell>{student.joinDate}</TableCell>
                            <TableCell>
                                <Badge variant={student.status === 'Active' ? 'default' : student.status === 'Inactive' ? 'secondary' : 'destructive'}>
                                    {student.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => deleteStudent(student.id)}
                                    disabled={isDeleting}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
