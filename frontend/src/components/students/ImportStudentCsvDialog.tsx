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
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Upload, Loader2, FileText, Download, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"
import { usePreviewCSVMutation, useImportCSVMutation, useLazyDownloadCSVTemplateQuery } from "@/redux/slices/students/studentsApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { CSVPreviewData, Batch } from "@/types"
import { toast } from "sonner"

type Step = "upload" | "preview" | "result"

interface ImportResult {
    total: number
    successful: number
    failed: number
    errors: { row: number; email?: string; error: string }[]
}

export function ImportStudentCsvDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<Step>("upload")
    const [file, setFile] = useState<File | null>(null)
    const [batchId, setBatchId] = useState("")
    const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []

    const [previewCSV, { isLoading: isPreviewing }] = usePreviewCSVMutation()
    const [importCSV, { isLoading: isImporting }] = useImportCSVMutation()
    const [downloadTemplate] = useLazyDownloadCSVTemplateQuery()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setPreviewData(null)
        }
    }

    const handleDownloadTemplate = async () => {
        try {
            const result = await downloadTemplate().unwrap()
            const blob = new Blob([result], { type: "text/csv" })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "student_import_template.csv"
            a.click()
            window.URL.revokeObjectURL(url)
            toast.success("Template downloaded")
        } catch (error) {
            toast.error("Failed to download template")
        }
    }

    const handlePreview = async () => {
        if (!file || !batchId) {
            toast.error("Please select a CSV file and batch")
            return
        }

        const data = new FormData()
        data.append("file", file)
        data.append("batchId", batchId)

        try {
            const result = await previewCSV(data).unwrap()
            setPreviewData(result)
            setStep("preview")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to preview CSV")
        }
    }

    const handleImport = async () => {
        if (!file || !batchId) {
            toast.error("Please select a CSV file and batch")
            return
        }

        const data = new FormData()
        data.append("file", file)
        data.append("batchId", batchId)

        try {
            const result = await importCSV(data).unwrap()
            setImportResult(result)
            setStep("result")
            if (result.successful > 0) {
                toast.success(`Imported ${result.successful} of ${result.total} students`)
            }
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to import CSV")
        }
    }

    const handleReset = () => {
        setStep("upload")
        setFile(null)
        setBatchId("")
        setPreviewData(null)
        setImportResult(null)
    }

    const handleClose = () => {
        setOpen(false)
        setTimeout(handleReset, 300)
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen)
            if (!isOpen) handleReset()
        }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Import CSV
                </Button>
            </DialogTrigger>
            <DialogContent className={step === "upload" ? "sm:max-w-[500px]" : "sm:max-w-[700px]"}>
                <DialogHeader>
                    <DialogTitle>
                        {step === "upload" && "Import Students via CSV"}
                        {step === "preview" && "Preview Import Data"}
                        {step === "result" && "Import Results"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "upload" && "Upload a CSV file to enroll multiple students at once."}
                        {step === "preview" && "Review the data before importing."}
                        {step === "result" && "Summary of the import operation."}
                    </DialogDescription>
                </DialogHeader>

                {step === "upload" && (
                    <div className="grid gap-4 py-4">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                                <Download className="mr-2 h-4 w-4" />
                                Download Template
                            </Button>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="batchId">Select Batch *</Label>
                            <select
                                id="batchId"
                                className="w-full input-industrial rounded-md text-sm"
                                value={batchId}
                                onChange={(e) => setBatchId(e.target.value)}
                                required
                            >
                                <option value="">Select a batch...</option>
                                {batches.map((batch: Batch) => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">CSV File *</Label>
                            <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors" onClick={() => document.getElementById("csv-file-input")?.click()}>
                                <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                {file ? (
                                    <p className="text-sm font-medium">{file.name}</p>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                                        <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
                                    </>
                                )}
                                <Input
                                    id="csv-file-input"
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <p>Required columns: firstname, lastname, email, dob</p>
                            <p>Optional columns: middlename, address</p>
                        </div>
                    </div>
                )}

                {step === "preview" && previewData && (
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground">Total Rows</p>
                                <p className="text-2xl font-bold">{previewData.totalRows}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                <p className="text-sm text-green-600">Valid</p>
                                <p className="text-2xl font-bold text-green-600">{previewData.validRows}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                <p className="text-sm text-red-600">Invalid</p>
                                <p className="text-2xl font-bold text-red-600">{previewData.invalidRows}</p>
                            </div>
                        </div>

                        {/* Preview Table */}
                        {previewData.preview.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2">Preview (first 10 rows)</h4>
                                <div className="rounded-md border overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>First Name</TableHead>
                                                <TableHead>Last Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>DOB</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.preview.slice(0, 10).map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{row.firstname}</TableCell>
                                                    <TableCell>{row.lastname}</TableCell>
                                                    <TableCell>{row.email}</TableCell>
                                                    <TableCell>{row.dob}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}

                        {/* Errors */}
                        {previewData.errors.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-red-600 flex items-center">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Errors ({previewData.errors.length})
                                </h4>
                                <div className="rounded-md border border-red-200 overflow-auto max-h-40">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Row</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {previewData.errors.map((error, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{error.row}</TableCell>
                                                    <TableCell>{error.email || "-"}</TableCell>
                                                    <TableCell className="text-red-600">{error.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === "result" && importResult && (
                    <div className="grid gap-4 py-4">
                        {/* Result Summary */}
                        <div className="flex flex-col items-center py-4">
                            {importResult.successful > 0 ? (
                                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                            ) : (
                                <XCircle className="h-16 w-16 text-red-500 mb-4" />
                            )}
                            <h3 className="text-xl font-semibold">
                                {importResult.successful} of {importResult.total} students imported
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-center">
                                <p className="text-sm text-green-600">Successful</p>
                                <p className="text-2xl font-bold text-green-600">{importResult.successful}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-center">
                                <p className="text-sm text-red-600">Failed</p>
                                <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                            </div>
                        </div>

                        {/* Errors */}
                        {importResult.errors.length > 0 && (
                            <div>
                                <h4 className="font-medium mb-2 text-red-600 flex items-center">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Import Errors
                                </h4>
                                <div className="rounded-md border border-red-200 overflow-auto max-h-40">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-16">Row</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {importResult.errors.map((error, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{error.row}</TableCell>
                                                    <TableCell>{error.email || "-"}</TableCell>
                                                    <TableCell className="text-red-600">{error.error}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <DialogFooter>
                    {step === "upload" && (
                        <>
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button onClick={handlePreview} disabled={isPreviewing || !file || !batchId}>
                                {isPreviewing ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Previewing...</>
                                ) : (
                                    "Preview"
                                )}
                            </Button>
                        </>
                    )}
                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
                            <Button onClick={handleImport} disabled={isImporting || previewData?.validRows === 0}>
                                {isImporting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing...</>
                                ) : (
                                    `Import ${previewData?.validRows || 0} Students`
                                )}
                            </Button>
                        </>
                    )}
                    {step === "result" && (
                        <Button onClick={handleClose}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
