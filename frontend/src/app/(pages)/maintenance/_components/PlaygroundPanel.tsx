"use client"
import { useState, useEffect, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Send, ChevronDown, Code2, ArrowRight, Key, Plus, Trash2, Check, Copy, Clock, ChevronRight, GripVertical, User, Shield as ShieldIcon, X } from "lucide-react"
import { toast } from "sonner"
import { useMaintenancePlaygroundMutation, type PlaygroundResult } from "@/redux/slices/maintenance/maintenanceApi"
import { METHOD_COLORS, TimeBadge } from "./shared"

// ── Types ──────────────────────────────────────────────────
interface PostmanReq { name: string; folder: string; method: string; path: string; body?: string; desc?: string }
interface PostmanCol { name: string; version: string; file: string; requests: PostmanReq[] }
interface SavedToken { id: string; name: string; role: string; token: string; email: string; createdAt: number }
interface HistoryEntry { method: string; path: string; status: number; time: number; at: number }

const STORAGE_KEY = "qa-playground-tokens"
const HISTORY_KEY = "qa-playground-history"

const COLLECTION_FILES = [
  { file: "/postman/v.1.0.1.json", label: "Dashboard v1.0.1" },
  { file: "/postman/app.1.0.12.json", label: "App v1.0.12" },
  { file: "/postman/v.0.1.0.json", label: "Dashboard v0.1.0" },
]

// ── Postman Parser ─────────────────────────────────────────
function parseItems(items: any[], folder = ""): PostmanReq[] {
  const out: PostmanReq[] = []
  for (const item of items) {
    if (item.item) { out.push(...parseItems(item.item, item.name)); continue }
    if (!item.request) continue
    const r = item.request
    const path = "/" + (r.url?.path || []).join("/")
    let body: string | undefined
    if (r.body?.mode === "raw" && r.body.raw) body = r.body.raw
    out.push({ name: item.name, folder: folder || "Root", method: r.method || "GET", path, body, desc: r.description?.substring(0, 200) })
  }
  return out
}

function prettyJson(raw: string): string {
  try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw }
}

// ── Auth Token Manager ────────────────────────────────────
function TokenManager({ tokens, activeId, onSelect, onAdd, onRemove }: {
  tokens: SavedToken[]; activeId: string; onSelect: (id: string) => void
  onAdd: (t: SavedToken) => void; onRemove: (id: string) => void
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loginType, setLoginType] = useState<"admin" | "app">("admin")
  const [isLogging, setIsLogging] = useState(false)

  const login = async () => {
    if (!email || !password || !name) { toast.error("Fill all fields"); return }
    setIsLogging(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
      const endpoint = loginType === "admin" ? "/api/auth/login" : "/api/app/auth/login"
      const res = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message || "Login failed"); return }
      const token = json.data?.token || json.data?.accessToken || json.token
      const role = json.data?.user?.role || json.data?.role || loginType
      if (!token) { toast.error("No token in response"); return }
      const saved: SavedToken = { id: `tok_${Date.now()}`, name, role, token, email, createdAt: Date.now() }
      onAdd(saved)
      toast.success(`Saved: ${name} (${role})`)
      setEmail(""); setPassword(""); setName("")
    } catch (e: any) { toast.error(e.message || "Failed") } finally { setIsLogging(false) }
  }

  const roleIcon = (role: string) => {
    if (role === "ADMIN" || role === "admin") return <ShieldIcon className="h-3 w-3 text-amber-500" />
    if (role === "TEACHER") return <User className="h-3 w-3 text-blue-500" />
    return <User className="h-3 w-3 text-emerald-500" />
  }

  return (
    <div className="space-y-4">
      {/* Saved tokens */}
      {tokens.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saved Tokens</p>
          {tokens.map(t => (
            <div
              key={t.id}
              onClick={() => onSelect(t.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border",
                activeId === t.id
                  ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
                  : "border-border/50 hover:border-border hover:bg-secondary/30"
              )}
            >
              {roleIcon(t.role)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{t.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{t.email} · {t.role}</p>
              </div>
              {activeId === t.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
              <button onClick={e => { e.stopPropagation(); onRemove(t.id) }} className="p-1 rounded hover:bg-destructive/10 transition-colors shrink-0">
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Login form */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Token</p>
        <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5 w-full">
          <button onClick={() => setLoginType("admin")} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", loginType === "admin" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Admin/Teacher</button>
          <button onClick={() => setLoginType("app")} className={cn("flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all", loginType === "app" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>Student/App</button>
        </div>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Label (e.g. Test Student)" className="h-9 text-xs" />
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="h-9 text-xs" />
        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="h-9 text-xs" autoComplete="new-password" />
        <Button onClick={login} disabled={isLogging || !email || !password || !name} size="sm" className="w-full h-9">
          {isLogging ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Key className="h-3.5 w-3.5 mr-1.5" />}
          {isLogging ? "Logging in..." : "Login & Save Token"}
        </Button>
      </div>
    </div>
  )
}

// ── Main Playground ────────────────────────────────────────
export default function PlaygroundPanel({ token }: { token: string }) {
  const [fire, { isLoading }] = useMaintenancePlaygroundMutation()

  // Collections
  const [cols, setCols] = useState<PostmanCol[]>([])
  const [activeCol, setActiveCol] = useState(0)
  const [openFolder, setOpenFolder] = useState("")
  const [selected, setSelected] = useState<PostmanReq | null>(null)
  const [path, setPath] = useState("")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<PlaygroundResult | null>(null)
  const [ready, setReady] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showHeaders, setShowHeaders] = useState(false)

  // Tokens
  const [tokens, setTokens] = useState<SavedToken[]>([])
  const [activeToken, setActiveToken] = useState("")
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Resizer
  const [splitY, setSplitY] = useState(50) // percentage for request pane
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load collections
  useEffect(() => {
    (async () => {
      const loaded: PostmanCol[] = []
      for (const cf of COLLECTION_FILES) {
        try {
          const res = await fetch(cf.file)
          const json = await res.json()
          loaded.push({ name: json.info?.name || cf.label, version: json.info?.version || "?", file: cf.file, requests: parseItems(json.item || []) })
        } catch { /* skip */ }
      }
      setCols(loaded)
      setReady(true)
    })()
  }, [])

  // Load saved tokens + history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { const parsed = JSON.parse(saved); setTokens(parsed); if (parsed.length > 0) setActiveToken(parsed[0].id) }
    } catch { /* ignore */ }
    try {
      const h = localStorage.getItem(HISTORY_KEY)
      if (h) setHistory(JSON.parse(h))
    } catch { /* ignore */ }
  }, [])

  // Save tokens to localStorage
  const saveTokens = (t: SavedToken[]) => { setTokens(t); localStorage.setItem(STORAGE_KEY, JSON.stringify(t)) }
  const addToken = (t: SavedToken) => { const next = [t, ...tokens]; saveTokens(next); setActiveToken(t.id) }
  const removeToken = (id: string) => { const next = tokens.filter(t => t.id !== id); saveTokens(next); if (activeToken === id) setActiveToken(next[0]?.id || "") }

  // Save history
  const addHistory = (entry: HistoryEntry) => { const next = [entry, ...history].slice(0, 30); setHistory(next); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) }

  const currentToken = tokens.find(t => t.id === activeToken)?.token || token
  const currentTokenInfo = tokens.find(t => t.id === activeToken)
  const col = cols[activeCol]
  const folders = useMemo(() => col ? [...new Set(col.requests.map(r => r.folder))] : [], [col])
  const visibleReqs = useMemo(() => {
    if (!col || !openFolder) return []
    return col.requests.filter(r => r.folder === openFolder)
  }, [col, openFolder])

  const pick = (req: PostmanReq) => { setSelected(req); setPath(req.path); setBody(req.body ? prettyJson(req.body) : ""); setResult(null) }

  const send = async () => {
    if (!selected && !path) return
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
      let parsed: any
      if (body.trim()) { try { parsed = JSON.parse(body) } catch { toast.error("Invalid JSON"); return } }
      const method = selected?.method || "GET"
      const res = await fire({ baseUrl: base, token: currentToken, endpoint: path, method, body: parsed }).unwrap()
      setResult(res.data)
      addHistory({ method, path, status: res.data.response.status, time: res.data.response.time, at: Date.now() })
    } catch { toast.error("Request failed") }
  }

  const copyResponse = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result.response.body, null, 2))
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  // Resizer handlers
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault(); isDragging.current = true
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientY - rect.top) / rect.height) * 100
      setSplitY(Math.max(20, Math.min(80, pct)))
    }
    const onUp = () => { isDragging.current = false; document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const statusColor = (s: number) => s >= 200 && s < 300 ? "text-emerald-600 dark:text-emerald-400" : s >= 400 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
  const statusDot = (s: number) => s >= 200 && s < 300 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" : s >= 400 ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]"
  const statusBg = (s: number) => s >= 200 && s < 300 ? "bg-emerald-500/10" : s >= 400 ? "bg-red-500/10" : "bg-amber-500/10"

  if (!ready) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">API Playground</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Select endpoint → send request → inspect response.</p>
        </div>
        {/* Auth button */}
        <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
          <DialogTrigger asChild>
            <button className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-medium",
              currentTokenInfo
                ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
            )}>
              <Key className="h-3.5 w-3.5" />
              {currentTokenInfo ? <><span className="truncate max-w-[120px]">{currentTokenInfo.name}</span><Badge variant="secondary" className="text-[9px] ml-1">{currentTokenInfo.role}</Badge></> : "Auth Tokens"}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="text-base">Auth Token Manager</DialogTitle></DialogHeader>
            <TokenManager tokens={tokens} activeId={activeToken} onSelect={id => { setActiveToken(id); setTokenDialogOpen(false) }} onAdd={addToken} onRemove={removeToken} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Version segmented control */}
      <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5">
        {cols.map((c, i) => (
          <button
            key={c.file}
            onClick={() => { setActiveCol(i); setOpenFolder(""); setSelected(null); setResult(null) }}
            className={cn("px-4 py-1.5 rounded-md text-xs font-medium transition-all", activeCol === i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-12 gap-4" style={{ minHeight: 520 }}>

        {/* LEFT — Accordion API List */}
        <div className="col-span-4 flex flex-col rounded-xl border border-border bg-background overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60 bg-secondary/20 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{col?.requests.length || 0} Endpoints</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {folders.map(folder => {
              const isOpen = openFolder === folder
              const count = col?.requests.filter(r => r.folder === folder).length || 0
              return (
                <div key={folder}>
                  <button
                    onClick={() => setOpenFolder(isOpen ? "" : folder)}
                    className={cn("w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors border-b border-border/30", isOpen ? "bg-secondary/40" : "hover:bg-secondary/20")}
                  >
                    <span className="text-xs font-medium">{folder}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                      <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
                    </span>
                  </button>
                  {isOpen && visibleReqs.map((req, i) => {
                    const isActive = selected === req
                    return (
                      <button
                        key={`${req.method}-${req.path}-${i}`}
                        onClick={() => pick(req)}
                        className={cn(
                          "w-full flex items-center gap-2 px-4 py-2 text-left transition-all border-b border-border/20",
                          isActive ? "bg-primary/8 border-l-[3px] border-l-primary pl-[13px]" : "hover:bg-secondary/30 border-l-[3px] border-l-transparent pl-[13px]"
                        )}
                      >
                        <span className={cn("text-[9px] font-bold w-[38px] text-center py-[2px] rounded-[3px] shrink-0", METHOD_COLORS[req.method])}>{req.method}</span>
                        <span className="text-[11px] font-medium truncate flex-1">{req.name}</span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="border-t border-border shrink-0">
              <div className="px-4 py-2 bg-secondary/20"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Recent</p></div>
              <div className="max-h-[120px] overflow-y-auto">
                {history.slice(0, 8).map((h, i) => (
                  <div key={i} className="flex items-center gap-2 px-4 py-1.5 text-[10px] border-b border-border/20">
                    <span className={cn("font-bold w-8", METHOD_COLORS[h.method])}>{h.method}</span>
                    <span className="text-muted-foreground truncate flex-1 font-mono">{h.path}</span>
                    <span className={cn("font-bold tabular-nums", statusColor(h.status))}>{h.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Request / Response Studio */}
        <div className="col-span-8 flex flex-col rounded-xl border border-border bg-background overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center"><Code2 className="h-5 w-5 text-muted-foreground/50" /></div>
                <p className="text-sm font-medium text-muted-foreground">Select an endpoint to begin</p>
              </div>
            </div>
          ) : (
            <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
              {/* URL bar */}
              <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-secondary/10 shrink-0">
                <Badge className={cn("text-[10px] font-bold shrink-0 rounded-[4px]", METHOD_COLORS[selected.method])}>{selected.method}</Badge>
                <Input value={path} onChange={e => setPath(e.target.value)} className="h-8 font-mono text-xs border-0 bg-transparent focus-visible:ring-0 px-1" />
                <Button onClick={send} disabled={isLoading} size="sm" className="rounded-full px-5 h-8 bg-foreground text-background hover:bg-foreground/90 shrink-0">
                  {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><span className="text-[11px] font-medium mr-1">Send</span><ArrowRight className="h-3 w-3" /></>}
                </Button>
              </div>

              {/* Using token indicator */}
              {currentTokenInfo && (
                <div className="px-4 py-1.5 border-b border-border/30 bg-primary/3 flex items-center gap-2 shrink-0">
                  <Key className="h-2.5 w-2.5 text-primary" />
                  <span className="text-[10px] text-primary font-medium">Using: {currentTokenInfo.name}</span>
                  <Badge variant="outline" className="text-[8px] ml-1">{currentTokenInfo.role}</Badge>
                </div>
              )}

              {/* Request pane */}
              <div style={{ height: `${splitY}%` }} className="min-h-0 flex flex-col border-b-0">
                <div className="px-4 py-1.5 border-b border-border/30 bg-secondary/10 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Request</span>
                  {selected.desc && <span className="text-[9px] text-muted-foreground truncate ml-4 max-w-[300px]">{selected.name}</span>}
                </div>
                {selected.method !== "GET" ? (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full h-full px-4 py-3 bg-[#0C0C0C] text-[#E2E8F0] text-[11px] font-mono resize-none focus:outline-none leading-relaxed"
                      spellCheck={false}
                      placeholder="// Request body (JSON)"
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-secondary/5">
                    <p className="text-[11px] text-muted-foreground">GET request — no body</p>
                  </div>
                )}
              </div>

              {/* Drag handle */}
              <div onMouseDown={onDragStart} className="h-[6px] border-y border-border/50 bg-secondary/30 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-secondary/60 transition-colors">
                <GripVertical className="h-3 w-3 text-muted-foreground/40 rotate-90" />
              </div>

              {/* Response pane */}
              <div style={{ height: `${100 - splitY}%` }} className="min-h-0 flex flex-col">
                {!result ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-8 h-8 rounded-full border-2 border-muted-foreground/15 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/20 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-muted-foreground/60">Awaiting response…</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Response header */}
                    <div className={cn("px-4 py-2 border-b border-border/30 flex items-center justify-between shrink-0", statusBg(result.response.status))}>
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("w-2 h-2 rounded-full", statusDot(result.response.status))} />
                          <span className={cn("text-sm font-bold tabular-nums", statusColor(result.response.status))}>{result.response.status}</span>
                        </div>
                        <span className="text-border">·</span>
                        <TimeBadge ms={result.response.time} />
                        <span className="text-border">·</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{result.request.method}</span>
                        <button onClick={() => setShowHeaders(!showHeaders)} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2 ml-2">
                          {showHeaders ? "Hide" : "Headers"}
                        </button>
                      </div>
                      <button onClick={copyResponse} className="p-1.5 rounded-md hover:bg-background/50 transition-colors" title="Copy response">
                        {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                      </button>
                    </div>

                    {/* Response headers (collapsible) */}
                    {showHeaders && result.response.headers && (
                      <div className="px-4 py-2 border-b border-border/30 bg-secondary/10 max-h-[80px] overflow-y-auto">
                        {Object.entries(result.response.headers).map(([k, v]) => (
                          <div key={k} className="flex gap-2 text-[10px] font-mono leading-5">
                            <span className="text-muted-foreground shrink-0">{k}:</span>
                            <span className="text-foreground truncate">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Response body */}
                    <div className="flex-1 overflow-y-auto">
                      <pre className="px-4 py-3 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                        {JSON.stringify(result.response.body, null, 2)}
                      </pre>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
