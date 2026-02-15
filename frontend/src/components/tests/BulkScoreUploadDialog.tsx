"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { useUploadScoresBulkMutation } from "@/redux/slices/tests/testsApi"
import { toast } from "sonner"

interface BulkScoreUploadDialogProps {
    testId: number;
}

export function BulkScoreUploadDialog({ testId }: BulkScoreUploadDialogProps) {
    const [open, setOpen] = useState(false)
    const [uploadBulk, { isLoading }] = useUploadScoresBulkMutation()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState("")

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        setFileName(file?.name || "")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const file = fileInputRef.current?.files?.[0]
        if (!file) {
            toast.error("Please select a CSV file")
            return
        }

        const formData = new FormData()
        formData.append("file", file)

        try {
            const result = await uploadBulk({ testId, formData }).unwrap()
            const data = result.data!
            toast.success(`${data.uploaded} scores uploaded, ${data.absent} absent, ${data.failed} failed`)
            setOpen(false)
            setFileName("")
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to upload scores")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1.5">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Bulk Upload</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Bulk Score Upload</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Upload a CSV file with columns: studentId, marksObtained, remarks
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4">
                        <div className="space-y-1.5">
                            <Label className="text-[13px] font-medium">
                                CSV File <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="h-9 text-[13px]"
                                required
                            />
                            {fileName && (
                                <p className="text-[11px] text-muted-foreground">Selected: {fileName}</p>
                            )}
                        </div>

                        <div className="bg-muted/30 rounded-md p-3 border border-border/60">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">CSV Format</p>
                            <code className="text-[11px] text-foreground/70 block">
                                studentId,marksObtained,remarks<br />
                                12,78.5,Good work<br />
                                13,92.0,Excellent<br />
                                14,0,ABSENT
                            </code>
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="h-8 text-[13px]">
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[120px]">
                            {isLoading ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Uploading...</>
                            ) : (
                                "Upload CSV"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
