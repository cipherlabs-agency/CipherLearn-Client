"use client"
import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, ChevronDown, Globe, Code2, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { useMaintenancePlaygroundMutation, type PlaygroundResult } from "@/redux/slices/maintenance/maintenanceApi"
import { METHOD_COLORS, TimeBadge } from "./shared"

// ── Types ──────────────────────────────────────────────────
interface PostmanReq { name: string; folder: string; method: string; path: string; body?: string; desc?: string }
interface PostmanCol { name: string; version: string; file: string; requests: PostmanReq[] }

const COLLECTION_FILES = [
  { file: "/postman/v.1.0.1.json", label: "Dashboard v1.0.1" },
  { file: "/postman/app.1.0.12.json", label: "App v1.0.12" },
  { file: "/postman/v.0.1.0.json", label: "Dashboard v0.1.0" },
]

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

// ── Main Component ─────────────────────────────────────────
export default function PlaygroundPanel({ token }: { token: string }) {
  const [fire, { isLoading }] = useMaintenancePlaygroundMutation()
  const [cols, setCols] = useState<PostmanCol[]>([])
  const [activeCol, setActiveCol] = useState(0)
  const [openFolder, setOpenFolder] = useState("")
  const [selected, setSelected] = useState<PostmanReq | null>(null)
  const [path, setPath] = useState("")
  const [body, setBody] = useState("")
  const [result, setResult] = useState<PlaygroundResult | null>(null)
  const [ready, setReady] = useState(false)

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

  const col = cols[activeCol]
  const folders = useMemo(() => col ? [...new Set(col.requests.map(r => r.folder))] : [], [col])
  const visibleReqs = useMemo(() => {
    if (!col || !openFolder) return []
    return col.requests.filter(r => r.folder === openFolder)
  }, [col, openFolder])

  const pick = (req: PostmanReq) => {
    setSelected(req)
    setPath(req.path)
    setBody(req.body ? prettyJson(req.body) : "")
    setResult(null)
  }

  const send = async () => {
    if (!selected && !path) return
    try {
      const base = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:8000"
      let parsed: any
      if (body.trim()) { try { parsed = JSON.parse(body) } catch { toast.error("Invalid JSON"); return } }
      const res = await fire({ baseUrl: base, token, endpoint: path, method: selected?.method || "GET", body: parsed }).unwrap()
      setResult(res.data)
    } catch { toast.error("Request failed") }
  }

  const statusColor = (s: number) =>
    s >= 200 && s < 300 ? "text-emerald-600 dark:text-emerald-400"
      : s >= 400 ? "text-red-600 dark:text-red-400"
        : "text-amber-600 dark:text-amber-400"

  const statusDot = (s: number) =>
    s >= 200 && s < 300 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
      : s >= 400 ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
        : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"

  if (!ready) return <div className="flex items-center justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight">API Playground</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Select collection → pick endpoint → send request.</p>
      </div>

      {/* Version Segmented Control */}
      <div className="inline-flex rounded-lg border border-border bg-secondary/40 p-0.5">
        {cols.map((c, i) => (
          <button
            key={c.file}
            onClick={() => { setActiveCol(i); setOpenFolder(""); setSelected(null); setResult(null) }}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-medium transition-all",
              activeCol === i
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Three-panel layout */}
      <div className="grid grid-cols-12 gap-5" style={{ minHeight: 480 }}>

        {/* LEFT — Accordion API Browser */}
        <div className="col-span-4 overflow-hidden rounded-xl border border-border bg-background">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {col?.requests.length || 0} Endpoints
            </p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
            {folders.map(folder => {
              const isOpen = openFolder === folder
              const count = col?.requests.filter(r => r.folder === folder).length || 0
              return (
                <div key={folder}>
                  <button
                    onClick={() => setOpenFolder(isOpen ? "" : folder)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors border-b border-border/50",
                      isOpen ? "bg-primary/5" : "hover:bg-secondary/50"
                    )}
                  >
                    <span className="text-xs font-medium truncate">{folder}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground tabular-nums">{count}</span>
                      <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="bg-secondary/20">
                      {visibleReqs.map((req, i) => {
                        const isActive = selected === req
                        return (
                          <button
                            key={`${req.method}-${req.path}-${i}`}
                            onClick={() => pick(req)}
                            className={cn(
                              "w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors border-b border-border/30",
                              isActive
                                ? "bg-primary/10 border-l-2 border-l-primary"
                                : "hover:bg-secondary/60 border-l-2 border-l-transparent"
                            )}
                          >
                            <span className={cn("text-[9px] font-bold w-10 text-center py-0.5 rounded", METHOD_COLORS[req.method])}>
                              {req.method}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="text-[11px] font-medium block truncate">{req.name}</span>
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT — Request / Response Studio */}
        <div className="col-span-8 flex flex-col gap-0 rounded-xl border border-border bg-background overflow-hidden">
          {!selected ? (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
                  <Code2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Select an endpoint</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Choose from the collection to begin.</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Request section */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* URL bar */}
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <Badge className={cn("text-[10px] font-bold shrink-0 rounded", METHOD_COLORS[selected.method])}>
                    {selected.method}
                  </Badge>
                  <Input
                    value={path}
                    onChange={e => setPath(e.target.value)}
                    className="h-8 font-mono text-xs border-0 bg-secondary/40 focus-visible:ring-1"
                  />
                </div>

                {/* Body editor */}
                {selected.method !== "GET" && (
                  <div className="flex-1 min-h-0 border-b border-border">
                    <div className="px-4 py-1.5 border-b border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Request Body</span>
                    </div>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full h-full min-h-[120px] max-h-[180px] px-4 py-3 bg-[#0D0D0D] dark:bg-[#0D0D0D] text-emerald-400 dark:text-emerald-400 text-xs font-mono resize-none focus:outline-none leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* Description */}
                {selected.desc && (
                  <div className="px-4 py-2 border-b border-border/50 bg-secondary/20">
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{selected.desc}</p>
                  </div>
                )}
              </div>

              {/* Send divider */}
              <div className="relative flex items-center justify-center py-2 bg-secondary/30 border-y border-border/50">
                {result && (
                  <span className="absolute left-4 flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", statusDot(result.response.status))} />
                    <span className={cn("text-sm font-bold tabular-nums", statusColor(result.response.status))}>
                      {result.response.status}
                    </span>
                    <TimeBadge ms={result.response.time} />
                  </span>
                )}
                <Button
                  onClick={send}
                  disabled={isLoading}
                  size="sm"
                  className="rounded-full px-6 h-8 bg-foreground text-background hover:bg-foreground/90 shadow-lg"
                >
                  {isLoading
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <><span className="text-xs font-medium mr-1.5">Send</span><ArrowRight className="h-3 w-3" /></>
                  }
                </Button>
              </div>

              {/* Response section */}
              <div className="flex-1 min-h-0">
                {!result ? (
                  <div className="flex items-center justify-center h-full min-h-[140px]">
                    <div className="text-center space-y-2">
                      <div className="mx-auto w-8 h-8 rounded-full border-2 border-muted-foreground/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-muted-foreground/30 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">Awaiting response...</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full max-h-[260px] overflow-y-auto">
                    <div className="px-4 py-1.5 border-b border-border/50 bg-secondary/20 sticky top-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Response</span>
                    </div>
                    <pre className="px-4 py-3 text-[11px] font-mono leading-relaxed text-foreground whitespace-pre-wrap">
                      {JSON.stringify(result.response.body, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
