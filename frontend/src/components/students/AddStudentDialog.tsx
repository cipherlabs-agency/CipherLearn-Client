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
import { Plus } from "lucide-react"
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        } catch (error: any) {
            toast.error(error?.data?.message || "Failed to enroll student")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Student
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Enroll Student</DialogTitle>
                    <DialogDescription>
                        Enter the details of the student to enroll them in a batch.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Full Name
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="batchId" className="text-right">
                                Batch
                            </Label>
                            <select
                                id="batchId"
                                value={formData.batchId}
                                onChange={handleChange}
                                className="flex w-full input-industrial col-span-3"
                                required
                            >
                                <option value="">Select a batch</option>
                                {batches.map((batch: any) => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="firstname" className="text-right">
                                First Name
                            </Label>
                            <Input
                                id="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="lastname" className="text-right">
                                Last Name
                            </Label>
                            <Input
                                id="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="middlename" className="text-right">
                                Middle Name
                            </Label>
                            <Input
                                id="middlename"
                                value={formData.middlename}
                                onChange={handleChange}
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="dob" className="text-right">
                                DOB
                            </Label>
                            <Input
                                id="dob"
                                type="date"
                                value={formData.dob}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                                Address
                            </Label>
                            <Input
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="col-span-3"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Enrolling..." : "Enroll Student"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
