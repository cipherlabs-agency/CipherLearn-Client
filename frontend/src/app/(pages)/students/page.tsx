"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Search, FileDown, Upload, Users, UserCheck, IndianRupee, GraduationCap } from "lucide-react"
import { StudentTable } from "@/components/students/StudentTable"
import { AddStudentDialog } from "@/components/students/AddStudentDialog"
import { ImportStudentCsvDialog } from "@/components/students/ImportStudentCsvDialog"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useState, useMemo } from "react"
import type { Student } from "@/types"

function formatCurrency(amt: number): string {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amt)
}

export default function StudentsPage() {
    const { data: students = [], isLoading } = useGetStudentsQuery(undefined)
    const { data: batches = [] } = useGetBatchesQuery()
    const [search, setSearch] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 15

    // Functional search — filters by name, email, phone, or batch name
    const batchNameMap = useMemo(() => {
        const map: Record<number, string> = {}
        batches.forEach(b => { map[b.id] = b.name })
        return map
    }, [batches])

    const filtered = useMemo(() => {
        if (!search.trim()) return students
        const q = search.toLowerCase().trim()
        return students.filter((s: Student) =>
            s.fullname.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.phone?.toLowerCase().includes(q) ||
            s.parentName?.toLowerCase().includes(q) ||
            batchNameMap[s.batchId]?.toLowerCase().includes(q)
        )
    }, [students, search, batchNameMap])

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
    const safePage = Math.min(currentPage, totalPages)
    const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

    // Quick stats
    const totalStudents = students.length
    const uniqueBatches = new Set(students.map((s: Student) => s.batchId)).size

    return (
        <div className="space-y-6 py-5 px-6 max-w-[1400px] mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 pb-5 border-b border-border/40">
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-foreground">
                        My Students
                    </h1>
                    <p className="text-muted-foreground mt-0.5 text-[13px] font-medium">Your classroom at a glance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <ImportStudentCsvDialog />
                    <Button variant="outline" className="h-8 px-3 text-[12px] font-semibold rounded-md border-border/60 hover:bg-muted/50 transition-all gap-1.5">
                        <FileDown className="h-3.5 w-3.5" /> Export List
                    </Button>
                    <AddStudentDialog />
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-500/8 p-2"><Users className="h-4 w-4 text-blue-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Total Students</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{totalStudents}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-500/8 p-2"><GraduationCap className="h-4 w-4 text-violet-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Active Batches</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{uniqueBatches}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/8 p-2"><UserCheck className="h-4 w-4 text-emerald-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Showing</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{filtered.length}</p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">
                                {search ? "matching results" : "all students"}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-500/8 p-2"><IndianRupee className="h-4 w-4 text-amber-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">This Page</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {paginated.length} <span className="text-[12px] font-medium text-muted-foreground">of {filtered.length}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-40" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                        placeholder="Search by name, email, phone, or batch..."
                        className="w-full pl-10 pr-4 h-9 bg-muted/20 border border-border/40 rounded-lg text-[13px] placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none"
                    />
                </div>
                {search && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-[12px] text-muted-foreground hover:text-foreground"
                        onClick={() => { setSearch(""); setCurrentPage(1); }}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <StudentTable
                    students={paginated}
                    allStudents={students}
                    batchNameMap={batchNameMap}
                    isLoading={isLoading}
                    search={search}
                />
            </Card>

            {/* Pagination */}
            {filtered.length > pageSize && (
                <div className="flex items-center justify-between py-2">
                    <p className="text-[11px] text-muted-foreground/60 font-medium">
                        Showing <span className="text-foreground font-semibold">{(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filtered.length)}</span> of <span className="text-foreground font-semibold">{filtered.length}</span> students
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[11px] font-semibold border-border/60 hover:bg-muted/50 transition-all"
                            disabled={safePage <= 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        >
                            Previous
                        </Button>
                        <span className="text-[11px] text-muted-foreground font-medium px-2 tabular-nums">
                            {safePage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-[11px] font-semibold border-border/60 hover:bg-muted/50 transition-all"
                            disabled={safePage >= totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
