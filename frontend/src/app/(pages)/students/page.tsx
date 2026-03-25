"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Search, FileDown, Users, UserCheck, IndianRupee, GraduationCap, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { StudentTable } from "@/components/students/StudentTable"
import { AddStudentDialog } from "@/components/students/AddStudentDialog"
import { ImportStudentCsvDialog } from "@/components/students/ImportStudentCsvDialog"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useState, useMemo, useEffect } from "react"

const PAGE_SIZE = 25

export default function StudentsPage() {
    const [searchInput, setSearchInput] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")
    const [page, setPage] = useState(1)

    const { data: batches = [] } = useGetBatchesQuery()

    // Debounce search — waits 400ms after last keystroke before firing API call
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput)
            setPage(1)
        }, 400)
        return () => clearTimeout(timer)
    }, [searchInput])

    const { data, isLoading, isFetching } = useGetStudentsQuery({
        page,
        limit: PAGE_SIZE,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
    })

    const students = data?.students ?? []
    const pagination = data?.pagination

    const batchNameMap = useMemo(() => {
        const map: Record<number, string> = {}
        batches.forEach(b => { map[b.id] = b.name })
        return map
    }, [batches])

    const totalStudents = pagination?.total ?? 0
    const isSearching = debouncedSearch.length > 0

    return (
        <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
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
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {isLoading ? "—" : isSearching ? totalStudents : totalStudents}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-violet-500/8 p-2"><GraduationCap className="h-4 w-4 text-violet-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">Active Batches</p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">{batches.length}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card px-4 py-3.5 hover:border-foreground/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/8 p-2"><UserCheck className="h-4 w-4 text-emerald-500" /></div>
                        <div>
                            <p className="text-[11.5px] text-muted-foreground font-medium leading-none mb-1">
                                {isSearching ? "Matching" : "Showing"}
                            </p>
                            <p className="text-lg font-bold tracking-tight leading-none text-foreground">
                                {isLoading ? "—" : totalStudents}
                            </p>
                            <p className="text-[10.5px] text-muted-foreground/60 mt-0.5 leading-none">
                                {isSearching ? "search results" : "all students"}
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
                                {students.length}{" "}
                                <span className="text-[12px] font-medium text-muted-foreground">of {PAGE_SIZE}</span>
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
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="Search by name, email, phone, or parent..."
                        className="w-full pl-10 pr-4 h-9 bg-muted/20 border border-border/40 rounded-lg text-[13px] placeholder:text-muted-foreground/50 focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none"
                    />
                    {isFetching && !isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground/50" />
                    )}
                </div>
                {searchInput && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 text-[12px] text-muted-foreground hover:text-foreground"
                        onClick={() => setSearchInput("")}
                    >
                        Clear
                    </Button>
                )}
            </div>

            {/* Table */}
            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <StudentTable
                    students={students}
                    totalInDatabase={pagination?.total ?? (isLoading ? undefined : 0)}
                    batchNameMap={batchNameMap}
                    isLoading={isLoading}
                    search={debouncedSearch}
                />
            </Card>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between py-2">
                    <p className="text-[11px] text-muted-foreground/60 font-medium tabular-nums">
                        Showing{" "}
                        <span className="text-foreground font-semibold">
                            {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{" "}
                        of <span className="text-foreground font-semibold">{pagination.total}</span> students
                    </p>
                    <div className="flex items-center gap-1.5">
                        {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={page <= 1 || isFetching}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <span className="text-[11px] text-muted-foreground font-medium px-2 tabular-nums">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            disabled={page >= pagination.totalPages || isFetching}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
