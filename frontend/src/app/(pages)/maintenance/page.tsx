"use client"
import { useState } from "react"
import { useAppSelector } from "@/redux/hooks"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Lock, Shield, Loader2, ArrowLeft,
  LayoutDashboard, Users, Activity, CheckCircle2, Database, Timer, Code2, Trash2
} from "lucide-react"
import { toast } from "sonner"
import { useMaintenanceAuthMutation } from "@/redux/slices/maintenance/maintenanceApi"

import { OverviewPanel, SeedPanel, ApiHealthPanel, ValidationPanel, SecurityPanel, DbIntegrityPanel, LoadTestPanel, CleanupPanel } from "./_components/Panels"
import PlaygroundPanel from "./_components/PlaygroundPanel"

// ── Navigation ─────────────────────────────────────────────
type Panel = "overview" | "seed" | "api-health" | "validation" | "security" | "db-integrity" | "load-test" | "playground" | "cleanup"

const NAV: { id: Panel; label: string; icon: any; section: string }[] = [
  { id: "overview",     label: "Overview",      icon: LayoutDashboard, section: "General" },
  { id: "seed",         label: "Seed Engine",   icon: Users,           section: "General" },
  { id: "api-health",   label: "API Health",    icon: Activity,        section: "Testing" },
  { id: "validation",   label: "Validation",    icon: CheckCircle2,    section: "Testing" },
  { id: "security",     label: "Security",      icon: Shield,          section: "Testing" },
  { id: "db-integrity", label: "DB Integrity",  icon: Database,        section: "Testing" },
  { id: "load-test",    label: "Load Test",     icon: Timer,           section: "Testing" },
  { id: "playground",   label: "API Playground",icon: Code2,           section: "Testing" },
  { id: "cleanup",      label: "Cleanup",       icon: Trash2,          section: "Danger" },
]

// ── Password Gate ──────────────────────────────────────────
function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [pw, setPw] = useState("")
  const [auth, { isLoading }] = useMaintenanceAuthMutation()
  const [shake, setShake] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await auth({ password: pw }).unwrap()
      onUnlock(pw)
    } catch {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      toast.error("Access Denied")
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className={cn("w-full max-w-sm transition-transform", shake && "animate-shake")}>
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">QA Command Center</h1>
          <p className="text-sm text-muted-foreground">Enter maintenance password to continue</p>
        </div>
        <form onSubmit={submit}>
          <Card className="p-6 space-y-4">
            <Input
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Password"
              autoFocus
              className="h-11"
              autoComplete="new-password"
            />
            <Button type="submit" disabled={isLoading || !pw} className="w-full h-11">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
              Authenticate
            </Button>
          </Card>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function MaintenancePage() {
  const { user, token: authToken } = useAppSelector(s => s.auth)
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [active, setActive] = useState<Panel>("overview")

  // Non-admin guard
  if (user?.role !== "ADMIN") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto" />
          <h1 className="text-xl font-bold">Access Restricted</h1>
          <p className="text-sm text-muted-foreground">Admin only.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/settings")}>← Settings</Button>
        </div>
      </div>
    )
  }

  // Auth gate
  if (!unlocked) {
    return <PasswordGate onUnlock={pw => { setPassword(pw); setUnlocked(true) }} />
  }

  const sections = [...new Set(NAV.map(n => n.section))]

  return (
    <div className="flex gap-8">
      {/* Sidebar */}
      <aside className="w-[180px] shrink-0 sticky top-24 self-start space-y-5">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Settings
        </button>

        <p className="text-sm font-bold tracking-tight">QA Center</p>

        {sections.map(section => (
          <div key={section} className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 mb-1.5">
              {section}
            </p>
            {NAV.filter(n => n.section === section).map(nav => {
              const isActive = active === nav.id
              return (
                <button
                  key={nav.id}
                  onClick={() => setActive(nav.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <nav.icon className="h-3.5 w-3.5 shrink-0" />
                  {nav.label}
                </button>
              )
            })}
          </div>
        ))}
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {active === "overview"     && <OverviewPanel />}
        {active === "seed"         && <SeedPanel password={password} />}
        {active === "api-health"   && <ApiHealthPanel token={authToken || ""} />}
        {active === "validation"   && <ValidationPanel token={authToken || ""} />}
        {active === "security"     && <SecurityPanel token={authToken || ""} />}
        {active === "db-integrity" && <DbIntegrityPanel />}
        {active === "load-test"    && <LoadTestPanel token={authToken || ""} />}
        {active === "playground"   && <PlaygroundPanel token={authToken || ""} />}
        {active === "cleanup"      && <CleanupPanel password={password} />}
      </main>
    </div>
  )
}
