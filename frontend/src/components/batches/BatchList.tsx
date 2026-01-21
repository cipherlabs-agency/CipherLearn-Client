"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Users, Calendar, Clock, Loader2, Trash2 } from "lucide-react"
import { useGetAllBatchesQuery, useDeleteBatchMutation } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import type { Batch } from "@/types"
import type { FC } from "react"
import { CreateBatchDialog } from "./CreateBatchDialog"

import { Skeleton } from "@/components/ui/skeleton"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const BatchList: FC = () => {
    const { data: batches, isLoading, isError } = useGetAllBatchesQuery()
    const [deleteBatch, { isLoading: isDeleting }] = useDeleteBatchMutation()

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
                <h3 className="font-semibold text-destructive mb-1 uppercase text-sm tracking-tight">Access Denied</h3>
                <p className="text-[11px] text-muted-foreground max-w-[250px] mb-6 font-medium leading-relaxed">
                    The connection to the batch database has been interrupted. Verify your credentials.
                </p>
                <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 text-[10px] font-semibold uppercase tracking-widest border-destructive/20 hover:bg-destructive hover:text-white transition-all"
                    onClick={() => window.location.reload()}
                >
                    Reset Connection
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
                <h3 className="text-sm font-semibold tracking-tight uppercase opacity-80 mb-2">No Clusters Found</h3>
                <p className="text-[11px] text-muted-foreground max-w-[300px] text-center mb-10 font-medium leading-relaxed">
                    Initialize your first training cluster to start managing student deployments and schedules.
                </p>
                <div className="transform scale-105">
                     <CreateBatchDialog />
                </div>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {batches.map((batch: Batch) => (
                <Card 
                    key={batch.id} 
                    className="flex flex-col justify-between group relative overflow-hidden h-[280px] hover:border-foreground/20 hover:shadow-sm transition-all border-border/60"
                >
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-6">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-base tracking-tight leading-none text-foreground">
                                    {batch.name}
                                </h3>
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.1em] opacity-50">
                                    Node • {batch.id.toString().padStart(4, '0')}
                                </p>
                            </div>
                            <Badge 
                                variant="outline" 
                                className={`text-[9px] px-2 py-0 h-5 font-semibold tracking-widest border-0 ${
                                    batch.isDeleted 
                                    ? 'bg-rose-500/10 text-rose-500' 
                                    : 'bg-emerald-500/10 text-emerald-500'
                                }`}
                            >
                                {batch.isDeleted ? 'OFFLINE' : 'ONLINE'}
                            </Badge>
                        </div>
                        
                        <div className="grid gap-3 pt-6 border-t border-border/40 flex-1">
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                                    <Users className="h-3 w-3 mr-2" />
                                    <span>Deployment</span>
                                </div>
                                <span className="font-bold tabular-nums text-foreground/80">
                                    {typeof batch.totalStudents === 'object' ? batch.totalStudents?.enrolled ?? 0 : 0} <span className="text-muted-foreground/40 font-medium">/</span> {typeof batch.totalStudents === 'object' ? batch.totalStudents?.capacity ?? 0 : batch.totalStudents ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                                    <Clock className="h-3 w-3 mr-2" />
                                    <span>Sync Time</span>
                                </div>
                                <span className="font-bold tabular-nums text-foreground/80">{batch.timings.time || '--:--'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                                <div className="flex items-center text-muted-foreground font-semibold uppercase tracking-wider opacity-60">
                                    <Calendar className="h-3 w-3 mr-2" />
                                    <span>Frequency</span>
                                </div>
                                <span className="font-bold text-foreground/80 truncate max-w-[100px]" title={batch.timings.days.join(', ')}>
                                    {batch.timings.days.length > 0 ? batch.timings.days.slice(0, 2).join(', ') + (batch.timings.days.length > 2 ? '...' : '') : '--'}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border/40">
                            <Button 
                                variant="secondary" 
                                className="flex-1 h-8 text-[10px] font-semibold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all"
                            >
                                Interface
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/5"
                                onClick={() => handleDelete(batch.id)}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
