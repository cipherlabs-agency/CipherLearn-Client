"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, FileDown, Upload } from "lucide-react"
import { StudentTable } from "@/components/students/StudentTable"
import { AddStudentDialog } from "@/components/students/AddStudentDialog"
import { ImportStudentCsvDialog } from "@/components/students/ImportStudentCsvDialog"

export default function StudentsPage() {
    return (
        <div className="space-y-12 py-10 px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                        Students
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium">Manage your academic registry and student enrollments.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <ImportStudentCsvDialog />
                    <Button variant="outline" className="h-9 px-4 text-[11px] font-semibold uppercase tracking-widest rounded-md border-border/60 hover:bg-muted/50 transition-all gap-2">
                        <FileDown className="h-3.5 w-3.5" /> Export Manifest
                    </Button>
                    <AddStudentDialog />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                    <input
                        type="search"
                        placeholder="Search registry..."
                        className="w-full pl-10 pr-4 h-10 bg-muted/20 border border-border/40 rounded-md text-[13px] placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none"
                    />
                </div>
                <Button variant="outline" className="h-10 px-4 text-[11px] font-semibold uppercase tracking-widest rounded-md border-border/60 hover:bg-muted/50 transition-all">
                    Filter Parameters
                </Button>
            </div>

            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <StudentTable />
            </Card>

            <div className="flex items-center justify-between py-8 border-t border-border/40">
                <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest opacity-60">
                    Displaying <span className="text-foreground font-bold">1-10</span> of <span className="text-foreground font-bold">128</span> Records
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-semibold uppercase tracking-widest border-border/60 hover:bg-muted/50 transition-all">Previous</Button>
                    <Button variant="outline" size="sm" className="h-8 px-4 text-[10px] font-semibold uppercase tracking-widest border-border/60 hover:bg-muted/50 transition-all">Next</Button>
                </div>
            </div>
        </div>
    )
}
