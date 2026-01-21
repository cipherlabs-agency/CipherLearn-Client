"use client"

import { useState } from "react"
import { Eye, Edit, Printer, Download } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { StatusBadge } from "@/components/ui/status-dot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useUpdateFeeReceiptMutation } from "@/redux/slices/fees/feesApi"
import type { FeeReceipt, PaymentMode, PaymentStatus, UpdateFeeReceiptInput } from "@/types"

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "UPI", label: "UPI" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "CHEQUE", label: "Cheque" },
    { value: "ONLINE", label: "Online" },
]

const STATUS_VARIANT: Record<PaymentStatus, "paid" | "partial" | "pending" | "overdue"> = {
    PAID: "paid",
    PARTIAL: "partial",
    PENDING: "pending",
    OVERDUE: "overdue",
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
    PAID: "Paid",
    PARTIAL: "Partial",
    PENDING: "Pending",
    OVERDUE: "Overdue",
}

interface ReceiptDetailDialogProps {
    receipt: FeeReceipt
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: ReceiptDetailDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isDownloading, setIsDownloading] = useState(false)
    const [paidAmount, setPaidAmount] = useState(receipt.paidAmount.toString())
    const [discountAmount, setDiscountAmount] = useState(receipt.discountAmount?.toString() || "0")
    const [paymentMode, setPaymentMode] = useState<PaymentMode>(receipt.paymentMode || "CASH")
    const [transactionId, setTransactionId] = useState(receipt.transactionId || "")
    const [chequeNumber, setChequeNumber] = useState(receipt.chequeNumber || "")
    const [bankName, setBankName] = useState(receipt.bankName || "")
    const [paymentDate, setPaymentDate] = useState(
        receipt.paymentDate ? new Date(receipt.paymentDate).toISOString().split('T')[0] : ""
    )
    const [paymentNotes, setPaymentNotes] = useState(receipt.paymentNotes || "")

    const [updateReceipt, { isLoading }] = useUpdateFeeReceiptMutation()

    const handleDownloadPDF = async () => {
        setIsDownloading(true)
        try {
            const token = localStorage.getItem('token')
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/dashboard/fees/receipts/${receipt.id}/pdf`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            if (!response.ok) {
                throw new Error('Failed to download PDF')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Receipt-${receipt.receiptNumber}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Failed to download PDF:', error)
        } finally {
            setIsDownloading(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const getMonthName = (month: number) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December']
        return months[month - 1]
    }

    const handleSave = async () => {
        const input: UpdateFeeReceiptInput = {
            paidAmount: Number(paidAmount),
            discountAmount: Number(discountAmount),
            paymentMode,
            transactionId: transactionId || undefined,
            chequeNumber: chequeNumber || undefined,
            bankName: bankName || undefined,
            paymentDate: paymentDate || undefined,
            paymentNotes: paymentNotes || undefined,
        }

        try {
            await updateReceipt({ id: receipt.id, data: input }).unwrap()
            setIsEditing(false)
        } catch (error) {
            console.error("Failed to update receipt:", error)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const statusVariant = STATUS_VARIANT[receipt.status]
    const statusLabel = STATUS_LABEL[receipt.status]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-bold">
                                Receipt #{receipt.receiptNumber}
                            </DialogTitle>
                            <DialogDescription>
                                {getMonthName(receipt.academicMonth)} {receipt.academicYear}
                            </DialogDescription>
                        </div>
                        <StatusBadge variant={statusVariant} pulse={receipt.status === "OVERDUE"}>
                            {statusLabel}
                        </StatusBadge>
                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Student & Batch Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <p className="text-xs text-muted-foreground">Student</p>
                            <p className="font-medium">{receipt.student?.fullname || "Unknown Student"}</p>
                            <p className="text-sm text-muted-foreground">{receipt.student?.email || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Batch</p>
                            <p className="font-medium">{receipt.batch?.name || "No Batch"}</p>
                        </div>
                    </div>

                    {/* Amount Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Amount Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border rounded-lg">
                                <p className="text-xs text-muted-foreground">Total Amount</p>
                                <p className="text-lg font-bold">{formatCurrency(receipt.totalAmount)}</p>
                            </div>
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Label>Paid Amount</Label>
                                    <Input
                                        type="number"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            ) : (
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Paid Amount</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(receipt.paidAmount)}</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <Label>Discount</Label>
                                    <Input
                                        type="number"
                                        value={discountAmount}
                                        onChange={(e) => setDiscountAmount(e.target.value)}
                                        min="0"
                                    />
                                </div>
                            ) : (
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Discount</p>
                                    <p className="font-medium">{formatCurrency(receipt.discountAmount || 0)}</p>
                                </div>
                            )}
                            <div className="p-3 border rounded-lg">
                                <p className="text-xs text-muted-foreground">Late Fee</p>
                                <p className="font-medium">{formatCurrency(receipt.lateFeeAmount || 0)}</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-primary/5">
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <p className="font-medium text-primary">{formatCurrency(receipt.remainingAmount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium">Payment Details</h4>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Payment Mode</Label>
                                        <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as PaymentMode)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_MODES.map((mode) => (
                                                    <SelectItem key={mode.value} value={mode.value}>
                                                        {mode.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Payment Date</Label>
                                        <Input
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {paymentMode === "CHEQUE" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Cheque Number</Label>
                                            <Input
                                                value={chequeNumber}
                                                onChange={(e) => setChequeNumber(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Bank Name</Label>
                                            <Input
                                                value={bankName}
                                                onChange={(e) => setBankName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                {(paymentMode === "UPI" || paymentMode === "BANK_TRANSFER" || paymentMode === "ONLINE") && (
                                    <div className="space-y-2">
                                        <Label>Transaction ID</Label>
                                        <Input
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Notes</Label>
                                    <Textarea
                                        value={paymentNotes}
                                        onChange={(e) => setPaymentNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Payment Mode</p>
                                    <p className="font-medium">
                                        {PAYMENT_MODES.find(m => m.value === receipt.paymentMode)?.label || "-"}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-lg">
                                    <p className="text-xs text-muted-foreground">Payment Date</p>
                                    <p className="font-medium">
                                        {receipt.paymentDate ? formatDate(receipt.paymentDate) : "-"}
                                    </p>
                                </div>
                                {receipt.transactionId && (
                                    <div className="p-3 border rounded-lg col-span-2">
                                        <p className="text-xs text-muted-foreground">Transaction ID</p>
                                        <p className="font-mono text-sm">{receipt.transactionId}</p>
                                    </div>
                                )}
                                {receipt.chequeNumber && (
                                    <>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Cheque Number</p>
                                            <p className="font-mono text-sm">{receipt.chequeNumber}</p>
                                        </div>
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-xs text-muted-foreground">Bank Name</p>
                                            <p className="font-medium">{receipt.bankName || "-"}</p>
                                        </div>
                                    </>
                                )}
                                {receipt.paymentNotes && (
                                    <div className="p-3 border rounded-lg col-span-2">
                                        <p className="text-xs text-muted-foreground">Notes</p>
                                        <p className="text-sm">{receipt.paymentNotes}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Due Date</p>
                            <p className="font-medium">{formatDate(receipt.dueDate)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Generated By</p>
                            <p className="font-medium">{receipt.generatedBy || "-"}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    {isEditing ? (
                        <>
                            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={handleDownloadPDF} disabled={isDownloading}>
                                {isDownloading ? (
                                    <>
                                        <Spinner size="sm" className="mr-2" />
                                        Downloading...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download PDF
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
