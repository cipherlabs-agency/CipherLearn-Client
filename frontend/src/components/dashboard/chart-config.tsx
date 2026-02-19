"use client"


// ==================== TYPES ====================

export type DurationFilter = "today" | "week" | "month" | "3months" | "6months" | "year"

export interface DurationOption {
    value: DurationFilter
    label: string
    days: number
    months: number
}

export const DURATION_OPTIONS: DurationOption[] = [
    { value: "today", label: "Today", days: 1, months: 0 },
    { value: "week", label: "7 Days", days: 7, months: 0 },
    { value: "month", label: "30 Days", days: 30, months: 1 },
    { value: "3months", label: "3 Months", days: 90, months: 3 },
    { value: "6months", label: "6 Months", days: 180, months: 6 },
    { value: "year", label: "This Year", days: 365, months: 12 },
]

export function getDurationParams(filter: DurationFilter): { days: number; months: number } {
    const option = DURATION_OPTIONS.find(o => o.value === filter)
    return option ? { days: option.days, months: option.months } : { days: 30, months: 1 }
}

// ==================== CHART STYLES (Vercel-inspired) ====================

export const CHART_COLORS = {
    primary: "hsl(var(--primary))",          // Teal
    secondary: "hsl(var(--muted-foreground))",
    success: "hsl(142, 71%, 45%)",            // Green
    warning: "hsl(38, 92%, 50%)",             // Amber
    border: "hsl(var(--border))",
    background: "hsl(var(--background))",
    muted: "hsl(var(--muted))",
} as const

export const CHART_MARGINS = { top: 8, right: 8, left: -16, bottom: 0 }

// Vercel-style axis configuration
export const axisConfig = {
    tick: { fontSize: 10, fill: "hsl(var(--muted-foreground))" },
    axisLine: { stroke: "hsl(var(--border))" },
    tickLine: false as const,
}

// Vercel-style grid configuration
export const gridConfig = {
    strokeDasharray: "3 3",
    stroke: "hsl(var(--border))",
    vertical: false,
}

// ==================== CUSTOM TOOLTIP (Vercel-style) ====================

interface ChartTooltipPayload {
    name: string
    value: number
    color: string
    dataKey: string
    payload: Record<string, unknown>
}

interface CustomTooltipProps {
    payload?: ChartTooltipPayload[]
    label?: string | number
    active?: boolean
    labelFormatter?: (label: string) => string
    valueFormatter?: (value: number, name: string) => string
}

export function ChartTooltip({
    active,
    payload,
    label,
    labelFormatter,
    valueFormatter
}: CustomTooltipProps) {
    if (!active || !payload?.length) return null

    const labelString = label !== undefined ? String(label) : ""
    const formattedLabel = labelFormatter ? labelFormatter(labelString) : labelString

    return (
        <div className="rounded-lg border border-border/50 bg-background/95 backdrop-blur-sm px-3 py-2 shadow-xl">
            {formattedLabel && (
                <p className="text-[13.5px] font-medium text-foreground mb-1.5">
                    {formattedLabel}
                </p>
            )}
            <div className="space-y-1">
                {payload.map((entry, index) => {
                    const formattedValue = valueFormatter
                        ? valueFormatter(entry.value, entry.name)
                        : entry.value.toLocaleString()

                    return (
                        <div key={index} className="flex items-center gap-2 text-[13.5px]">
                            <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-muted-foreground">{entry.name}:</span>
                            <span className="font-medium text-foreground ml-auto tabular-nums">
                                {formattedValue}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ==================== DURATION FILTER COMPONENT ====================

interface DurationFilterProps {
    value: DurationFilter
    onChange: (value: DurationFilter) => void
    className?: string
}

export function DurationFilterSelect({ value, onChange, className = "" }: DurationFilterProps) {
    return (
        <div className={`inline-flex items-center rounded-lg border border-border bg-secondary/60 p-0.5 ${className}`}>
            {DURATION_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onChange(option.value)}
                    className={`px-2.5 py-1 text-[13.5px] font-semibold rounded-md transition-all ${
                        value === option.value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}

// Compact version for smaller spaces
export function DurationFilterDropdown({ value, onChange, className = "" }: DurationFilterProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value as DurationFilter)}
            className={`h-7 px-2 text-[13.5px] font-medium rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring ${className}`}
        >
            {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    )
}

// ==================== CURSOR STYLE (Vercel uses vertical line on hover) ====================

export const cursorStyle = {
    stroke: "hsl(var(--muted-foreground))",
    strokeWidth: 1,
    strokeDasharray: "4 4",
}

// For area/line charts - no fill, just line
export const verticalCursorStyle = {
    fill: "transparent",
    stroke: "hsl(var(--border))",
    strokeWidth: 1,
}
