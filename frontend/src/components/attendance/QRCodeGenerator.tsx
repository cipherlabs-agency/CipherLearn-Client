"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { QrCode, Loader2, RefreshCw, Download, Share2, CheckCircle, Clock, Calendar } from "lucide-react"
import { useLazyGenerateQRCodeQuery } from "@/redux/slices/attendance/attendanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import type { Batch } from "@/types"
import { toast } from "sonner"

interface QRCodeGeneratorProps {
    selectedBatchId?: number
}

export function QRCodeGenerator({ selectedBatchId }: QRCodeGeneratorProps) {
    const [open, setOpen] = useState(false)
    const [batchId, setBatchId] = useState<number | undefined>(selectedBatchId)

    const { data: batchesData } = useGetAllBatchesQuery()
    const batches = batchesData || []
    const [generateQR, { data: qrData, isLoading, isFetching }] = useLazyGenerateQRCodeQuery()

    const handleGenerate = async () => {
        if (!batchId) {
            toast.error("Please select a batch")
            return
        }

        try {
            await generateQR(batchId).unwrap()
            toast.success("QR code generated successfully")
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to generate QR code")
        }
    }

    const handleDownload = () => {
        if (!qrData?.qrImageBase64) return

        // Create a temporary link element to download the image
        const link = document.createElement("a")
        link.download = `attendance-qr-${qrData.batchName.replace(/\s+/g, "-")}-${qrData.validFor}.png`
        link.href = qrData.qrImageBase64
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success("QR code downloaded successfully")
    }

    const handleShare = async () => {
        if (!qrData?.qrImageBase64) return

        try {
            // Convert base64 to blob for sharing
            const response = await fetch(qrData.qrImageBase64)
            const blob = await response.blob()
            const file = new File([blob], `attendance-qr-${qrData.batchName}-${qrData.validFor}.png`, {
                type: "image/png",
            })

            // Check if Web Share API is available and supports file sharing
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Attendance QR - ${qrData.batchName}`,
                    text: `Scan this QR code to mark your attendance for ${qrData.batchName}. Valid for: ${qrData.validFor}`,
                    files: [file],
                })
                toast.success("QR code shared successfully")
            } else if (navigator.share) {
                // Fallback: Share without file (just text)
                await navigator.share({
                    title: `Attendance QR - ${qrData.batchName}`,
                    text: `Attendance QR code for ${qrData.batchName}. Valid for: ${qrData.validFor}. Please ask your instructor to display the QR code.`,
                })
                toast.success("Share link sent")
            } else {
                // Fallback: Copy QR data to clipboard
                await navigator.clipboard.writeText(
                    `Attendance QR for ${qrData.batchName} - Valid: ${qrData.validFor}`
                )
                toast.info("Share not supported. Information copied to clipboard.")
            }
        } catch (error: any) {
            if (error.name !== "AbortError") {
                toast.error("Failed to share QR code")
            }
        }
    }

    const formatExpiryTime = (expiresAt: string) => {
        const expiry = new Date(expiresAt)
        return expiry.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold">
                    <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-background border-border">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold tracking-tight">
                        Attendance QR Code
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Generate a scannable QR code for students to mark their attendance.
                        Each QR code is valid for the current day only.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Batch Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">
                            Select Batch
                        </label>
                        <select
                            className="flex h-11 w-full rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
                            value={batchId || ""}
                            onChange={(e) => setBatchId(Number(e.target.value))}
                        >
                            <option value="" className="text-muted-foreground">
                                Select a batch...
                            </option>
                            {batches.map((batch: Batch) => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!batchId || isLoading || isFetching}
                        className="w-full h-11 font-semibold bg-foreground text-background hover:bg-foreground/90"
                    >
                        {isLoading || isFetching ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate QR Code
                            </>
                        )}
                    </Button>

                    {/* QR Code Display */}
                    {qrData && qrData.qrImageBase64 && (
                        <Card className="mt-4 border-border bg-card overflow-hidden">
                            <CardHeader className="pb-3 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold text-foreground">
                                            {qrData.batchName}
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-1.5 text-xs">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {qrData.validFor}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Expires: {formatExpiryTime(qrData.expiresAt)}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    {qrData.isExisting && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                            <CheckCircle className="h-3 w-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center py-6">
                                {/* QR Code Image */}
                                <div className="bg-white p-4 rounded-lg shadow-sm border">
                                    <img
                                        src={qrData.qrImageBase64}
                                        alt={`Attendance QR Code for ${qrData.batchName}`}
                                        className="w-56 h-56 object-contain"
                                        draggable={false}
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 mt-5 w-full max-w-xs">
                                    <Button
                                        variant="outline"
                                        className="flex-1 font-medium border-border hover:bg-muted"
                                        onClick={handleDownload}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1 font-medium border-border hover:bg-muted"
                                        onClick={handleShare}
                                    >
                                        <Share2 className="mr-2 h-4 w-4" />
                                        Share
                                    </Button>
                                </div>

                                {/* Instructions */}
                                <p className="text-xs text-muted-foreground text-center mt-4 max-w-[280px] leading-relaxed">
                                    Students must physically scan this QR code to mark their attendance.
                                    Each student can only mark attendance once per day.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
