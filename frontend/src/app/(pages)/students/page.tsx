"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, FileDown, Upload } from "lucide-react"
import { StudentTable } from "@/components/students/StudentTable"

export default function StudentsPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Students</h1>
                    <p className="text-muted-foreground">Manage your student enrollment and details.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Import CSV
                    </Button>
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" /> Export
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search by name, email..."
                        className="pl-8 bg-background"
                    />
                </div>
                <div>{/* Filter can go here */}</div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <StudentTable />
                </CardContent>
            </Card>

            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
            </div>
        </div>
    )
}
