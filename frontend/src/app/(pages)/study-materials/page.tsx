"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { StudyMaterialsList } from "@/components/study-materials/StudyMaterialsList"
import { AddStudyMaterialDialog } from "@/components/study-materials/AddStudyMaterialDialog"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useGetStudyMaterialCategoriesQuery } from "@/redux/slices/studyMaterials/studyMaterialsApi"

export default function StudyMaterialsPage() {
    const [selectedBatchId, setSelectedBatchId] = useState<number | undefined>(undefined)
    const [selectedCategory, setSelectedCategory] = useState<string>("")

    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === "ADMIN" || user?.role === "TEACHER"

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const { data: categoriesData } = useGetStudyMaterialCategoriesQuery()
    const categories = categoriesData?.data || []

    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Study Materials
                    </h1>
                    <p className="text-muted-vercel mt-2">PDFs, documents, and resources organized by batch and category.</p>
                </div>
                {isAdmin && <AddStudyMaterialDialog />}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        Batch Filter
                    </label>
                    <div className="relative group">
                        <select
                            className="h-10 w-full sm:w-56 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer"
                            value={selectedBatchId || ""}
                            onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : undefined)}
                        >
                            <option value="" className="bg-background text-foreground lowercase">All batches</option>
                            {batches.map((batch) => (
                                <option key={batch.id} value={batch.id} className="bg-background text-foreground lowercase">
                                    {batch.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        Category Filter
                    </label>
                    <div className="relative group">
                        <select
                            className="h-10 w-full sm:w-56 bg-muted/30 border border-border/50 rounded-md px-3 text-xs font-black uppercase tracking-wider focus:bg-background focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 transition-all outline-none appearance-none cursor-pointer"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="" className="bg-background text-foreground lowercase">All categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category} className="bg-background text-foreground lowercase">
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="card-vercel !px-0 !py-0 border-border/40 overflow-hidden">
                <StudyMaterialsList
                    batchId={selectedBatchId}
                    category={selectedCategory || undefined}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    )
}
