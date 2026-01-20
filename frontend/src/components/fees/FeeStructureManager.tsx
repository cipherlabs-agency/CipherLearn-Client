"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Settings } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    useGetFeeStructuresByBatchQuery,
    useCreateFeeStructureMutation,
    useUpdateFeeStructureMutation,
    useDeleteFeeStructureMutation,
} from "@/redux/slices/fees/feesApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { FeeStructure, FeeFrequency, CreateFeeStructureInput, UpdateFeeStructureInput } from "@/types"

const FEE_FREQUENCIES: { value: FeeFrequency; label: string }[] = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "SEMI_ANNUAL", label: "Semi-Annual" },
    { value: "ANNUAL", label: "Annual" },
    { value: "ONE_TIME", label: "One-Time" },
]

interface FeeStructureFormProps {
    structure?: FeeStructure
    batchId: number
    onSuccess: () => void
    onCancel: () => void
}

function FeeStructureForm({ structure, batchId, onSuccess, onCancel }: FeeStructureFormProps) {
    const [name, setName] = useState(structure?.name || "")
    const [amount, setAmount] = useState(structure?.amount?.toString() || "")
    const [frequency, setFrequency] = useState<FeeFrequency>(structure?.frequency || "MONTHLY")
    const [dueDay, setDueDay] = useState(structure?.dueDay?.toString() || "5")
    const [lateFee, setLateFee] = useState(structure?.lateFee?.toString() || "0")
    const [gracePeriod, setGracePeriod] = useState(structure?.gracePeriod?.toString() || "7")
    const [description, setDescription] = useState(structure?.description || "")
    const [isActive, setIsActive] = useState(structure?.isActive ?? true)

    const [createStructure, { isLoading: isCreating }] = useCreateFeeStructureMutation()
    const [updateStructure, { isLoading: isUpdating }] = useUpdateFeeStructureMutation()

    const isLoading = isCreating || isUpdating

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !amount) return

        try {
            if (structure) {
                const input: UpdateFeeStructureInput = {
                    name,
                    amount: Number(amount),
                    frequency,
                    dueDay: Number(dueDay),
                    lateFee: Number(lateFee),
                    gracePeriod: Number(gracePeriod),
                    description: description || undefined,
                    isActive,
                }
                await updateStructure({ id: structure.id, data: input }).unwrap()
            } else {
                const input: CreateFeeStructureInput = {
                    batchId,
                    name,
                    amount: Number(amount),
                    frequency,
                    dueDay: Number(dueDay),
                    lateFee: Number(lateFee),
                    gracePeriod: Number(gracePeriod),
                    description: description || undefined,
                }
                await createStructure(input).unwrap()
            }
            onSuccess()
        } catch (error) {
            console.error("Failed to save fee structure:", error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Monthly Tuition Fee"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Amount *</Label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as FeeFrequency)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {FEE_FREQUENCIES.map((f) => (
                                <SelectItem key={f.value} value={f.value}>
                                    {f.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label>Due Day</Label>
                    <Input
                        type="number"
                        value={dueDay}
                        onChange={(e) => setDueDay(e.target.value)}
                        min="1"
                        max="28"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Late Fee</Label>
                    <Input
                        type="number"
                        value={lateFee}
                        onChange={(e) => setLateFee(e.target.value)}
                        min="0"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Grace Period (days)</Label>
                    <Input
                        type="number"
                        value={gracePeriod}
                        onChange={(e) => setGracePeriod(e.target.value)}
                        min="0"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                />
            </div>

            {structure && (
                <div className="flex items-center justify-between">
                    <Label>Active</Label>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !name || !amount}>
                    {isLoading ? (
                        <>
                            <Spinner size="sm" className="mr-2" />
                            Saving...
                        </>
                    ) : structure ? (
                        "Update"
                    ) : (
                        "Create"
                    )}
                </Button>
            </div>
        </form>
    )
}

interface FeeStructureManagerProps {
    batchId?: number
}

export function FeeStructureManager({ batchId: propBatchId }: FeeStructureManagerProps) {
    const [open, setOpen] = useState(false)
    const [selectedBatchId, setSelectedBatchId] = useState<string>(propBatchId?.toString() || "")
    const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null)
    const [showForm, setShowForm] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [structureToDelete, setStructureToDelete] = useState<FeeStructure | null>(null)

    const { data: batches = [] } = useGetAllBatchesQuery()
    const { data: structures = [], isLoading } = useGetFeeStructuresByBatchQuery(
        Number(selectedBatchId) || 0,
        { skip: !selectedBatchId }
    )

    const [deleteStructure, { isLoading: isDeleting }] = useDeleteFeeStructureMutation()

    const handleDelete = async () => {
        if (!structureToDelete) return

        try {
            await deleteStructure(structureToDelete.id).unwrap()
            setDeleteDialogOpen(false)
            setStructureToDelete(null)
        } catch (error) {
            console.error("Failed to delete fee structure:", error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Fee Structures
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Manage Fee Structures</SheetTitle>
                        <SheetDescription>
                            Configure fee structures for each batch.
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-6 space-y-6">
                        {/* Batch Selection */}
                        <div className="space-y-2">
                            <Label>Select Batch</Label>
                            <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a batch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {batches.map((batch) => (
                                        <SelectItem key={batch.id} value={String(batch.id)}>
                                            {batch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedBatchId && (
                            <>
                                {/* Add New Button */}
                                {!showForm && !editingStructure && (
                                    <Button
                                        onClick={() => setShowForm(true)}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Fee Structure
                                    </Button>
                                )}

                                {/* Form */}
                                {(showForm || editingStructure) && (
                                    <div className="border rounded-lg p-4 bg-muted/30">
                                        <h4 className="font-medium mb-4">
                                            {editingStructure ? "Edit Fee Structure" : "New Fee Structure"}
                                        </h4>
                                        <FeeStructureForm
                                            structure={editingStructure || undefined}
                                            batchId={Number(selectedBatchId)}
                                            onSuccess={() => {
                                                setShowForm(false)
                                                setEditingStructure(null)
                                            }}
                                            onCancel={() => {
                                                setShowForm(false)
                                                setEditingStructure(null)
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Structures List */}
                                <div className="space-y-3">
                                    {isLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spinner size="lg" className="text-muted-foreground" />
                                        </div>
                                    ) : structures.length === 0 ? (
                                        <p className="text-sm text-muted-foreground text-center py-8">
                                            No fee structures found for this batch.
                                        </p>
                                    ) : (
                                        structures.map((structure) => (
                                            <div
                                                key={structure.id}
                                                className={`border rounded-lg p-4 ${!structure.isActive ? 'opacity-60' : ''}`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium">{structure.name}</h4>
                                                            {!structure.isActive && (
                                                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                                                    Inactive
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-lg font-bold text-primary">
                                                            {formatCurrency(structure.amount)}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {FEE_FREQUENCIES.find(f => f.value === structure.frequency)?.label} |
                                                            Due: Day {structure.dueDay} |
                                                            Late Fee: {formatCurrency(structure.lateFee || 0)}
                                                        </p>
                                                        {structure.description && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                {structure.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setEditingStructure(structure)}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setStructureToDelete(structure)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Fee Structure</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{structureToDelete?.name}"?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
