"use client"

import { Card } from "@/components/ui/card"
import { TestTable } from "@/components/tests/TestTable"
import { AddTestDialog } from "@/components/tests/AddTestDialog"

export default function TestsPage() {
    return (
        <div className="space-y-12 py-10 px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                        Tests & Exams
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium">Create tests, upload scores, and track student performance.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AddTestDialog />
                </div>
            </div>

            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <TestTable />
            </Card>
        </div>
    )
}
