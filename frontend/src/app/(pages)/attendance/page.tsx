"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AttendanceMarker } from "@/components/attendance/AttendanceMarker"
import { AttendanceReport } from "@/components/attendance/AttendanceReport"
import { QRCodeGenerator } from "@/components/attendance/QRCodeGenerator"
import { QRCodeScanner } from "@/components/attendance/QRCodeScanner"
import { AttendanceHistory } from "@/components/attendance/AttendanceHistory"
import { useSelector } from "react-redux"
import { RootState } from "@/redux/store"
import { useGetMyStudentProfileQuery } from "@/redux/slices/students/studentsApi"
import { Loader2, AlertCircle } from "lucide-react"

export default function AttendancePage() {
    const { user } = useSelector((state: RootState) => state.auth)
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'TEACHER'
    const isStudent = user?.role === 'STUDENT'

    // Fetch student profile for STUDENT users to get their correct studentId
    const {
        data: studentProfile,
        isLoading: isLoadingProfile,
        error: profileError
    } = useGetMyStudentProfileQuery(undefined, {
        skip: !isStudent, // Only fetch for student users
    })

    // Get the correct studentId for QR scanning
    const studentIdForQR = studentProfile?.id

    return (
        <div className="space-y-10 py-8 px-6 max-w-[1400px] mx-auto animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 border-b border-border/40 pb-10">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter">
                        Attendance
                    </h1>
                    <p className="text-muted-vercel mt-2">Mark and monitor participation across all academic modules.</p>
                </div>
                <div className="flex gap-2">
                    {isAdmin ? (
                        <QRCodeGenerator />
                    ) : isStudent ? (
                        isLoadingProfile ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Loading profile...</span>
                            </div>
                        ) : profileError ? (
                            <div className="flex items-center gap-2 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">No student profile found</span>
                            </div>
                        ) : studentIdForQR ? (
                            <QRCodeScanner studentId={studentIdForQR} />
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Student profile not linked</span>
                            </div>
                        )
                    ) : null}
                </div>
            </div>

            <Tabs defaultValue={isAdmin ? "mark" : "history"} className="space-y-8">
                <TabsList className="bg-transparent border-b border-border/40 w-full justify-start rounded-none h-auto p-0 gap-8">
                    {isAdmin && (
                        <TabsTrigger 
                            value="mark" 
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Registry
                        </TabsTrigger>
                    )}
                    <TabsTrigger 
                        value="history" 
                        className="bg-transparent border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Archives
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger 
                            value="report" 
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Analytics
                        </TabsTrigger>
                    )}
                    {isAdmin && (
                        <TabsTrigger 
                            value="qr" 
                            className="bg-transparent border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none px-0 py-3 text-xs font-black uppercase tracking-widest transition-all"
                        >
                            Secure QR
                        </TabsTrigger>
                    )}
                </TabsList>

                {isAdmin && (
                    <TabsContent value="mark" className="animate-fade-in focus-visible:outline-none">
                        <div className="card-vercel !px-0 !py-0 border-border/40 overflow-hidden">
                            <div className="px-8 py-6 border-b border-border/40">
                                <h3 className="text-sm font-black uppercase tracking-widest">Active Manifest</h3>
                                <p className="text-[10px] text-muted-foreground mt-1 font-medium">Verify student presence for the current academic session.</p>
                            </div>
                            <div className="p-8">
                                <AttendanceMarker />
                            </div>
                        </div>
                    </TabsContent>
                )}

                <TabsContent value="history" className="animate-fade-in focus-visible:outline-none">
                    <div className="card-vercel !px-0 !py-0 border-border/40 overflow-hidden">
                        <div className="px-8 py-6 border-b border-border/40">
                            <h3 className="text-sm font-black uppercase tracking-widest">Attendance Archives</h3>
                            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Review historical participation logs and session data.</p>
                        </div>
                        <div className="p-8">
                            <AttendanceHistory />
                        </div>
                    </div>
                </TabsContent>

                {isAdmin && (
                    <TabsContent value="report" className="animate-fade-in focus-visible:outline-none">
                        <AttendanceReport />
                    </TabsContent>
                )}

                {isAdmin && (
                    <TabsContent value="qr" className="animate-fade-in focus-visible:outline-none">
                        <div className="card-vercel border-border/40 overflow-hidden">
                            <div className="max-w-2xl">
                                <h3 className="text-sm font-black uppercase tracking-widest">QR Authentication</h3>
                                <p className="text-[11px] text-muted-foreground mt-4 font-medium leading-relaxed">
                                    Initialize a secure session token for student-side verification. 
                                    These credentials are unique per batch and automatically expire upon session termination.
                                </p>
                                <div className="mt-8 border-t border-border/40 pt-8">
                                    <QRCodeGenerator />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    )
}