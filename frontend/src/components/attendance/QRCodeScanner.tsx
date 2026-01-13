"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Camera, Loader2, CheckCircle, XCircle, ScanLine } from "lucide-react"
import { useMarkQRAttendanceMutation } from "@/redux/slices/attendance/attendanceApi"
import { toast } from "sonner"
import { Html5Qrcode } from "html5-qrcode"

interface QRCodeScannerProps {
    studentId: number
}

export function QRCodeScanner({ studentId }: QRCodeScannerProps) {
    const [open, setOpen] = useState(false)
    const [qrData, setQrData] = useState("")
    const [scanning, setScanning] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const scannerContainerId = "qr-scanner-container"

    const [markAttendance, { isLoading }] = useMarkQRAttendanceMutation()

    const stopScanning = useCallback(async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop()
                scannerRef.current.clear()
            } catch (error) {
                console.error("Error stopping scanner:", error)
            }
            scannerRef.current = null
        }
        setScanning(false)
    }, [])

    // Cleanup scanner when dialog closes
    useEffect(() => {
        if (!open) {
            stopScanning()
            setResult(null)
            setQrData("")
        }
    }, [open, stopScanning])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopScanning()
        }
    }, [stopScanning])

    const handleQRCodeScanned = async (decodedText: string) => {
        // Stop scanning immediately after successful scan
        await stopScanning()
        setQrData(decodedText)

        try {
            const response = await markAttendance({
                studentId,
                qrData: decodedText
            }).unwrap()

            setResult({
                success: true,
                message: response.message || "Attendance marked successfully!"
            })
            toast.success("Attendance marked successfully!")
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to mark attendance"
            setResult({
                success: false,
                message: errorMessage
            })
            toast.error(errorMessage)
        }
    }

    const startScanning = async () => {
        try {
            // Create new scanner instance
            scannerRef.current = new Html5Qrcode(scannerContainerId)

            await scannerRef.current.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    handleQRCodeScanned(decodedText)
                },
                () => {
                    // Ignore scan errors (no QR code in view)
                }
            )

            setScanning(true)
        } catch (error: any) {
            console.error("Failed to start scanner:", error)
            if (error.toString().includes("NotAllowedError")) {
                toast.error("Camera permission denied. Please allow camera access.")
            } else if (error.toString().includes("NotFoundError")) {
                toast.error("No camera found. Please connect a camera.")
            } else {
                toast.error("Failed to access camera. Please check permissions.")
            }
        }
    }

    const handleManualSubmit = async () => {
        if (!qrData.trim()) {
            toast.error("Please enter or scan a QR code")
            return
        }

        try {
            const response = await markAttendance({
                studentId,
                qrData: qrData.trim()
            }).unwrap()

            setResult({
                success: true,
                message: response.message || "Attendance marked successfully!"
            })
            toast.success("Attendance marked successfully!")
        } catch (error: any) {
            const errorMessage = error?.data?.message || "Failed to mark attendance"
            setResult({
                success: false,
                message: errorMessage
            })
            toast.error(errorMessage)
        }
    }

    const handleReset = () => {
        setQrData("")
        setResult(null)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <ScanLine className="mr-2 h-4 w-4" /> Scan QR Code
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Scan Attendance QR Code</DialogTitle>
                    <DialogDescription>
                        Scan the QR code displayed by your teacher to mark your attendance.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {result ? (
                        <Card className={result.success ? "border-green-500" : "border-red-500"}>
                            <CardContent className="flex flex-col items-center py-8 space-y-4">
                                {result.success ? (
                                    <CheckCircle className="h-16 w-16 text-green-500" />
                                ) : (
                                    <XCircle className="h-16 w-16 text-red-500" />
                                )}
                                <p className={`text-lg font-medium text-center ${result.success ? "text-green-600" : "text-red-600"}`}>
                                    {result.message}
                                </p>
                                <Button onClick={handleReset} variant="outline">
                                    Try Again
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* QR Scanner Container */}
                            <Card>
                                <CardContent className="p-4">
                                    <div className="relative aspect-square bg-slate-900 rounded-lg overflow-hidden">
                                        <div
                                            id={scannerContainerId}
                                            className="w-full h-full"
                                        />

                                        {!scanning && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                                                <Camera className="h-12 w-12 mb-4 opacity-50" />
                                                <p className="text-sm opacity-75">Camera not active</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-2 mt-4">
                                        {!scanning ? (
                                            <Button onClick={startScanning} className="flex-1">
                                                <Camera className="mr-2 h-4 w-4" />
                                                Start Camera
                                            </Button>
                                        ) : (
                                            <Button onClick={stopScanning} variant="destructive" className="flex-1">
                                                Stop Camera
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Manual Input */}
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground text-center">
                                    Or enter the QR code data manually:
                                </p>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Paste QR code data here..."
                                        value={qrData}
                                        onChange={(e) => setQrData(e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleManualSubmit}
                                        disabled={isLoading || !qrData.trim()}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
