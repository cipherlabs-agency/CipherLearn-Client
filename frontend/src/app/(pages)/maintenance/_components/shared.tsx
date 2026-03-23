"use client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export function StatusBadge({ passed }: { passed: boolean }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
      passed
        ? "text-emerald-700 dark:text-emerald-400"
        : "text-red-700 dark:text-red-400"
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", passed ? "bg-emerald-500" : "bg-red-500")} />
      {passed ? "PASS" : "FAIL"}
    </span>
  )
}

export function TimeBadge({ ms }: { ms: number }) {
  const c = ms < 200
    ? "text-emerald-600 dark:text-emerald-400"
    : ms < 500
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400"
  return <span className={cn("text-[11px] font-mono tabular-nums", c)}>{ms}ms</span>
}

export function StatCards({ items }: { items: { label: string; value: number | string; color?: string }[] }) {
  return (
    <div className={cn("grid gap-3", items.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
      {items.map(({ label, value, color }) => (
        <Card key={label} className="p-4 text-center">
          <p className={cn("text-2xl font-bold tabular-nums tracking-tight", color)}>{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-wider">{label}</p>
        </Card>
      ))}
    </div>
  )
}

export const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  POST: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  PUT: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  PATCH: "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  DELETE: "bg-red-500/15 text-red-700 dark:text-red-400",
}
