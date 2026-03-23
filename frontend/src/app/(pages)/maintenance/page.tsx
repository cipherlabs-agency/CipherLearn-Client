"use client"

import { useState, useCallback } from "react"
import {
    useMaintenanceAuthMutation,
    useMaintenanceSeedMutation,
    useMaintenanceStatusQuery,
    useMaintenanceCleanupMutation,
    type SeededStudent,
} from "@/redux/slices/maintenance/maintenanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { useAppSelector } from "@/redux/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Lock,
    Zap,
    Trash2,
    Database,
    Users,
    Calendar,
    BookOpen,
    GraduationCap,
    FileText,
    Video,
    ClipboardList,
    TestTube,
    Shield,
    Loader2,
    Terminal,
    ArrowLeft,
    Rocket,
    AlertTriangle,
    Copy,
    Check,
    IndianRupee,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// ─── Password Gate ────────────────────────────────────────────

function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
    const [password, setPassword] = useState("")
    const [authenticate, { isLoading }] = useMaintenanceAuthMutation()
    const [shake, setShake] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await authenticate({ password }).unwrap()
            onUnlock(password)
        } catch {
            setShake(true)
            setTimeout(() => setShake(false), 500)
            toast.error("Access Denied", { description: "Invalid password" })
        }
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className={`w-full max-w-md transition-transform ${shake ? "animate-shake" : ""}`}>
                <div className="text-center mb-10 space-y-3">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center mb-6">
                        <Shield className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight font-mono">MAINTENANCE MODE</h1>
                    <p className="text-sm text-muted-foreground font-mono">
                        <span className="text-amber-500">$</span> sudo authenticate --level=superadmin
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="p-6 bg-zinc-950/60 border-zinc-800 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-mono">
                                Access Code
                            </label>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter maintenance password..."
                                className="bg-zinc-900/80 border-zinc-700 font-mono text-lg h-12 placeholder:text-zinc-600"
                                autoFocus
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading || !password}
                            className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold font-mono text-sm tracking-wider"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Lock className="h-4 w-4 mr-2" />
                            )}
                            AUTHENTICATE
                        </Button>
                    </Card>
                </form>

                <p className="text-center mt-6 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                    Authorized Personnel Only
                </p>
            </div>
        </div>
    )
}

// ─── Status Metric Card ───────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color }: {
    label: string; value: number; icon: any; color: string
}) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700 transition-all group">
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                </div>
                {value > 0 && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">
                        ACTIVE
                    </Badge>
                )}
            </div>
            <p className="text-2xl font-black font-mono tabular-nums">{value}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mt-1">{label}</p>
        </div>
    )
}

// ─── Student Inspector Table ──────────────────────────────────

function StudentInspector({ students }: { students: SeededStudent[] }) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

    const copyCredentials = useCallback((email: string, password: string, idx: number) => {
        navigator.clipboard.writeText(`${email} / ${password}`)
        setCopiedIdx(idx)
        setTimeout(() => setCopiedIdx(null), 2000)
        toast.success("Credentials copied!")
    }, [])

    if (!students.length) return null

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <h3 className="font-bold font-mono text-sm">Seeded Student Credentials</h3>
                <Badge variant="outline" className="text-[10px] font-mono border-zinc-700">
                    {students.length} accounts
                </Badge>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs font-mono">
                    <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/50">
                            <th className="text-left px-4 py-2.5 text-zinc-500 font-bold">#</th>
                            <th className="text-left px-4 py-2.5 text-zinc-500 font-bold">Name</th>
                            <th className="text-left px-4 py-2.5 text-zinc-500 font-bold">Email</th>
                            <th className="text-left px-4 py-2.5 text-zinc-500 font-bold">Password</th>
                            <th className="text-left px-4 py-2.5 text-zinc-500 font-bold">Batch</th>
                            <th className="px-4 py-2.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s, i) => (
                            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors">
                                <td className="px-4 py-2 text-zinc-600">{i + 1}</td>
                                <td className="px-4 py-2 text-zinc-300">{s.name.replace("[SEED] ", "")}</td>
                                <td className="px-4 py-2 text-amber-400/80">{s.email}</td>
                                <td className="px-4 py-2 text-emerald-400/80">{s.password}</td>
                                <td className="px-4 py-2 text-zinc-500">{s.batchName}</td>
                                <td className="px-4 py-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 hover:bg-zinc-800"
                                        onClick={() => copyCredentials(s.email, s.password, i)}
                                    >
                                        {copiedIdx === i ? (
                                            <Check className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                            <Copy className="h-3 w-3 text-zinc-500" />
                                        )}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ─── Command Center ───────────────────────────────────────────

function CommandCenter({ password }: { password: string }) {
    const router = useRouter()
    const { data: status, refetch: refetchStatus } = useMaintenanceStatusQuery()
    const { data: batches = [] } = useGetAllBatchesQuery()
    const [seed, { isLoading: isSeeding }] = useMaintenanceSeedMutation()
    const [cleanup, { isLoading: isCleaning }] = useMaintenanceCleanupMutation()

    const [count, setCount] = useState(100)
    const [batchId, setBatchId] = useState<string>("")
    const [seededStudents, setSeededStudents] = useState<SeededStudent[]>([])

    const totalSeeded = status
        ? Object.values(status).reduce((a, b) => a + b, 0)
        : 0

    const handleSeed = async () => {
        try {
            const result = await seed({
                password,
                count,
                batchId: batchId ? parseInt(batchId) : undefined,
            }).unwrap()
            setSeededStudents(result.data.students)
            refetchStatus()
            toast.success(`Seeded ${result.data.summary.students} students`, {
                description: "All related data (attendance, fees, tests, lectures) generated.",
            })
        } catch (err: any) {
            toast.error("Seed failed", { description: err.data?.message || err.message })
        }
    }

    const handleCleanup = async () => {
        try {
            const result = await cleanup({ password }).unwrap()
            setSeededStudents([])
            refetchStatus()
            const total = Object.values(result.data).reduce((a: number, b: number) => a + b, 0)
            toast.success(`Purged ${total} records`, { description: "All seed data has been destroyed." })
        } catch (err: any) {
            toast.error("Cleanup failed", { description: err.data?.message || err.message })
        }
    }

    return (
        <div className="space-y-8 max-w-[1200px] mx-auto animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/settings")} className="hover:bg-zinc-800">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black font-mono tracking-tight">Command Center</h1>
                            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-mono text-[10px]">
                                MAINTENANCE
                            </Badge>
                        </div>
                        <p className="text-xs text-zinc-500 font-mono mt-1">
                            <span className="text-emerald-400">●</span> Authenticated · Scalability Testing Environment
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-zinc-600 font-mono">{totalSeeded} total seed records</p>
                </div>
            </div>

            {/* Status Dashboard */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-blue-400" />
                    <h2 className="font-bold font-mono text-sm">Seed Data Status</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    <MetricCard label="Students" value={status?.students ?? 0} icon={Users} color="bg-blue-500/10 text-blue-400" />
                    <MetricCard label="Attendances" value={status?.attendances ?? 0} icon={Calendar} color="bg-emerald-500/10 text-emerald-400" />
                    <MetricCard label="Fee Receipts" value={status?.feeReceipts ?? 0} icon={IndianRupee} color="bg-amber-500/10 text-amber-400" />
                    <MetricCard label="Lectures" value={status?.lectures ?? 0} icon={BookOpen} color="bg-violet-500/10 text-violet-400" />
                    <MetricCard label="Tests" value={status?.tests ?? 0} icon={TestTube} color="bg-pink-500/10 text-pink-400" />
                    <MetricCard label="Test Scores" value={status?.testScores ?? 0} icon={GraduationCap} color="bg-cyan-500/10 text-cyan-400" />
                    <MetricCard label="Notes" value={status?.notes ?? 0} icon={FileText} color="bg-orange-500/10 text-orange-400" />
                    <MetricCard label="Videos" value={status?.youtubeVideos ?? 0} icon={Video} color="bg-red-500/10 text-red-400" />
                    <MetricCard label="Assignments" value={status?.assignments ?? 0} icon={ClipboardList} color="bg-teal-500/10 text-teal-400" />
                    <MetricCard label="Batches" value={status?.batches ?? 0} icon={Database} color="bg-indigo-500/10 text-indigo-400" />
                </div>
            </div>

            {/* Seed Engine */}
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <Rocket className="h-5 w-5 text-amber-400" />
                    <h2 className="font-bold font-mono">Seed Engine</h2>
                </div>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    Generate N students with 30 days of attendance, 3 months of fees, 10 lectures, 3 tests with scores, notes, videos, and assignments. All data tagged <code className="text-amber-400">[SEED]</code> for safe cleanup.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-mono">
                            Student Count
                        </label>
                        <Input
                            type="number"
                            value={count}
                            onChange={(e) => setCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                            className="bg-zinc-950 border-zinc-700 font-mono h-11"
                            min={1}
                            max={500}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 font-mono">
                            Target Batch (Optional)
                        </label>
                        <Select value={batchId} onValueChange={setBatchId}>
                            <SelectTrigger className="bg-zinc-950 border-zinc-700 font-mono h-11">
                                <SelectValue placeholder="Auto-create batch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="auto">Auto-create [SEED] Batch</SelectItem>
                                {batches.map((b) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleSeed}
                            disabled={isSeeding}
                            className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-black font-bold font-mono tracking-wider"
                        >
                            {isSeeding ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> SEEDING...</>
                            ) : (
                                <><Zap className="h-4 w-4 mr-2" /> SEED {count} STUDENTS</>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Student Inspector */}
            <StudentInspector students={seededStudents} />

            {/* Nuclear Cleanup */}
            <Card className="bg-red-950/20 border-red-900/40 p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <h2 className="font-bold font-mono text-red-400">Nuclear Cleanup</h2>
                </div>
                <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                    Permanently delete ALL records tagged with <code className="text-red-400">[SEED]</code>. Your real data is never touched.
                    This action cannot be undone.
                </p>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            disabled={isCleaning || totalSeeded === 0}
                            className="font-mono font-bold tracking-wider h-11"
                        >
                            {isCleaning ? (
                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> PURGING...</>
                            ) : (
                                <><Trash2 className="h-4 w-4 mr-2" /> DESTROY ALL SEED DATA ({totalSeeded} records)</>
                            )}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-950 border-zinc-800">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="font-mono">☢️ Confirm Nuclear Cleanup</AlertDialogTitle>
                            <AlertDialogDescription className="font-mono text-zinc-500">
                                This will permanently delete {totalSeeded} seed records across all tables.
                                Your real student, attendance, and fee data will NOT be affected.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="font-mono">Abort</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleCleanup}
                                className="bg-red-600 hover:bg-red-700 font-mono font-bold"
                            >
                                Confirm Destroy
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </Card>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────

export default function MaintenancePage() {
    const { user } = useAppSelector((state) => state.auth)
    const router = useRouter()
    const [unlocked, setUnlocked] = useState(false)
    const [password, setPassword] = useState("")

    // Only admins can access
    if (user?.role !== "ADMIN") {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Shield className="h-16 w-16 text-zinc-700 mx-auto" />
                    <h1 className="text-xl font-black font-mono">Access Restricted</h1>
                    <p className="text-sm text-zinc-500 font-mono">Admin privileges required.</p>
                    <Button variant="outline" onClick={() => router.push("/settings")} className="font-mono">
                        ← Back to Settings
                    </Button>
                </div>
            </div>
        )
    }

    if (!unlocked) {
        return (
            <PasswordGate
                onUnlock={(pw) => {
                    setPassword(pw)
                    setUnlocked(true)
                }}
            />
        )
    }

    return <CommandCenter password={password} />
}
