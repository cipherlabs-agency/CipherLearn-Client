"use client"

import { Search, Menu, Sun, Moon, Users, BookOpen, TrendingUp, AlertCircle, QrCode, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAppSelector } from "@/redux/hooks"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { NotificationPanel } from "./NotificationPanel"
import { useGetDashboardStatsQuery } from "@/redux/slices/analytics/analyticsApi"
import { useGetReceiptsSummaryQuery } from "@/redux/slices/fees/feesApi"
import { useGetOnboardingQrQuery } from "@/redux/slices/settings/settingsApi"
import type { FeeReceiptSummary } from "@/types"
import { cn } from "@/lib/utils"

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
}

function getFormattedDate() {
    return new Date().toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
    })
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
}

// Attendance pill — green/amber/red based on percentage
function AttendancePill({ pct, loading }: { pct: number | null; loading: boolean }) {
    const color =
        pct === null || loading
            ? "text-muted-foreground bg-secondary"
            : pct >= 75
            ? "bg-emerald-600 text-white shadow-sm"
            : pct >= 50
            ? "bg-amber-500 text-white shadow-sm"
            : "bg-red-600 text-white shadow-sm"

    return (
        <div className={cn("hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-300", color)}>
            <TrendingUp className="h-3 w-3 shrink-0" />
            <span>
                {loading ? "—" : pct === null ? "—" : `${Math.round(pct)}%`}
                <span className="font-normal opacity-75 ml-0.5">today</span>
            </span>
        </div>
    )
}

// Generic stat pill
function StatPill({
    icon: Icon,
    value,
    label,
    loading,
    className,
}: {
    icon: React.ElementType
    value: string | number | null
    label: string
    loading: boolean
    className?: string
}) {
    return (
        <div
            className={cn(
                "hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold",
                "bg-slate-100 text-slate-900 border border-slate-200/50 dark:bg-secondary dark:text-muted-foreground dark:border-transparent transition-all duration-300",
                className
            )}
        >
            <Icon className="h-3 w-3 shrink-0" />
            <span>
                <span className="">{loading ? "—" : (value ?? "—")}</span>
                <span className="font-medium ml-0.5 opacity-80">{label}</span>
            </span>
        </div>
    )
}

// Pending fees warning pill
function FeesPill({ summary, loading }: { summary: FeeReceiptSummary | undefined; loading: boolean }) {
    const pending = summary ? (summary.byStatus.pending + summary.byStatus.overdue) : null
    if (!loading && (pending === null || pending === 0)) return null
    return (
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-orange-600 text-white shadow-sm transition-all duration-300">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>
                <span>{loading ? "—" : pending}</span>
                <span className="font-normal ml-0.5">dues pending</span>
            </span>
        </div>
    )
}

export function Navbar() {
    const { user } = useAppSelector((state) => state.auth)
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [qrOpen, setQrOpen] = useState(false)

    const isAdminOrTeacher = user?.role === "ADMIN" || user?.role === "TEACHER"

    // Live stats
    const { data: dashStats, isLoading: statsLoading } = useGetDashboardStatsQuery()
    const { data: feesSummary, isLoading: feesLoading } = useGetReceiptsSummaryQuery({})

    // QR — only fetch when modal is opened
    const { data: qrData, isLoading: qrLoading, isError: qrError } = useGetOnboardingQrQuery(undefined, {
        skip: !qrOpen,
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    const displayName = user?.name || "Teacher"
    const initials = getInitials(displayName)
    const todayDate = getFormattedDate()

    function handleDownloadQr() {
        if (!qrData?.qrDataUrl) return
        const link = document.createElement("a")
        link.href = qrData.qrDataUrl
        link.download = `${qrData.payload.name.replace(/\s+/g, "-").toLowerCase()}-onboarding-qr.png`
        link.click()
    }

    const attendancePct = dashStats?.todayAttendance?.percentage ?? null
    const totalStudents = dashStats?.totalStudents ?? null
    const totalBatches = dashStats?.totalBatches ?? null

    return (
        <>
        <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-sm shadow-sm">
            <div className="flex h-16 items-center px-5 gap-3">

                {/* Left: Date + Live insight pills */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Date */}
                    <span className="hidden sm:block text-xs text-muted-foreground font-medium shrink-0 mr-1">
                        {todayDate}
                    </span>

                    {/* Divider */}
                    <div className="hidden sm:block h-3.5 w-px bg-border shrink-0" />

                    {/* Attendance */}
                    <AttendancePill pct={attendancePct} loading={statsLoading} />

                    {/* Students count */}
                    <StatPill
                        icon={Users}
                        value={totalStudents}
                        label="students"
                        loading={statsLoading}
                    />

                    {/* Batches count */}
                    <StatPill
                        icon={BookOpen}
                        value={totalBatches !== null ? `${totalBatches} batch${totalBatches === 1 ? "" : "es"}` : null}
                        label=""
                        loading={statsLoading}
                    />

                    {/* Pending fees warning */}
                    <FeesPill summary={feesSummary} loading={feesLoading} />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0  ">
                    {/* Search */}
                    <form className="hidden md:flex w-[200px]">
                        <Input
                            type="search"
                            placeholder="Search anything..."
                            className="h-9 text-[13px]  border-border"
                            icon={<Search className="h-3.5 w-3.5" />}
                        />
                    </form>

                    {/* Mobile search button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                    >
                        <Search className="h-4 w-4" />
                        <span className="sr-only">Search</span>
                    </Button>

                    {/* Theme toggle */}
                    {mounted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-secondary"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        >
                            {theme === "dark"
                                ? <Sun className="h-4 w-4" />
                                : <Moon className="h-4 w-4" />
                            }
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    )}

                    {/* Get QR — admin/teacher only */}
                    {isAdminOrTeacher && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary hidden sm:flex"
                            onClick={() => setQrOpen(true)}
                        >
                            <QrCode className="h-4 w-4" />
                            <span className="hidden lg:inline">Get QR</span>
                        </Button>
                    )}

                    {/* Notifications */}
                    <NotificationPanel />

                    {/* Divider */}
                    <div className="h-5 w-px bg-border hidden sm:block" />

                    {/* User avatar */}
                    <Button
                        variant="ghost"
                        className="h-9 px-2 gap-2.5 hover:bg-secondary hidden sm:flex"
                    >
                        <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[13.5px] font-bold text-primary-foreground shrink-0 shadow-sm">
                            {initials}
                        </div>
                        <div className="hidden lg:flex flex-col items-start">
                            <span className="text-[13px] font-semibold text-foreground leading-tight">
                                {displayName.split(" ")[0]}
                            </span>
                            <span className="text-[12px] text-muted-foreground leading-tight capitalize">
                                {user?.role?.toLowerCase() || "teacher"}
                            </span>
                        </div>
                    </Button>

                    {/* Mobile menu */}
                    <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-muted-foreground">
                        <Menu className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </header>

        {/* App Onboarding QR Modal */}
        <Dialog open={qrOpen} onOpenChange={setQrOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base">
                        <QrCode className="h-4 w-4" />
                        App Onboarding QR
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    {qrLoading && (
                        <div className="h-[200px] w-[200px] rounded-lg bg-muted animate-pulse" />
                    )}

                    {qrError && (
                        <p className="text-sm text-destructive text-center">
                            Failed to generate QR code. Make sure <code className="text-xs bg-muted px-1 py-0.5 rounded">API_URL</code> is configured on the server.
                        </p>
                    )}

                    {qrData && (
                        <>
                            {/* QR Image */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={qrData.qrDataUrl}
                                alt="App onboarding QR code"
                                className="w-[200px] h-[200px] rounded-lg border border-border shadow-sm"
                            />

                            {/* Class name */}
                            <p className="text-sm font-semibold text-foreground">{qrData.payload.name}</p>

                            {/* Instruction */}
                            <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                                Share this QR with students and teachers. They scan once in the app to connect to your class.
                            </p>

                            {/* Download button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={handleDownloadQr}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Download PNG
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
        </>
    )
}
