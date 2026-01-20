"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "xs" | "sm" | "md" | "lg"
}

const sizeClasses = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
}

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "xs" | "sm" | "md" | "lg"
}

const spinnerScales = {
    xs: "scale-75",
    sm: "scale-100",
    md: "scale-125",
    lg: "scale-150",
}

// Geist Spinner - Authentic Vercel "Bars" Spinner
export function Spinner({ size = "sm", className, ...props }: SpinnerProps) {
    return (
        <div 
            className={cn(
                "geist-spinner", 
                spinnerScales[size],
                className
            )} 
            {...props}
        >
            {[...Array(12)].map((_, i) => (
                <div key={i} />
            ))}
        </div>
    )
}

// Geist Loading Dots
interface LoadingDotsProps extends React.HTMLAttributes<HTMLSpanElement> {
    size?: "sm" | "md" | "lg"
}

const dotSizeClasses = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
}

export function LoadingDots({ size = "md", className, ...props }: LoadingDotsProps) {
    return (
        <span
            className={cn("inline-flex items-center gap-1", className)}
            {...props}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={cn(
                        "rounded-full bg-current animate-[loading-dots_1.4s_infinite_both]",
                        dotSizeClasses[size]
                    )}
                    style={{
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
        </span>
    )
}
