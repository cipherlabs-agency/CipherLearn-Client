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
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import { useEnrollStudentMutation } from "@/redux/slices/students/studentsApi"
import { useGetBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { toast } from "sonner"

export function AddStudentDialog() {
    const [open, setOpen] = useState(false)
    const [enrollStudent, { isLoading }] = useEnrollStudentMutation()
    const { data: batchesData } = useGetBatchesQuery()
    const batches = batchesData || []

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        batchId: "",
        firstname: "",
        lastname: "",
        middlename: "",
        dob: "",
        address: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await enrollStudent({
                ...formData,
                batchId: Number(formData.batchId)
            }).unwrap()
            toast.success("Student enrolled successfully")
            setOpen(false)
            setFormData({
                name: "",
                email: "",
                batchId: "",
                firstname: "",
                lastname: "",
                middlename: "",
                dob: "",
                address: ""
            })
        } catch (error: unknown) {
            const err = error as { data?: { message?: string } }
            toast.error(err?.data?.message || "Failed to enroll student")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Student</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogTitle className="text-base font-semibold">Enroll Student</DialogTitle>
                    <DialogDescription className="text-[13px] text-muted-foreground mt-1">
                        Enter student details to enroll them in a batch.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                        {/* Batch Selection */}
                        <div className="space-y-1.5">
                            <Label htmlFor="batchId" className="text-[13px] font-medium">
                                Batch <span className="text-destructive">*</span>
                            </Label>
                            <select
                                id="batchId"
                                value={formData.batchId}
                                onChange={handleChange}
                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                            >
                                <option value="">Select a batch</option>
                                {batches.map((batch) => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Name Fields Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label htmlFor="firstname" className="text-[13px] font-medium">
                                    First Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="firstname"
                                    value={formData.firstname}
                                    onChange={handleChange}
                                    placeholder="John"
                                    className="h-9 text-[13px]"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="middlename" className="text-[13px] font-medium">
                                    Middle
                                </Label>
                                <Input
                                    id="middlename"
                                    value={formData.middlename}
                                    onChange={handleChange}
                                    placeholder="Robert"
                                    className="h-9 text-[13px]"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="lastname" className="text-[13px] font-medium">
                                    Last Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="lastname"
                                    value={formData.lastname}
                                    onChange={handleChange}
                                    placeholder="Doe"
                                    className="h-9 text-[13px]"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[13px] font-medium">
                                Email <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="john.doe@example.com"
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-1.5">
                            <Label htmlFor="dob" className="text-[13px] font-medium">
                                Date of Birth <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                className="h-9 text-[13px]"
                                required
                            />
                        </div>

                        {/* Address */}
                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-[13px] font-medium">
                                Address <span className="text-destructive">*</span>
                            </Label>
                            <textarea
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="123 Main Street, City, State 12345"
                                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter className="px-6 py-4 border-t border-border bg-muted/30">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                            className="h-8 text-[13px]"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" size="sm" disabled={isLoading} className="h-8 text-[13px] min-w-[100px]">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                                    Enrolling...
                                </>
                            ) : (
                                "Enroll Student"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
