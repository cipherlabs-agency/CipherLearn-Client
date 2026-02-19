"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, Loader2, Trash2, ArrowRight } from "lucide-react"
import { useGetAllBatchesQuery, useDeleteBatchMutation } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import type { Batch } from "@/types"
import type { FC } from "react"
import { CreateBatchDialog } from "./CreateBatchDialog"
import { useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const BatchList: FC = () => {
    const { data: batches, isLoading, isError } = useGetAllBatchesQuery()
    const [deleteBatch, { isLoading: isDeleting }] = useDeleteBatchMutation()
    const router = useRouter()

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this batch?")) return
        try {
            await deleteBatch(id).unwrap()
            toast.success("Batch deleted successfully")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to delete batch")
        }
    }
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="h-[240px] flex flex-col justify-between border-border/60">
                        <div className="space-y-4 p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-32 bg-muted/30 rounded-md" />
                                    <Skeleton className="h-3 w-20 bg-muted/20 rounded-md" />
                                </div>
                                <Skeleton className="h-5 w-16 bg-muted/40 rounded-full" />
                            </div>
                            <div className="space-y-3 pt-4">
                                <Skeleton className="h-3 w-full bg-muted/20" />
                                <Skeleton className="h-3 w-4/5 bg-muted/10" />
                                <Skeleton className="h-3 w-2/3 bg-muted/10" />
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <Skeleton className="h-8 w-full bg-muted/30 rounded-md" />
                        </div>
                    </Card>
                ))}
            </div>
        )
    }

    if (isError) {
        return (
            <Card className="flex flex-col items-center justify-center py-20 px-4 border-dashed border-destructive/30 bg-destructive/5 text-center m-6">
                <div className="bg-destructive/10 p-3 rounded-full mb-4">
                    <Loader2 className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-semibold text-destructive mb-1 text-sm tracking-tight">Something Went Wrong</h3>
                <p className="text-[13.5px] text-muted-foreground max-w-[280px] mb-6 font-medium leading-relaxed">
                    We couldn&apos;t load your batches. Please check your connection and try again.
                </p>
                <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 text-[13px] font-semibold border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </Button>
            </Card>
        )
    }

    if (!batches || batches.length === 0) {
        return (
            <Card className="flex flex-col items-center justify-center py-24 border-dashed border-border/60 bg-muted/5 m-6">
                <div className="bg-foreground/5 p-4 rounded-full mb-4 border border-border/20">
                    <Calendar className="h-8 w-8 text-foreground/40" />
                </div>
                <h3 className="text-base font-semibold tracking-tight mb-2">No Batches Yet</h3>
                <p className="text-[14px] text-muted-foreground max-w-[320px] text-center mb-10 font-medium leading-relaxed">
                    Create your first batch to start managing students and schedules.
                </p>
                <div className="transform scale-105">
                     <CreateBatchDialog />
                </div>
            </Card>
        )
    }

    return (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch: Batch) => {
                const enrolled = typeof batch.totalStudents === 'object' ? batch.totalStudents?.enrolled ?? 0 : 0
                const capacity = typeof batch.totalStudents === 'object' ? batch.totalStudents?.capacity ?? 0 : batch.totalStudents ?? 0
                const fillPercent = capacity > 0 ? Math.round((enrolled / Number(capacity)) * 100) : 0

                return (
                    <Card 
                        key={batch.id} 
                        className="flex flex-col justify-between group relative overflow-hidden hover:border-foreground/20 hover:shadow-md transition-all duration-200 border-border/60 cursor-pointer"
                        onClick={() => router.push(`/batches/${batch.id}`)}
                    >
                        <div className="p-6 flex flex-col h-full">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-5">
                                <div className="space-y-1 min-w-0 flex-1 mr-3">
                                    <h3 className="font-semibold text-[16px] tracking-tight leading-snug text-foreground">
                                        {batch.name}
                                    </h3>
                                    <p className="text-[13px] font-medium text-muted-foreground">
                                        Batch #{batch.id}
                                    </p>
                                </div>
                                <Badge 
                                    variant="outline" 
                                    className={`text-[12px] px-2.5 py-0.5 h-auto font-semibold border-0 shrink-0 ${
                                        batch.isDeleted 
                                        ? 'bg-rose-500/10 text-rose-500' 
                                        : 'bg-emerald-500/10 text-emerald-500'
                                    }`}
                                >
                                    {batch.isDeleted ? 'Archived' : 'Active'}
                                </Badge>
                            </div>
                            
                            {/* Info rows */}
                            <div className="grid gap-3.5 pt-5 border-t border-border/40 flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" />
                                        <span className="text-[13.5px] font-medium">Students</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13.5px] font-semibold tabular-nums text-foreground">
                                            {enrolled} <span className="text-muted-foreground/50 font-normal">of</span> {Number(capacity)}
                                        </span>
                                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all ${
                                                    fillPercent >= 90 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${Math.min(fillPercent, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span className="text-[13.5px] font-medium">Class Time</span>
                                    </div>
                                    <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{batch.timings.time || 'Not set'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span className="text-[13.5px] font-medium">Schedule</span>
                                    </div>
                                    <span className="text-[13.5px] font-semibold text-foreground truncate max-w-[140px]" title={batch.timings.days.join(', ')}>
                                        {batch.timings.days.length > 0 
                                            ? batch.timings.days.map(d => d.slice(0, 3)).join(', ')
                                            : 'Not set'}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/40">
                                <Button 
                                    variant="secondary" 
                                    className="flex-1 h-9 text-[13px] font-semibold gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
                                    onClick={(e) => { e.stopPropagation(); router.push(`/batches/${batch.id}`) }}
                                >
                                    View Students
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/5"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(batch.id) }}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                            </div>
                        </div>
                    </Card>
                )
            })}
        </div>
    )
}
