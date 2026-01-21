"use client"

import { useState } from "react"
import { AlertTriangle, Trash2, Loader2, RotateCcw, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    useGetDraftBatchesQuery,
    useRestoreBatchesMutation,
    usePurgeDeletedBatchesMutation,
} from "@/redux/slices/batches/batchesApi"
import {
    useGetDeletedStudentsQuery,
    useRestoreStudentsMutation,
    usePurgeDeletedStudentsMutation,
} from "@/redux/slices/students/studentsApi"
import type { Batch, Student } from "@/types"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    confirmText: string
    onConfirm: () => void
    isLoading: boolean
}

function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText,
    onConfirm,
    isLoading,
}: ConfirmDialogProps) {
    const [inputValue, setInputValue] = useState("")
    const isConfirmed = inputValue === confirmText

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm()
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setInputValue("")
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-5 w-5" />
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3">
                        <p className="text-sm text-red-500">
                            This action is irreversible. All associated data will be permanently deleted.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Type <span className="font-mono font-semibold text-foreground">{confirmText}</span> to confirm:
                        </p>
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={confirmText}
                            className="font-mono"
                            disabled={isLoading}
                        />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={!isConfirmed || isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Permanently
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface TrashSectionProps<T extends { id: number }> {
    title: string
    items: T[]
    isLoading: boolean
    selectedIds: number[]
    onToggleSelect: (id: number) => void
    onSelectAll: () => void
    onRestore: () => void
    isRestoring: boolean
    renderItem: (item: T) => React.ReactNode
}

function TrashSection<T extends { id: number }>({
    title,
    items,
    isLoading,
    selectedIds,
    onToggleSelect,
    onSelectAll,
    onRestore,
    isRestoring,
    renderItem,
}: TrashSectionProps<T>) {
    const [isExpanded, setIsExpanded] = useState(false)
    const allSelected = items.length > 0 && selectedIds.length === items.length

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <p className="text-sm text-muted-foreground py-2">No items in trash</p>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {title} ({items.length})
                </button>
                <div className="flex items-center gap-2">
                    {selectedIds.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRestore}
                            disabled={isRestoring}
                            className="text-green-600 border-green-600/30 hover:bg-green-600/10"
                        >
                            {isRestoring ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            Restore ({selectedIds.length})
                        </Button>
                    )}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-2 pl-6">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Checkbox
                            id="select-all"
                            checked={allSelected}
                            onCheckedChange={onSelectAll}
                        />
                        <label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                            Select all
                        </label>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50 transition-colors"
                            >
                                <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onCheckedChange={() => onToggleSelect(item.id)}
                                />
                                {renderItem(item)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface DangerActionProps {
    title: string
    description: string
    buttonText: string
    onClick: () => void
    disabled?: boolean
}

function DangerAction({ title, description, buttonText, onClick, disabled }: DangerActionProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4 border-b border-border last:border-0">
            <div className="space-y-1">
                <h4 className="text-sm font-medium text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 shrink-0"
                onClick={onClick}
                disabled={disabled}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                {buttonText}
            </Button>
        </div>
    )
}

export function DangerZone() {
    const [purgeBatchesOpen, setPurgeBatchesOpen] = useState(false)
    const [purgeStudentsOpen, setPurgeStudentsOpen] = useState(false)
    const [selectedBatchIds, setSelectedBatchIds] = useState<number[]>([])
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])

    // Batches
    const { data: draftBatches = [], isLoading: isLoadingBatches } = useGetDraftBatchesQuery()
    const [restoreBatches, { isLoading: isRestoringBatches }] = useRestoreBatchesMutation()
    const [purgeBatches, { isLoading: isPurgingBatches }] = usePurgeDeletedBatchesMutation()

    // Students
    const { data: deletedStudents = [], isLoading: isLoadingStudents } = useGetDeletedStudentsQuery()
    const [restoreStudents, { isLoading: isRestoringStudents }] = useRestoreStudentsMutation()
    const [purgeStudents, { isLoading: isPurgingStudents }] = usePurgeDeletedStudentsMutation()

    // Batch handlers
    const handleToggleBatch = (id: number) => {
        setSelectedBatchIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const handleSelectAllBatches = () => {
        if (selectedBatchIds.length === draftBatches.length) {
            setSelectedBatchIds([])
        } else {
            setSelectedBatchIds(draftBatches.map((b) => b.id))
        }
    }

    const handleRestoreBatches = async () => {
        try {
            await restoreBatches(selectedBatchIds).unwrap()
            setSelectedBatchIds([])
        } catch (error) {
            console.error("Failed to restore batches:", error)
        }
    }

    const handlePurgeBatches = async () => {
        try {
            await purgeBatches().unwrap()
            setPurgeBatchesOpen(false)
            setSelectedBatchIds([])
        } catch (error) {
            console.error("Failed to purge batches:", error)
        }
    }

    // Student handlers
    const handleToggleStudent = (id: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        )
    }

    const handleSelectAllStudents = () => {
        if (selectedStudentIds.length === deletedStudents.length) {
            setSelectedStudentIds([])
        } else {
            setSelectedStudentIds(deletedStudents.map((s) => s.id))
        }
    }

    const handleRestoreStudents = async () => {
        try {
            await restoreStudents(selectedStudentIds).unwrap()
            setSelectedStudentIds([])
        } catch (error) {
            console.error("Failed to restore students:", error)
        }
    }

    const handlePurgeStudents = async () => {
        try {
            await purgeStudents().unwrap()
            setPurgeStudentsOpen(false)
            setSelectedStudentIds([])
        } catch (error) {
            console.error("Failed to purge students:", error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                    Manage deleted items and perform irreversible destructive actions.
                </p>
            </div>

            {/* Trash Section */}
            <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">Trash</h4>
                    <p className="text-xs text-muted-foreground">
                        Items in trash can be restored or permanently deleted.
                    </p>
                </div>

                <div className="space-y-4 divide-y divide-border">
                    <TrashSection<Batch>
                        title="Deleted Batches"
                        items={draftBatches}
                        isLoading={isLoadingBatches}
                        selectedIds={selectedBatchIds}
                        onToggleSelect={handleToggleBatch}
                        onSelectAll={handleSelectAllBatches}
                        onRestore={handleRestoreBatches}
                        isRestoring={isRestoringBatches}
                        renderItem={(batch) => (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{batch.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {typeof batch.totalStudents === 'object' ? batch.totalStudents?.enrolled ?? 0 : 0} students
                                </p>
                            </div>
                        )}
                    />

                    <div className="pt-4">
                        <TrashSection<Student>
                            title="Deleted Students"
                            items={deletedStudents}
                            isLoading={isLoadingStudents}
                            selectedIds={selectedStudentIds}
                            onToggleSelect={handleToggleStudent}
                            onSelectAll={handleSelectAllStudents}
                            onRestore={handleRestoreStudents}
                            isRestoring={isRestoringStudents}
                            renderItem={(student) => (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{student.fullname}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {student.email}
                                    </p>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Warning Banner */}
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-red-500">Warning</p>
                        <p className="text-sm text-muted-foreground">
                            The actions below are permanent and cannot be undone. All associated data including
                            attendance records, submissions, and other related information will be permanently removed.
                        </p>
                    </div>
                </div>
            </div>

            {/* Permanent Deletion Actions */}
            <div className="rounded-lg border border-red-500/20 overflow-hidden">
                <div className="bg-red-500/5 px-4 py-3 border-b border-red-500/20">
                    <h4 className="text-sm font-medium text-red-500">Permanent Deletion</h4>
                </div>
                <div className="px-4 divide-y divide-border">
                    <DangerAction
                        title="Purge Deleted Batches"
                        description={`Permanently remove all soft-deleted batches${draftBatches.length > 0 ? ` (${draftBatches.length} in trash)` : ''} and their associated students, attendance records, and materials.`}
                        buttonText="Purge Batches"
                        onClick={() => setPurgeBatchesOpen(true)}
                        disabled={draftBatches.length === 0}
                    />
                    <DangerAction
                        title="Purge Deleted Students"
                        description={`Permanently remove all soft-deleted students${deletedStudents.length > 0 ? ` (${deletedStudents.length} in trash)` : ''} and their attendance records from the database.`}
                        buttonText="Purge Students"
                        onClick={() => setPurgeStudentsOpen(true)}
                        disabled={deletedStudents.length === 0}
                    />
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <ConfirmDialog
                open={purgeBatchesOpen}
                onOpenChange={setPurgeBatchesOpen}
                title="Purge Deleted Batches"
                description="This will permanently delete all batches in the trash along with their students, attendance records, videos, notes, and other associated data."
                confirmText="delete all batches"
                onConfirm={handlePurgeBatches}
                isLoading={isPurgingBatches}
            />

            <ConfirmDialog
                open={purgeStudentsOpen}
                onOpenChange={setPurgeStudentsOpen}
                title="Purge Deleted Students"
                description="This will permanently delete all soft-deleted students along with their attendance records and submissions."
                confirmText="delete all students"
                onConfirm={handlePurgeStudents}
                isLoading={isPurgingStudents}
            />
        </div>
    )
}
