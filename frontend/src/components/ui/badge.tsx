import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        // Monochrome variants - Geist style
        default: "border-transparent bg-foreground text-background",
        secondary: "border border-border bg-secondary text-secondary-foreground",
        outline: "text-foreground border-border bg-transparent",
        
        // Semantic status colors (keep colorful)
        destructive: "badge-error",
        success: "badge-success",
        warning: "badge-warning",
        info: "badge-info",
    }

    return (
        <div
            className={cn(
                // Base Geist badge styles
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                "transition-colors focus:outline-none focus:ring-1 focus:ring-ring",
                variants[variant],
                className
            )}
            {...props}
        />
    )
}

export { Badge }
