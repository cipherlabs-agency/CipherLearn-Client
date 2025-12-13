"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow
// } from "@/components/ui/table"
import { MoreHorizontal, Users, Calendar, Clock, Loader2 } from "lucide-react"
import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { Batch } from "@/types"

export function BatchList() {
    const { data: batches, isLoading } = useGetBatchesQuery({});

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {batches?.map((batch: Batch) => (
                <div key={batch.id} className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
                    <div className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <h3 className="font-semibold leading-none tracking-tight">{batch.name}</h3>
                                <p className="text-sm text-muted-foreground">{batch.subject}</p>
                            </div>
                            <Badge variant={batch.status === 'Active' ? 'default' : 'secondary'}>
                                {batch.status}
                            </Badge>
                        </div>
                        <div className="mt-4 space-y-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Users className="mr-2 h-4 w-4" />
                                {batch.students} Students
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="mr-2 h-4 w-4" />
                                {batch.time}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="mr-2 h-4 w-4" />
                                {batch.days}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t p-4 bg-muted/50">
                        <Button variant="ghost" size="sm" className="w-full">View Details</Button>
                    </div>
                </div>
            ))}
        </div>
    )
}
