import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "neutral"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        // Primary pill — teal
        default: "bg-primary/10 text-primary border-transparent font-semibold",
        // Neutral warm gray
        secondary: "border border-border bg-secondary text-secondary-foreground font-medium",
        // Bordered outline
        outline: "text-foreground border-border bg-transparent font-medium",
        // Neutral muted
        neutral: "badge-neutral",
        // Semantic status colors
        destructive: "badge-error",
        success: "badge-success",
        warning: "badge-warning",
        info: "badge-info",
    }

    return (
        <div
            className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px] font-semibold",
                "transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
