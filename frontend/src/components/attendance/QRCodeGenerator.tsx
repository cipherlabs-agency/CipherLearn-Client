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
import { QrCode, Loader2, RefreshCw, Download, Copy, CheckCircle } from "lucide-react"
import { useLazyGenerateQRCodeQuery, QRCodeData } from "@/redux/slices/attendance/attendanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"
import QRCode from "qrcode"
import { useEffect, useRef } from "react"

interface QRCodeGeneratorProps {
    selectedBatchId?: number
}

export function QRCodeGenerator({ selectedBatchId }: QRCodeGeneratorProps) {
    const [open, setOpen] = useState(false)
    const [batchId, setBatchId] = useState<number | undefined>(selectedBatchId)
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const canvasRef = useRef<HTMLCanvasElement>(null)

    const { data: batches } = useGetAllBatchesQuery({})
    const [generateQR, { data: qrData, isLoading, isFetching }] = useLazyGenerateQRCodeQuery()

    useEffect(() => {
        if (qrData?.qrData && canvasRef.current) {
            generateQRImage(qrData.qrData)
        }
    }, [qrData])

    const generateQRImage = async (data: string) => {
        try {
            const url = await QRCode.toDataURL(data, {
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                }
            })
            setQrImageUrl(url)
        } catch (error) {
            console.error("Failed to generate QR image:", error)
        }
    }

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

    const handleCopyData = async () => {
        if (qrData?.qrData) {
            await navigator.clipboard.writeText(qrData.qrData)
            setCopied(true)
            toast.success("QR data copied to clipboard")
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleDownload = () => {
        if (qrImageUrl && qrData) {
            const link = document.createElement('a')
            link.download = `attendance-qr-${qrData.batchName}-${qrData.validFor}.png`
            link.href = qrImageUrl
            link.click()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700">
                    <QrCode className="mr-2 h-4 w-4" /> Generate QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Attendance QR Code</DialogTitle>
                    <DialogDescription>
                        Generate a QR code for students to scan and mark their attendance.
                        The QR code is valid for today only.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Batch</label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={batchId || ""}
                            onChange={(e) => setBatchId(Number(e.target.value))}
                        >
                            <option value="">Select a batch...</option>
                            {batches?.data?.map((batch: any) => (
                                <option key={batch.id} value={batch.id}>
                                    {batch.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={!batchId || isLoading || isFetching}
                        className="w-full"
                    >
                        {(isLoading || isFetching) ? (
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

                    {qrData && qrImageUrl && (
                        <Card className="mt-4">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{qrData.batchName}</CardTitle>
                                <CardDescription>
                                    Valid for: {qrData.validFor}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center space-y-4">
                                <div className="bg-white p-4 rounded-lg">
                                    <img
                                        src={qrImageUrl}
                                        alt="Attendance QR Code"
                                        className="w-64 h-64"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopyData}
                                    >
                                        {copied ? (
                                            <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                                        ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                        )}
                                        {copied ? "Copied!" : "Copy Data"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownload}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    Expires at: {new Date(qrData.expiresAt).toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
