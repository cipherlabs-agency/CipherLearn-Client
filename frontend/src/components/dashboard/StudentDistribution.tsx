"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { useGetStudentsQuery } from "@/redux/slices/students/studentsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function StudentDistribution() {
    const { data: studentsData } = useGetStudentsQuery(undefined)
    const { data: batchesData } = useGetAllBatchesQuery({})

    const students = studentsData || []
    const batches = batchesData?.data || []

    const data = students.reduce((acc: any[], student: any) => {
        const batch = batches.find((b: any) => b.id === student.batchId)
        const batchName = batch ? batch.name : "Unassigned"
        
        const existing = acc.find(item => item.name === batchName)
        if (existing) {
            existing.value += 1
        } else {
            acc.push({ name: batchName, value: 1 })
        }
        return acc
    }, [])

    if (data.length === 0) {
        data.push({ name: "No Data", value: 1 }) // Placeholder to avoid empty chart
    }

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Student Distribution</CardTitle>
                <CardDescription>Distribution of students across subjects.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
