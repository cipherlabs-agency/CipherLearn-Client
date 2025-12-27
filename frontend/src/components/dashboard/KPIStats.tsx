"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, TrendingUp } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useGetTotalStudentsCountQuery, useGetTotalBatchesCountQuery } from "@/redux/slices/analytics/analyticsApi"

export function KPIStats() {
    const { data: batchesData, isLoading: batchesLoading } = useGetBatchesQuery(undefined)
    const { data: studentsCountData, isLoading: studentsLoading } = useGetTotalStudentsCountQuery()
    const { data: batchCountData, isLoading: batchCountLoading } = useGetTotalBatchesCountQuery()

    // Get total students from analytics API
    const studentsCount = studentsCountData?.count || 0

    // Get total batches from analytics API
    const batchesCount = batchCountData?.count || 0

    // Calculate active batches from batches data
    const activeBatchesCount = batchesData?.batches?.filter((b: any) => !b.isDeleted)?.length || 0

    const isLoading = batchesLoading || studentsLoading || batchCountLoading

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                    ) : (
                        <div className="text-2xl font-bold">{studentsCount}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Enrolled across all batches</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                    ) : (
                        <div className="text-2xl font-bold">{batchesCount}</div>
                    )}
                    <p className="text-xs text-muted-foreground">{activeBatchesCount} currently active</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-8 w-20" />
                    ) : (
                        <div className="text-2xl font-bold">{activeBatchesCount}</div>
                    )}
                    <p className="text-xs text-muted-foreground">Non-deleted batches</p>
                </CardContent>
            </Card>
        </div>
    )
}

