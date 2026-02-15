"use client"

import { Card } from "@/components/ui/card"
import { LectureTable } from "@/components/lectures/LectureTable"
import { AddLectureDialog } from "@/components/lectures/AddLectureDialog"

export default function LecturesPage() {
    return (
        <div className="space-y-12 py-10 px-8 max-w-[1400px] mx-auto animate-in fade-in duration-700">
            <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-8 border-b border-border/40 pb-12">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-foreground">
                        Lectures
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium">Schedule and manage lectures across batches.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <AddLectureDialog />
                </div>
            </div>

            <Card className="!p-0 overflow-hidden border-border/60 shadow-sm">
                <LectureTable />
            </Card>
        </div>
    )
}
