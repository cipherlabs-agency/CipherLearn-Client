"use client"

import { useState } from "react"
import { Trash2, Edit, FileText, Download, ExternalLink, FolderOpen, User, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    useGetStudyMaterialsQuery,
    useDeleteStudyMaterialMutation,
    StudyMaterial,
} from "@/redux/slices/studyMaterials/studyMaterialsApi"
import { EditStudyMaterialDialog } from "./EditStudyMaterialDialog"

interface StudyMaterialsListProps {
    batchId?: number
    category?: string
    isAdmin: boolean
}

const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') return <FileText className="w-5 h-5 text-red-500" />
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />
    if (['ppt', 'pptx'].includes(ext || '')) return <FileText className="w-5 h-5 text-orange-500" />
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileText className="w-5 h-5 text-green-500" />
    return <FileText className="w-5 h-5 text-gray-500" />
}

const getFileName = (filepath: string) => {
    return filepath.split('/').pop() || filepath
}

export function StudyMaterialsList({ batchId, category, isAdmin }: StudyMaterialsListProps) {
    const [page, setPage] = useState(1)
    const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null)

    const { data, isLoading, error } = useGetStudyMaterialsQuery({
        page,
        limit: 10,
        batchId,
        category,
    })

    const [deleteMaterial, { isLoading: isDeleting }] = useDeleteStudyMaterialMutation()

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this study material?")) {
            try {
                await deleteMaterial(id).unwrap()
            } catch (err) {
                console.error("Failed to delete study material:", err)
            }
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getFileUrl = (filepath: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || ''
        return `${baseUrl}${filepath}`
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-500">
                Failed to load study materials
            </div>
        )
    }

    const materials = data?.data || []
    const pagination = data?.pagination

    if (materials.length === 0) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No study materials found</p>
                <p className="text-sm">Study materials will appear here when uploaded.</p>
            </div>
        )
    }

    return (
        <div>
            <div className="divide-y divide-border/40">
                {materials.map((material) => (
                    <div key={material.id} className="p-6 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                            <div className="flex-grow min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    {material.category && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                                            {material.category}
                                        </span>
                                    )}
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border/40">
                                        {material.batch.name}
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold mb-2">{material.title}</h3>
                                {material.description && (
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {material.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(material.files as string[]).map((file, index) => (
                                        <a
                                            key={index}
                                            href={getFileUrl(file)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border/40 rounded-lg text-xs font-medium hover:bg-muted transition-colors group"
                                        >
                                            {getFileIcon(file)}
                                            <span className="truncate max-w-[150px]">{getFileName(file)}</span>
                                            <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                                        </a>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(material.createdAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {material.createdBy}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <FileText className="w-3 h-3" />
                                        {(material.files as string[]).length} file(s)
                                    </span>
                                </div>
                            </div>

                            {isAdmin && (
                                <div className="flex lg:flex-col gap-2 flex-shrink-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingMaterial(material)}
                                        className="h-8 w-8 p-0"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(material.id)}
                                        disabled={isDeleting}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {editingMaterial && (
                <EditStudyMaterialDialog
                    material={editingMaterial}
                    open={!!editingMaterial}
                    onOpenChange={(open) => !open && setEditingMaterial(null)}
                />
            )}
        </div>
    )
}
