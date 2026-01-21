"use client"

import { useState, useEffect } from "react"
import { Users, AlertCircle, CheckCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useBulkCreateReceiptsMutation, useGetFeeStructuresByBatchQuery } from "@/redux/slices/fees/feesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { BulkCreateReceiptsInput, BulkCreateResult } from "@/types"

const MONTHS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
]

interface BulkCreateReceiptsDialogProps {
    onSuccess?: () => void
}

export function BulkCreateReceiptsDialog({ onSuccess }: BulkCreateReceiptsDialogProps) {
    const [open, setOpen] = useState(false)
    const [selectedBatchId, setSelectedBatchId] = useState<string>("")
    const [selectedStructureId, setSelectedStructureId] = useState<string>("")
    const [academicMonth, setAcademicMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [academicYear, setAcademicYear] = useState<string>(String(new Date().getFullYear()))
    const [dueDate, setDueDate] = useState<string>("")
    const [result, setResult] = useState<BulkCreateResult | null>(null)

    const { data: batches = [] } = useGetAllBatchesQuery()
    const { data: feeStructures = [] } = useGetFeeStructuresByBatchQuery(
        selectedBatchId ? Number(selectedBatchId) : 0,
        { skip: !selectedBatchId }
    )

    const [bulkCreate, { isLoading }] = useBulkCreateReceiptsMutation()

    // Update due date when structure or month changes
    useEffect(() => {
        if (selectedStructureId) {
            const structure = feeStructures.find(s => s.id === Number(selectedStructureId))
            if (structure) {
                const dueDay = structure.dueDay || 5
                const year = Number(academicYear)
                const month = Number(academicMonth) - 1
                const date = new Date(year, month, dueDay)
                setDueDate(date.toISOString().split('T')[0])
            }
        }
    }, [selectedStructureId, feeStructures, academicMonth, academicYear])

    const resetForm = () => {
        setSelectedBatchId("")
        setSelectedStructureId("")
        setAcademicMonth(String(new Date().getMonth() + 1))
        setAcademicYear(String(new Date().getFullYear()))
        setDueDate("")
        setResult(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedBatchId || !selectedStructureId || !dueDate) {
            return
        }

        const input: BulkCreateReceiptsInput = {
            batchId: Number(selectedBatchId),
            feeStructureId: Number(selectedStructureId),
            academicMonth: Number(academicMonth),
            academicYear: Number(academicYear),
            dueDate,
        }

        try {
            const res = await bulkCreate(input).unwrap()
            setResult(res)
            onSuccess?.()
        } catch (error) {
            console.error("Failed to bulk create receipts:", error)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setTimeout(resetForm, 300) // Reset after animation
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)
    const selectedBatch = batches.find(b => b.id === Number(selectedBatchId))
    const selectedStructure = feeStructures.find(s => s.id === Number(selectedStructureId))

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Bulk Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold">Bulk Generate Receipts</DialogTitle>
                    <DialogDescription>
                        Generate fee receipts for all students in a batch at once.
                    </DialogDescription>
                </DialogHeader>

                {result ? (
                    <div className="space-y-4 py-4">
                        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                            <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div className="space-y-1">
                                    <p className="font-medium text-green-600">Bulk Generation Complete</p>
                                    <p className="text-sm text-muted-foreground">
                                        Successfully created {result.created} receipts out of {result.total} students.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {result.skipped > 0 && (
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-amber-600">Skipped Students</p>
                                        <p className="text-sm text-muted-foreground">
                                            {result.skipped} students already had receipts for this month.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {result.errors && result.errors.length > 0 && (
                            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-red-600">Errors</p>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                                            {result.errors.slice(0, 5).map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                            {result.errors.length > 5 && (
                                                <li>...and {result.errors.length - 5} more</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={handleClose}>Done</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Batch Selection */}
                        <div className="space-y-2">
                            <Label>Batch *</Label>
                            <Select value={selectedBatchId} onValueChange={(v) => {
                                setSelectedBatchId(v)
                                setSelectedStructureId("")
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map((batch) => {
                                        const studentCount = typeof batch.totalStudents === 'object' 
                                            ? batch.totalStudents?.enrolled 
                                            : batch.totalStudents;
                                        return (
                                            <SelectItem key={batch.id} value={String(batch.id)}>
                                                {batch.name} ({studentCount ?? 0} students)
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fee Structure */}
                        <div className="space-y-2">
                            <Label>Fee Structure *</Label>
                            <Select
                                value={selectedStructureId}
                                onValueChange={setSelectedStructureId}
                                disabled={!selectedBatchId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select fee structure" />
                                </SelectTrigger>
                                <SelectContent>
                                    {feeStructures.map((structure) => (
                                        <SelectItem key={structure.id} value={String(structure.id)}>
                                            {structure.name} - ₹{structure.amount}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedBatchId && feeStructures.length === 0 && (
                                <p className="text-xs text-amber-500">
                                    No fee structures found for this batch. Create one first.
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Academic Month */}
                            <div className="space-y-2">
                                <Label>Academic Month *</Label>
                                <Select value={academicMonth} onValueChange={setAcademicMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((month) => (
                                            <SelectItem key={month.value} value={String(month.value)}>
                                                {month.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Academic Year */}
                            <div className="space-y-2">
                                <Label>Academic Year *</Label>
                                <Select value={academicYear} onValueChange={setAcademicYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={String(year)}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label>Due Date *</Label>
                            <Input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>

                        {/* Summary */}
                        {selectedBatch && selectedStructure && (
                            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                                <p className="text-sm font-medium">Summary</p>
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>Batch: <span className="text-foreground">{selectedBatch.name}</span></p>
                                    <p>Fee: <span className="text-foreground">₹{selectedStructure.amount} ({selectedStructure.name})</span></p>
                                    <p>Students: <span className="text-foreground">{
                                        typeof selectedBatch.totalStudents === 'object' 
                                            ? selectedBatch.totalStudents?.enrolled ?? 0 
                                            : selectedBatch.totalStudents ?? 0
                                    }</span></p>
                                    <p>Period: <span className="text-foreground">{MONTHS.find(m => m.value === Number(academicMonth))?.label} {academicYear}</span></p>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading || !selectedBatchId || !selectedStructureId || !dueDate}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Receipts"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
