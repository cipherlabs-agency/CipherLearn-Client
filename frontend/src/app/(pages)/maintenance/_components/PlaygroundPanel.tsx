"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Loader2, Send, ChevronDown, Code2, ArrowRight, Key, X, Check, Copy,
  Clock, GripVertical, User, Shield as ShieldIcon, Plus, History, ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { useMaintenancePlaygroundMutation, type PlaygroundResult } from "@/redux/slices/maintenance/maintenanceApi"
import { METHOD_COLORS, TimeBadge } from "./shared"

/* ================================================================
   Types
   ================================================================ */
interface PostmanReq { name: string; folder: string; method: string; path: string; body?: string; desc?: string }
interface PostmanCol { name: string; version: string; file: string; requests: PostmanReq[] }
interface SavedToken { id: string; name: string; role: string; token: string; email: string; createdAt: number }
interface Tab {
  id: string; name: string; method: string; path: string; body: string
  result: PlaygroundResult | null; vars: Record<string, string>
}

const STORAGE_TOKENS = "qa-tokens"
const STORAGE_HISTORY = "qa-history"
const COLLECTION_FILES = [
  { file: "/postman/v.1.0.1.json", label: "Dashboard v1.0.1" },
  { file: "/postman/app.1.0.12.json", label: "App v1.0.12" },
  { file: "/postman/v.0.1.0.json", label: "Dashboard v0.1.0" },
]

/* ================================================================
   Helpers
   ================================================================ */
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

function pretty(raw: string): string { try { return JSON.stringify(JSON.parse(raw), null, 2) } catch { return raw } }

function extractVars(path: string): string[] {
  const m = path.match(/\{\{(\w+)\}\}/g)
  return m ? [...new Set(m.map(v => v.replace(/\{|\}/g, "")))] : []
}

function applyVars(path: string, vars: Record<string, string>): string {
  let out = path
  for (const [k, v] of Object.entries(vars)) out = out.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v)
  return out
}

function makeTab(req?: PostmanReq): Tab {
  return {
    id: `tab_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: req?.name || "New Request",
    method: req?.method || "GET",
    path: req?.path || "/",
    body: req?.body ? pretty(req.body) : "",
    result: null,
    vars: {},
  }
}

const statusColor = (s: number) => s >= 200 && s < 300 ? "text-emerald-600 dark:text-emerald-400" : s >= 400 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
const statusDot = (s: number) => s >= 200 && s < 300 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.35)]" : s >= 400 ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.35)]" : "bg-amber-500"
const statusBg = (s: number) => s >= 200 && s < 300 ? "bg-emerald-500/8" : s >= 400 ? "bg-red-500/8" : "bg-amber-500/8"

/* ================================================================
   Token Manager
   ================================================================ */
function TokenManager({ tokens, activeId, onSelect, onAdd, onRemove }: {
  tokens: SavedToken[]; activeId: string
  onSelect: (id: string) => void; onAdd: (t: SavedToken) => void; onRemove: (id: string) => void
}) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [name, setName] = useState("")
  const [loginType, setLoginType] = useState<"admin" | "app">("admin"); const [busy, setBusy] = useState(false)

  const login = async () => {
    if (!email || !pw || !name) { toast.error("Fill all fields"); return }
    setBusy(true)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
      const ep = loginType === "admin" ? "/api/auth/login" : "/api/app/auth/login"
      const res = await fetch(`${base}${ep}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: pw }) })
      const json = await res.json()
      if (!res.ok) { toast.error(json.message || "Login failed"); return }
      const token = json.data?.token || json.data?.accessToken || json.token
      const role = json.data?.user?.role || json.data?.role || loginType
      if (!token) { toast.error("No token in response"); return }
      onAdd({ id: `tok_${Date.now()}`, name, role, token, email, createdAt: Date.now() })
      toast.success(`Saved: ${name} (${role})`); setEmail(""); setPw(""); setName("")
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="space-y-4">
      {tokens.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Saved</p>
          {tokens.map(t => (
            <div key={t.id} onClick={() => onSelect(t.id)} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all border", activeId === t.id ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-secondary/40")}>
              {t.role === "ADMIN" || t.role === "admin" ? <ShieldIcon className="h-3 w-3 text-amber-500 shrink-0" /> : <User className="h-3 w-3 text-emerald-500 shrink-0" />}
              <div className="flex-1 min-w-0"><p className="text-[11px] font-medium truncate">{t.name}</p><p className="text-[9px] text-muted-foreground">{t.role}</p></div>
              {activeId === t.id && <Check className="h-3 w-3 text-primary shrink-0" />}
              <button onClick={e => { e.stopPropagation(); onRemove(t.id) }} className="p-0.5 rounded hover:bg-destructive/10 shrink-0"><X className="h-2.5 w-2.5 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-border/50 pt-3 space-y-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add Token</p>
        <div className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5 w-full">
          <button onClick={() => setLoginType("admin")} className={cn("flex-1 py-1 rounded text-[10px] font-medium transition-all", loginType === "admin" ? "bg-background shadow-sm" : "text-muted-foreground")}>Admin</button>
          <button onClick={() => setLoginType("app")} className={cn("flex-1 py-1 rounded text-[10px] font-medium transition-all", loginType === "app" ? "bg-background shadow-sm" : "text-muted-foreground")}>Student/App</button>
        </div>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Label" className="h-8 text-[11px]" />
        <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="h-8 text-[11px]" />
        <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" className="h-8 text-[11px]" autoComplete="new-password" />
        <Button onClick={login} disabled={busy || !email || !pw || !name} size="sm" className="w-full h-8 text-[11px]">{busy ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Key className="h-3 w-3 mr-1" />}{busy ? "..." : "Login & Save"}</Button>
      </div>
    </div>
  )
}

/* ================================================================
   History Panel
   ================================================================ */
interface HistoryItem { method: string; path: string; status: number; time: number; at: number; reqBody?: any; resBody?: any }

function HistoryPanel({ items, onReplay }: { items: HistoryItem[]; onReplay: (h: HistoryItem) => void }) {
  if (items.length === 0) return <div className="text-center py-6"><p className="text-[11px] text-muted-foreground">No history yet</p></div>
  return (
    <div className="divide-y divide-border/30">
      {items.map((h, i) => (
        <button key={i} onClick={() => onReplay(h)} className="w-full text-left px-3 py-2 hover:bg-secondary/30 transition-colors flex items-center gap-2">
          <span className={cn("text-[8px] font-bold w-8 text-center py-0.5 rounded", METHOD_COLORS[h.method])}>{h.method}</span>
          <span className="text-[10px] text-muted-foreground truncate flex-1 font-mono">{h.path}</span>
          <span className={cn("text-[10px] font-bold tabular-nums", statusColor(h.status))}>{h.status}</span>
          <span className="text-[9px] text-muted-foreground tabular-nums">{h.time}ms</span>
        </button>
      ))}
    </div>
  )
}

/* ================================================================
   Response Visualizer
   ================================================================ */
function ResponseView({ data }: { data: any }) {
  const [mode, setMode] = useState<"pretty" | "raw">("pretty")
  const [copied, setCopied] = useState(false)
  const cp = () => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  if (data === null || data === undefined) return <span className="text-muted-foreground italic text-[11px]">null</span>

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 shrink-0 bg-secondary/10">
        <div className="inline-flex rounded border border-border bg-secondary/40 p-0.5">
          <button onClick={() => setMode("pretty")} className={cn("px-2 py-0.5 rounded text-[9px] font-medium transition-all", mode === "pretty" ? "bg-background shadow-sm" : "text-muted-foreground")}>Pretty</button>
          <button onClick={() => setMode("raw")} className={cn("px-2 py-0.5 rounded text-[9px] font-medium transition-all", mode === "raw" ? "bg-background shadow-sm" : "text-muted-foreground")}>Raw</button>
        </div>
        <button onClick={cp} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}{copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {mode === "raw" ? (
          <pre className="px-3 py-2 text-[11px] font-mono leading-relaxed whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <div className="px-3 py-2"><JsonTree data={data} depth={0} /></div>
        )}
      </div>
    </div>
  )
}

function JsonTree({ data, depth }: { data: any; depth: number }) {
  const [collapsed, setCollapsed] = useState(depth > 2)
  if (data === null) return <span className="text-muted-foreground text-[11px] font-mono">null</span>
  if (typeof data === "boolean") return <span className="text-amber-600 dark:text-amber-400 text-[11px] font-mono">{data.toString()}</span>
  if (typeof data === "number") return <span className="text-blue-600 dark:text-blue-400 text-[11px] font-mono">{data}</span>
  if (typeof data === "string") return <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-mono">&quot;{data.length > 120 ? data.substring(0, 120) + "…" : data}&quot;</span>

  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted-foreground text-[11px] font-mono">[]</span>
    return (
      <div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground text-[11px] font-mono hover:text-foreground">
          {collapsed ? `▶ Array(${data.length})` : "▼ ["}
        </button>
        {!collapsed && (
          <div className="pl-4 border-l border-border/30 ml-1">{data.map((item, i) => (
            <div key={i} className="flex gap-1 py-[1px]">
              <span className="text-muted-foreground/50 text-[10px] font-mono w-4 shrink-0 text-right">{i}</span>
              <JsonTree data={item} depth={depth + 1} />
            </div>
          ))}<span className="text-muted-foreground text-[11px] font-mono">]</span></div>
        )}
      </div>
    )
  }

  if (typeof data === "object") {
    const keys = Object.keys(data)
    if (keys.length === 0) return <span className="text-muted-foreground text-[11px] font-mono">{"{}"}</span>
    return (
      <div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-muted-foreground text-[11px] font-mono hover:text-foreground">
          {collapsed ? `▶ {${keys.length} keys}` : "▼ {"}
        </button>
        {!collapsed && (
          <div className="pl-4 border-l border-border/30 ml-1">{keys.map(k => (
            <div key={k} className="flex gap-1.5 py-[1px] items-start">
              <span className="text-violet-600 dark:text-violet-400 text-[11px] font-mono shrink-0">{k}:</span>
              <JsonTree data={data[k]} depth={depth + 1} />
            </div>
          ))}<span className="text-muted-foreground text-[11px] font-mono">{"}"}</span></div>
        )}
      </div>
    )
  }

  return <span className="text-[11px] font-mono">{String(data)}</span>
}

/* ================================================================
   Main Playground Component
   ================================================================ */
export default function PlaygroundPanel({ token }: { token: string }) {
  const [fire, { isLoading }] = useMaintenancePlaygroundMutation()

  // State
  const [cols, setCols] = useState<PostmanCol[]>([])
  const [activeCol, setActiveCol] = useState(0)
  const [openFolder, setOpenFolder] = useState("")
  const [ready, setReady] = useState(false)
  const [tokens, setTokens] = useState<SavedToken[]>([])
  const [activeToken, setActiveToken] = useState("")
  const [tokenOpen, setTokenOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)

  // Tabs
  const [tabs, setTabs] = useState<Tab[]>([makeTab()])
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  // Resizer
  const [splitPct, setSplitPct] = useState(50)
  const dragging = useRef(false)
  const studioRef = useRef<HTMLDivElement>(null)

  const tab = tabs.find(t => t.id === activeTab) || tabs[0]
  const updateTab = useCallback((id: string, patch: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }, [])

  // Load collections
  useEffect(() => {
    (async () => {
      const loaded: PostmanCol[] = []
      for (const cf of COLLECTION_FILES) {
        try { const res = await fetch(cf.file); const json = await res.json(); loaded.push({ name: json.info?.name || cf.label, version: json.info?.version || "?", file: cf.file, requests: parseItems(json.item || []) }) } catch { /**/ }
      }
      setCols(loaded); setReady(true)
    })()
  }, [])

  // Load persisted tokens + history
  useEffect(() => {
    try { const s = localStorage.getItem(STORAGE_TOKENS); if (s) { const p = JSON.parse(s); setTokens(p); if (p.length > 0) setActiveToken(p[0].id) } } catch { /**/ }
    try { const h = localStorage.getItem(STORAGE_HISTORY); if (h) setHistory(JSON.parse(h)) } catch { /**/ }
  }, [])

  const saveTokens = (t: SavedToken[]) => { setTokens(t); localStorage.setItem(STORAGE_TOKENS, JSON.stringify(t)) }
  const addToken = (t: SavedToken) => { const next = [t, ...tokens]; saveTokens(next); setActiveToken(t.id) }
  const removeToken = (id: string) => { const next = tokens.filter(t => t.id !== id); saveTokens(next); if (activeToken === id) setActiveToken(next[0]?.id || "") }

  const currentToken = tokens.find(t => t.id === activeToken)?.token || token
  const currentTokenInfo = tokens.find(t => t.id === activeToken)
  const col = cols[activeCol]
  const folders = useMemo(() => col ? [...new Set(col.requests.map(r => r.folder))] : [], [col])
  const visibleReqs = useMemo(() => col && openFolder ? col.requests.filter(r => r.folder === openFolder) : [], [col, openFolder])

  // Pick API → open in current tab or make new
  const pick = (req: PostmanReq) => {
    updateTab(tab.id, { name: req.name, method: req.method, path: req.path, body: req.body ? pretty(req.body) : "", result: null, vars: {} })
  }

  // New tab from API
  const openInNewTab = (req: PostmanReq) => {
    const t = makeTab(req)
    setTabs(prev => [...prev, t]); setActiveTab(t.id)
  }

  // Send
  const send = async () => {
    const resolvedPath = applyVars(tab.path, tab.vars)
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
      let parsed: any
      if (tab.body.trim()) { try { parsed = JSON.parse(tab.body) } catch { toast.error("Invalid JSON"); return } }
      const res = await fire({ baseUrl: base, token: currentToken, endpoint: resolvedPath, method: tab.method, body: parsed }).unwrap()
      updateTab(tab.id, { result: res.data })
      const entry: HistoryItem = { method: tab.method, path: resolvedPath, status: res.data.response.status, time: res.data.response.time, at: Date.now(), reqBody: parsed, resBody: res.data.response.body }
      const h = [entry, ...history].slice(0, 50)
      setHistory(h); localStorage.setItem(STORAGE_HISTORY, JSON.stringify(h))
    } catch { toast.error("Request failed") }
  }

  // Replay from history
  const replay = (h: HistoryItem) => {
    const t = makeTab()
    t.name = `${h.method} ${h.path.split("/").pop()}`; t.method = h.method; t.path = h.path
    t.body = h.reqBody ? JSON.stringify(h.reqBody, null, 2) : ""
    t.result = { request: { method: h.method, url: h.path, headers: {}, body: h.reqBody }, response: { status: h.status, time: h.time, headers: {}, body: h.resBody } }
    setTabs(prev => [...prev, t]); setActiveTab(t.id); setShowHistory(false)
  }

  // Close tab
  const closeTab = (id: string) => {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex(t => t.id === id)
    const next = tabs.filter(t => t.id !== id)
    setTabs(next)
    if (activeTab === id) setActiveTab(next[Math.min(idx, next.length - 1)].id)
  }

  // Resizer
  const onDragStart = (e: React.MouseEvent) => {
    e.preventDefault(); dragging.current = true
    const move = (ev: MouseEvent) => {
      if (!dragging.current || !studioRef.current) return
      const rect = studioRef.current.getBoundingClientRect()
      setSplitPct(Math.max(15, Math.min(85, ((ev.clientY - rect.top) / rect.height) * 100)))
    }
    const up = () => { dragging.current = false; document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up) }
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", up)
  }

  const vars = extractVars(tab.path)

  if (!ready) return <div className="flex items-center justify-center h-full"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 shrink-0 bg-secondary/5">
        <h2 className="text-sm font-semibold tracking-tight shrink-0">API Playground</h2>

        {/* Version segmented control */}
        <div className="inline-flex rounded-md border border-border bg-secondary/40 p-0.5 ml-2">
          {cols.map((c, i) => (
            <button key={c.file} onClick={() => { setActiveCol(i); setOpenFolder("") }} className={cn("px-3 py-1 rounded text-[10px] font-medium transition-all", activeCol === i ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>{c.name}</button>
          ))}
        </div>

        <div className="flex-1" />

        {/* History */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/50 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all">
              <History className="h-3 w-3" /><span>History</span>{history.length > 0 && <Badge variant="secondary" className="text-[8px] h-4 px-1">{history.length}</Badge>}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-sm max-h-[60vh] overflow-hidden flex flex-col">
            <DialogHeader><DialogTitle className="text-sm">Request History</DialogTitle></DialogHeader>
            <div className="flex-1 overflow-y-auto -mx-6 px-6"><HistoryPanel items={history} onReplay={replay} /></div>
          </DialogContent>
        </Dialog>

        {/* Auth */}
        <Dialog open={tokenOpen} onOpenChange={setTokenOpen}>
          <DialogTrigger asChild>
            <button className={cn("flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all text-[11px] font-medium", currentTokenInfo ? "border-primary/30 bg-primary/5 text-primary" : "border-border/50 text-muted-foreground hover:bg-secondary/40")}>
              <Key className="h-3 w-3" />{currentTokenInfo ? <span className="truncate max-w-[80px]">{currentTokenInfo.name}</span> : "Auth"}
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xs"><DialogHeader><DialogTitle className="text-sm">Auth Tokens</DialogTitle></DialogHeader><TokenManager tokens={tokens} activeId={activeToken} onSelect={id => { setActiveToken(id); setTokenOpen(false) }} onAdd={addToken} onRemove={removeToken} /></DialogContent>
        </Dialog>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Left — API browser */}
        <div className="w-[260px] shrink-0 border-r border-border/50 flex flex-col bg-background">
          <div className="px-3 py-2 border-b border-border/30 shrink-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{col?.requests.length || 0} Endpoints</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {folders.map(folder => {
              const isOpen = openFolder === folder
              const count = col?.requests.filter(r => r.folder === folder).length || 0
              return (
                <div key={folder}>
                  <button onClick={() => setOpenFolder(isOpen ? "" : folder)} className={cn("w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-b border-border/20", isOpen ? "bg-secondary/30" : "hover:bg-secondary/15")}>
                    <span className="text-[11px] font-medium">{folder}</span>
                    <span className="flex items-center gap-1 shrink-0"><span className="text-[9px] text-muted-foreground tabular-nums">{count}</span><ChevronDown className={cn("h-2.5 w-2.5 text-muted-foreground transition-transform duration-150", isOpen && "rotate-180")} /></span>
                  </button>
                  {isOpen && visibleReqs.map((req, i) => (
                    <button
                      key={`${req.method}-${req.path}-${i}`}
                      onClick={() => pick(req)}
                      onDoubleClick={() => openInNewTab(req)}
                      className={cn("w-full flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-left transition-all border-b border-border/10", tab.path === req.path && tab.method === req.method ? "bg-primary/8 border-l-2 border-l-primary pl-[10px]" : "hover:bg-secondary/20 border-l-2 border-l-transparent pl-[10px]")}
                      title="Double-click to open in new tab"
                    >
                      <span className={cn("text-[8px] font-bold w-8 text-center py-[1px] rounded-sm shrink-0", METHOD_COLORS[req.method])}>{req.method}</span>
                      <span className="text-[10px] font-medium truncate">{req.name}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* Right — Tabbed studio */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b border-border/50 bg-secondary/5 shrink-0 overflow-x-auto">
            {tabs.map(t => (
              <div key={t.id} onClick={() => setActiveTab(t.id)} className={cn("flex items-center gap-1.5 px-3 py-1.5 border-r border-border/30 cursor-pointer transition-all min-w-0 max-w-[180px] group", activeTab === t.id ? "bg-background border-b-2 border-b-primary -mb-[1px]" : "text-muted-foreground hover:bg-secondary/30")}>
                <span className={cn("text-[8px] font-bold shrink-0 rounded-sm px-1 py-[1px]", METHOD_COLORS[t.method])}>{t.method}</span>
                <span className="text-[10px] font-medium truncate">{t.name}</span>
                {t.result && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot(t.result.response.status))} />}
                {tabs.length > 1 && <button onClick={e => { e.stopPropagation(); closeTab(t.id) }} className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all shrink-0"><X className="h-2.5 w-2.5" /></button>}
              </div>
            ))}
            <button onClick={() => { const t = makeTab(); setTabs(prev => [...prev, t]); setActiveTab(t.id) }} className="px-2 py-1.5 text-muted-foreground hover:text-foreground transition-colors shrink-0"><Plus className="h-3 w-3" /></button>
          </div>

          {/* Studio */}
          <div ref={studioRef} className="flex-1 min-h-0 flex flex-col">
            {/* URL bar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 shrink-0">
              <Badge className={cn("text-[9px] font-bold shrink-0 rounded-sm", METHOD_COLORS[tab.method])}>{tab.method}</Badge>
              <Input value={tab.path} onChange={e => updateTab(tab.id, { path: e.target.value })} className="h-7 font-mono text-[11px] border-0 bg-secondary/30 focus-visible:ring-1 px-2" />
              <Button onClick={send} disabled={isLoading} size="sm" className="rounded-full px-4 h-7 bg-foreground text-background hover:bg-foreground/90 shrink-0 text-[11px]">
                {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><span className="mr-1">Send</span><ArrowRight className="h-2.5 w-2.5" /></>}
              </Button>
            </div>

            {/* Variable inputs */}
            {vars.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/20 bg-amber-500/5 shrink-0 flex-wrap">
                <span className="text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider shrink-0">Variables:</span>
                {vars.map(v => (
                  <div key={v} className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">{`{{${v}}}`}</span>
                    <Input
                      value={tab.vars[v] || ""}
                      onChange={e => updateTab(tab.id, { vars: { ...tab.vars, [v]: e.target.value } })}
                      placeholder={v}
                      className="h-6 w-24 text-[10px] font-mono border-amber-500/20 bg-background px-1.5"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Active token */}
            {currentTokenInfo && (
              <div className="flex items-center gap-1.5 px-3 py-1 border-b border-border/15 bg-primary/3 shrink-0">
                <Key className="h-2.5 w-2.5 text-primary" />
                <span className="text-[9px] text-primary font-medium">{currentTokenInfo.name}</span>
                <Badge variant="outline" className="text-[7px] h-3.5">{currentTokenInfo.role}</Badge>
              </div>
            )}

            {/* Request pane */}
            <div style={{ height: `${splitPct}%` }} className="min-h-0 flex flex-col">
              <div className="px-3 py-1 border-b border-border/20 bg-secondary/5 shrink-0">
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Request</span>
              </div>
              {tab.method !== "GET" ? (
                <textarea
                  value={tab.body}
                  onChange={e => updateTab(tab.id, { body: e.target.value })}
                  className="flex-1 w-full px-3 py-2 bg-[#0C0C0C] text-[#cbd5e1] text-[11px] font-mono resize-none focus:outline-none leading-relaxed"
                  spellCheck={false}
                  placeholder="// JSON body"
                />
              ) : (
                <div className="flex-1 flex items-center justify-center bg-secondary/5"><p className="text-[10px] text-muted-foreground">GET — no body</p></div>
              )}
            </div>

            {/* Drag handle */}
            <div onMouseDown={onDragStart} className="h-[5px] border-y border-border/30 bg-secondary/20 cursor-row-resize flex items-center justify-center shrink-0 hover:bg-primary/10 transition-colors">
              <GripVertical className="h-2.5 w-2.5 text-muted-foreground/30 rotate-90" />
            </div>

            {/* Response pane */}
            <div style={{ height: `${100 - splitPct}%` }} className="min-h-0 flex flex-col">
              {!tab.result ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-1.5">
                    <div className="mx-auto w-6 h-6 rounded-full border border-muted-foreground/15 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 animate-pulse" /></div>
                    <p className="text-[10px] text-muted-foreground/50">Awaiting response…</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Response status bar */}
                  <div className={cn("flex items-center gap-2 px-3 py-1.5 border-b border-border/30 shrink-0", statusBg(tab.result.response.status))}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", statusDot(tab.result.response.status))} />
                    <span className={cn("text-sm font-bold tabular-nums", statusColor(tab.result.response.status))}>{tab.result.response.status}</span>
                    <TimeBadge ms={tab.result.response.time} />
                    <span className="text-[9px] text-muted-foreground font-mono truncate">{tab.result.request.method} {tab.result.request.url?.replace(/^https?:\/\/[^/]+/, "")}</span>
                  </div>
                  {/* Response body */}
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ResponseView data={tab.result.response.body} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
