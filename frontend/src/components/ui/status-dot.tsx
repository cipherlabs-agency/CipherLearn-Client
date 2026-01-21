"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusDotVariants = cva(
    "inline-flex shrink-0 rounded-full",
    {
        variants: {
            variant: {
                default: "bg-foreground",
                success: "bg-emerald-500",
                warning: "bg-amber-500",
                error: "bg-red-500",
                info: "bg-blue-500",
                pending: "bg-blue-500",
                paid: "bg-emerald-500",
                partial: "bg-amber-500",
                overdue: "bg-red-500",
            },
            size: {
                xs: "h-1.5 w-1.5",
                sm: "h-2 w-2",
                md: "h-2.5 w-2.5",
                lg: "h-3 w-3",
            },
            pulse: {
                true: "animate-pulse",
                false: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "sm",
            pulse: false,
        },
    }
)

export interface StatusDotProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof statusDotVariants> {
    label?: string
}

export function StatusDot({
    className,
    variant,
    size,
    pulse,
    label,
    ...props
}: StatusDotProps) {
    if (label) {
        return (
            <span className="inline-flex items-center gap-2">
                <span
                    className={cn(statusDotVariants({ variant, size, pulse }), className)}
                    {...props}
                />
                <span className="text-xs font-medium text-muted-foreground capitalize">
                    {label}
                </span>
            </span>
        )
    }

    return (
        <span
            className={cn(statusDotVariants({ variant, size, pulse }), className)}
            {...props}
        />
    )
}

// Status badge with dot (Geist style)
const statusBadgeVariants = cva(
    "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
    {
        variants: {
            variant: {
                default: "bg-foreground/5 border-foreground/10 text-foreground",
                success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                warning: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                error: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
                info: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
                pending: "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
                paid: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                partial: "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
                overdue: "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof statusBadgeVariants> {
    dotSize?: "xs" | "sm" | "md" | "lg"
    pulse?: boolean
}

export function StatusBadge({
    className,
    variant,
    children,
    dotSize = "xs",
    pulse = false,
    ...props
}: StatusBadgeProps) {
    return (
        <span
            className={cn(statusBadgeVariants({ variant }), className)}
            {...props}
        >
            <StatusDot variant={variant} size={dotSize} pulse={pulse} />
            {children}
        </span>
    )
}
