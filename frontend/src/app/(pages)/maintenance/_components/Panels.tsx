"use client"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Zap, Trash2, Database, Users, Activity, Shield, Timer, Loader2, Copy, Check, CheckCircle2, Calendar, Receipt, BookOpen, ClipboardCheck, FileText, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  useMaintenanceStatusQuery, useMaintenanceSeedDataQuery, useMaintenanceSeedMutation,
  useMaintenanceCleanupMutation, useMaintenanceApiHealthMutation, useMaintenanceValidationMutation,
  useMaintenanceSecurityMutation, useMaintenanceDbIntegrityQuery, useMaintenanceLoadTestMutation,
  useMaintenanceEndpointsQuery,
  type HealthResult, type ValidationResult, type SecurityResult, type LoadTestResult,
} from "@/redux/slices/maintenance/maintenanceApi"
import { useGetAllBatchesQuery } from "@/redux/slices/batches/batchesApi"
import { StatusBadge, TimeBadge, StatCards } from "./shared"

// ── Overview ───────────────────────────────────────────────
export function OverviewPanel() {
  const { data: s } = useMaintenanceStatusQuery()
  const total = s ? Object.values(s).reduce((a, b) => a + b, 0) : 0
  const metrics = [
    { l: "Students", v: s?.students ?? 0, icon: Users, c: "text-blue-600 dark:text-blue-400" },
    { l: "Batches", v: s?.batches ?? 0, icon: Database, c: "text-amber-600 dark:text-amber-400" },
    { l: "Attendance", v: s?.attendances ?? 0, icon: Calendar, c: "text-emerald-600 dark:text-emerald-400" },
    { l: "Fee Receipts", v: s?.feeReceipts ?? 0, icon: Receipt, c: "text-violet-600 dark:text-violet-400" },
    { l: "Lectures", v: s?.lectures ?? 0, icon: BookOpen, c: "text-cyan-600 dark:text-cyan-400" },
    { l: "Tests", v: s?.tests ?? 0, icon: ClipboardCheck, c: "text-pink-600 dark:text-pink-400" },
    { l: "Test Scores", v: s?.testScores ?? 0, icon: CheckCircle2, c: "text-orange-600 dark:text-orange-400" },
    { l: "Notes", v: s?.notes ?? 0, icon: FileText, c: "text-teal-600 dark:text-teal-400" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">System Overview</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Seed data snapshot · <strong>{total}</strong> total records</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map(({ l, v, icon: I, c }) => (
          <Card key={l} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg bg-secondary shrink-0", c)}><I className="h-4 w-4" /></div>
              <div>
                <p className="text-xl font-bold tabular-nums">{v}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{l}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      {total === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Database className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No seed data. Use <strong>Seed Engine</strong> to create test data.</p>
        </Card>
      )}
    </div>
  )
}

// ── Seed Engine ────────────────────────────────────────────
export function SeedPanel({ password }: { password: string }) {
  const { data: batches = [] } = useGetAllBatchesQuery()
  const { data: seedData, refetch: refetchSeed } = useMaintenanceSeedDataQuery()
  const [seed, { isLoading }] = useMaintenanceSeedMutation()
  const { refetch: refetchStatus } = useMaintenanceStatusQuery()
  const [count, setCount] = useState(10)
  const [batchId, setBatchId] = useState("")
  const [summary, setSummary] = useState<Record<string, number> | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const cp = useCallback((email: string, idx: number) => {
    navigator.clipboard.writeText(`${email} / seed123`); setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000)
  }, [])

  const go = async () => {
    try {
      const r = await seed({ password, count, batchId: batchId && batchId !== "auto" ? parseInt(batchId) : undefined }).unwrap()
      setSummary(r.data.summary); refetchStatus(); refetchSeed()
      toast.success(`Seeded ${r.data.summary.students} students`)
    } catch (e: any) { toast.error(e.data?.message || e.message) }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Seed Engine</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Students + attendance + fees + scores + lectures + notes · tagged <code className="text-primary font-medium">[SEED]</code></p>
      </div>
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Count</label><Input type="number" value={count} onChange={e => setCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))} className="h-10" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Target Batch</label><Select value={batchId} onValueChange={setBatchId}><SelectTrigger className="h-10"><SelectValue placeholder="Auto-create new" /></SelectTrigger><SelectContent><SelectItem value="auto">Auto-create [SEED] Batch</SelectItem>{(batches as any[]).map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="flex items-end"><Button onClick={go} disabled={isLoading} className="w-full h-10">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}{isLoading ? "Seeding..." : `Seed ${count} Students`}</Button></div>
        </div>
      </Card>

      {summary && <StatCards items={[{ label: "Students", value: summary.students }, { label: "Attendance", value: summary.attendances }, { label: "Fees", value: summary.feeReceipts }, { label: "Tests", value: summary.tests }, { label: "Scores", value: summary.testScores }, { label: "Lectures", value: summary.lectures }, { label: "Notes", value: summary.notes }, { label: "Batches", value: summary.batches }]} />}

      {seedData && seedData.batches.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-secondary/20 flex items-center justify-between">
            <span className="text-xs font-semibold">Seed Batches</span>
            <Badge variant="secondary" className="text-[10px]">{seedData.batches.length}</Badge>
          </div>
          <div className="max-h-[180px] overflow-y-auto">
            <table className="w-full text-xs"><thead><tr className="border-b"><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">ID</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Name</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Students</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Lectures</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Tests</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Notes</th></tr></thead>
              <tbody>{seedData.batches.map(b => <tr key={b.id} className="border-b border-border/40 hover:bg-secondary/20"><td className="px-4 py-2 text-muted-foreground">#{b.id}</td><td className="px-4 py-2 font-medium">{b.name.replace("[SEED] ", "")}</td><td className="px-4 py-2">{b._count.students}</td><td className="px-4 py-2">{b._count.lectures}</td><td className="px-4 py-2">{b._count.tests}</td><td className="px-4 py-2">{b._count.notes}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}

      {seedData && seedData.students.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-2.5 border-b bg-secondary/20 flex items-center justify-between">
            <span className="text-xs font-semibold">Seed Students</span>
            <Badge variant="secondary" className="text-[10px]">{seedData.students.length} · pw: seed123</Badge>
          </div>
          <div className="max-h-[260px] overflow-y-auto">
            <table className="w-full text-xs"><thead><tr className="border-b"><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">ID</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Name</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Email</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Batch</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Att</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Fees</th><th className="text-left px-4 py-2 text-[10px] font-medium text-muted-foreground">Scores</th><th className="px-4 py-2 w-8"></th></tr></thead>
              <tbody>{seedData.students.map((s, i) => <tr key={s.id} className="border-b border-border/40 hover:bg-secondary/20"><td className="px-4 py-2 text-muted-foreground">#{s.id}</td><td className="px-4 py-2 font-medium">{s.firstname} {s.lastname}</td><td className="px-4 py-2 text-muted-foreground font-mono text-[10px]">{s.email}</td><td className="px-4 py-2 text-muted-foreground truncate max-w-[100px]">{s.batch?.name.replace("[SEED] ", "") ?? "—"}</td><td className="px-4 py-2">{s._count.attendances}</td><td className="px-4 py-2">{s._count.feeReceipts}</td><td className="px-4 py-2">{s._count.testScores}</td><td className="px-4 py-2"><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => cp(s.email, i)}>{copiedIdx === i ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}</Button></td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

// ── API Health ─────────────────────────────────────────────
export function ApiHealthPanel({ token }: { token: string }) {
  const [run, { isLoading }] = useMaintenanceApiHealthMutation()
  const [r, setR] = useState<HealthResult | null>(null)
  const go = async () => { try { const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"; const res = await run({ baseUrl: base, token }).unwrap(); setR(res.data); toast.success(`${res.data.passed}/${res.data.total} healthy`) } catch { toast.error("Failed") } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold tracking-tight">API Health</h2><p className="text-sm text-muted-foreground mt-0.5">Tests every GET endpoint for availability.</p></div>
        <Button onClick={go} disabled={isLoading} size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Activity className="h-4 w-4 mr-2" />}{isLoading ? "Running..." : "Run Check"}</Button>
      </div>
      {r && <>
        <StatCards items={[{ label: "Total", value: r.total }, { label: "Passed", value: r.passed, color: "text-emerald-600 dark:text-emerald-400" }, { label: "Failed", value: r.failed, color: r.failed > 0 ? "text-red-600 dark:text-red-400" : undefined }]} />
        <Card className="overflow-hidden"><div className="max-h-[400px] overflow-y-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-background z-10"><tr className="border-b bg-secondary/30"><th className="text-left px-4 py-2 font-medium text-muted-foreground">Endpoint</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Module</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Time</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Result</th></tr></thead><tbody>{r.results.map((x, i) => <tr key={i} className={cn("border-b border-border/40", !x.passed && "bg-red-500/5")}><td className="px-4 py-2 text-muted-foreground font-mono text-[10px]">{x.path}</td><td className="px-4 py-2 font-medium">{x.module}</td><td className="px-4 py-2 tabular-nums">{x.status}</td><td className="px-4 py-2"><TimeBadge ms={x.time} /></td><td className="px-4 py-2"><StatusBadge passed={x.passed} /></td></tr>)}</tbody></table></div></Card>
      </>}
    </div>
  )
}

// ── Validation ─────────────────────────────────────────────
export function ValidationPanel({ token }: { token: string }) {
  const [run, { isLoading }] = useMaintenanceValidationMutation()
  const [r, setR] = useState<ValidationResult | null>(null)
  const go = async () => { try { const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"; const res = await run({ baseUrl: base, token }).unwrap(); setR(res.data); toast.success(`${res.data.passed}/${res.data.total} validated`) } catch { toast.error("Failed") } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold tracking-tight">Validation Audit</h2><p className="text-sm text-muted-foreground mt-0.5">Invalid payloads → expects 400 rejection.</p></div>
        <Button onClick={go} disabled={isLoading} size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}{isLoading ? "Auditing..." : "Run Audit"}</Button>
      </div>
      {r && <>
        <StatCards items={[{ label: "Tests", value: r.total }, { label: "Rejected", value: r.passed, color: "text-emerald-600 dark:text-emerald-400" }, { label: "Leaked", value: r.failed, color: r.failed > 0 ? "text-red-600 dark:text-red-400" : undefined }]} />
        <Card className="overflow-hidden"><div className="max-h-[400px] overflow-y-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-background z-10"><tr className="border-b bg-secondary/30"><th className="text-left px-4 py-2 font-medium text-muted-foreground">Module</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Test Case</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Server Error</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Result</th></tr></thead><tbody>{r.results.map((x, i) => <tr key={i} className={cn("border-b border-border/40", !x.passed && "bg-red-500/5")}><td className="px-4 py-2 font-medium">{x.module}</td><td className="px-4 py-2 text-muted-foreground">{x.desc}</td><td className="px-4 py-2 tabular-nums">{x.status}</td><td className="px-4 py-2 text-muted-foreground max-w-[200px] truncate">{x.serverMessage || "—"}</td><td className="px-4 py-2"><StatusBadge passed={x.passed} /></td></tr>)}</tbody></table></div></Card>
      </>}
    </div>
  )
}

// ── Security ───────────────────────────────────────────────
export function SecurityPanel({ token }: { token: string }) {
  const [run, { isLoading }] = useMaintenanceSecurityMutation()
  const [r, setR] = useState<SecurityResult | null>(null)
  const go = async () => { try { const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"; const res = await run({ baseUrl: base, token }).unwrap(); setR(res.data); toast.success(`${res.data.passed}/${res.data.total} secure`) } catch { toast.error("Failed") } }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold tracking-tight">Security Audit</h2><p className="text-sm text-muted-foreground mt-0.5">No-auth, fake-token, admin-only route verification.</p></div>
        <Button onClick={go} disabled={isLoading} size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}{isLoading ? "Scanning..." : "Run Audit"}</Button>
      </div>
      {r && <>
        <StatCards items={[{ label: "Tests", value: r.total }, { label: "Secure", value: r.passed, color: "text-emerald-600 dark:text-emerald-400" }, { label: "Vulnerable", value: r.failed, color: r.failed > 0 ? "text-red-600 dark:text-red-400" : undefined }]} />
        <Card className="overflow-hidden"><div className="max-h-[400px] overflow-y-auto"><table className="w-full text-xs"><thead className="sticky top-0 bg-background z-10"><tr className="border-b bg-secondary/30"><th className="text-left px-4 py-2 font-medium text-muted-foreground">Test</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Module</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Endpoint</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Got</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Expected</th><th className="text-left px-4 py-2 font-medium text-muted-foreground">Result</th></tr></thead><tbody>{r.results.map((x, i) => <tr key={i} className={cn("border-b border-border/40", !x.passed && "bg-red-500/5")}><td className="px-4 py-2"><Badge variant="outline" className="text-[9px]">{x.test}</Badge></td><td className="px-4 py-2 font-medium">{x.module}</td><td className="px-4 py-2 text-muted-foreground font-mono text-[10px]">{x.path}</td><td className="px-4 py-2 tabular-nums">{x.status}</td><td className="px-4 py-2 text-muted-foreground">{x.expected}</td><td className="px-4 py-2"><StatusBadge passed={x.passed} /></td></tr>)}</tbody></table></div></Card>
      </>}
    </div>
  )
}

// ── DB Integrity ───────────────────────────────────────────
export function DbIntegrityPanel() {
  const { data: r, isLoading, refetch } = useMaintenanceDbIntegrityQuery()
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-lg font-semibold tracking-tight">Database Integrity</h2><p className="text-sm text-muted-foreground mt-0.5">Orphan records, broken FKs, duplicate checks.</p></div>
        <Button onClick={() => refetch()} disabled={isLoading} size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Database className="h-4 w-4 mr-2" />}{isLoading ? "Checking..." : "Run Check"}</Button>
      </div>
      {r && <>
        <StatCards items={[{ label: "Checks", value: r.total }, { label: "Issues", value: r.issues, color: r.issues > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" }]} />
        <div className="space-y-2">{r.checks.map((c, i) => <Card key={i} className={cn("p-4 flex items-center justify-between gap-4", !c.passed && "border-red-500/30 bg-red-500/5")}><div className="min-w-0"><p className="text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p></div><div className="flex items-center gap-2 shrink-0">{c.count > 0 && <Badge variant="secondary" className="tabular-nums text-[10px]">{c.count}</Badge>}<StatusBadge passed={c.passed} /></div></Card>)}</div>
      </>}
    </div>
  )
}

// ── Load Test ──────────────────────────────────────────────
export function LoadTestPanel({ token }: { token: string }) {
  const { data: eps = [] } = useMaintenanceEndpointsQuery()
  const [run, { isLoading }] = useMaintenanceLoadTestMutation()
  const [ep, setEp] = useState(""); const [con, setCon] = useState(5); const [iter, setIter] = useState(50)
  const [r, setR] = useState<LoadTestResult | null>(null)
  const go = async () => { if (!ep) { toast.error("Select endpoint"); return }; try { const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"; const res = await run({ baseUrl: base, token, endpoint: ep, concurrency: con, iterations: iter }).unwrap(); setR(res.data); toast.success(`${res.data.requestsPerSecond} req/s`) } catch { toast.error("Failed") } }

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold tracking-tight">Load Test</h2><p className="text-sm text-muted-foreground mt-0.5">Concurrent requests to measure throughput and latency.</p></div>
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Endpoint</label><Select value={ep} onValueChange={setEp}><SelectTrigger className="h-10"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{(eps as any[]).filter((e: any) => e.method === "GET").map((e: any) => <SelectItem key={e.path} value={e.path}>{e.module} — {e.path}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Concurrency</label><Input type="number" value={con} onChange={e => setCon(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))} className="h-10" /></div>
          <div className="space-y-1.5"><label className="text-xs font-medium text-muted-foreground">Iterations</label><Input type="number" value={iter} onChange={e => setIter(Math.max(1, Math.min(200, parseInt(e.target.value) || 1)))} className="h-10" /></div>
        </div>
        <Button onClick={go} disabled={isLoading} className="mt-4" size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Timer className="h-4 w-4 mr-2" />}{isLoading ? "Testing..." : "Run"}</Button>
      </Card>
      {r && <StatCards items={[{ label: "Requests", value: r.totalRequests }, { label: "Req/s", value: r.requestsPerSecond, color: "text-emerald-600 dark:text-emerald-400" }, { label: "Avg", value: `${r.avgTime}ms` }, { label: "p95", value: `${r.p95Time}ms`, color: r.p95Time > 500 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400" }, { label: "Min", value: `${r.minTime}ms` }, { label: "Max", value: `${r.maxTime}ms` }, { label: "OK", value: r.successful, color: "text-emerald-600 dark:text-emerald-400" }, { label: "Fail", value: r.failed, color: r.failed > 0 ? "text-red-600 dark:text-red-400" : undefined }]} />}
    </div>
  )
}

// ── Cleanup ────────────────────────────────────────────────
export function CleanupPanel({ password }: { password: string }) {
  const { data: s, refetch } = useMaintenanceStatusQuery()
  const { refetch: refetchSeed } = useMaintenanceSeedDataQuery()
  const [cleanup, { isLoading }] = useMaintenanceCleanupMutation()
  const total = s ? Object.values(s).reduce((a, b) => a + b, 0) : 0
  const go = async () => { try { const r = await cleanup({ password }).unwrap(); const d = Object.values(r.data).reduce((a: number, b: number) => a + b, 0); refetch(); refetchSeed(); toast.success(`Purged ${d} records`) } catch { toast.error("Failed") } }

  return (
    <div className="space-y-6">
      <div><h2 className="text-lg font-semibold tracking-tight">Cleanup</h2><p className="text-sm text-muted-foreground mt-0.5">Delete all <code className="text-primary font-medium">[SEED]</code> data. Real data is never touched.</p></div>
      {total === 0 ? (
        <Card className="p-8 text-center border-dashed"><Trash2 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">No seed data to clean.</p></Card>
      ) : (
        <Card className="p-5 border-destructive/30">
          <div className="flex items-start gap-3 mb-5">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div><p className="text-sm font-medium">Destructive Action</p><p className="text-xs text-muted-foreground mt-0.5">Permanently delete <strong>{total}</strong> seed records across all tables.</p></div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" disabled={isLoading} size="sm">{isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}Delete All ({total})</Button></AlertDialogTrigger>
            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirm Cleanup</AlertDialogTitle><AlertDialogDescription>This will permanently delete {total} seed records.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={go} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
          </AlertDialog>
        </Card>
      )}
    </div>
  )
}
