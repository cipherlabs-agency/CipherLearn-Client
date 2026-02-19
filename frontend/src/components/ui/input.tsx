import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    icon?: React.ReactNode
    suffix?: React.ReactNode
    error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, icon, suffix, error, ...props }, ref) => {
        const baseStyles = cn(
            "flex w-full rounded-lg border bg-background px-3 py-2",
            "text-[13.5px] placeholder:text-muted-foreground/60",
            "border-input transition-all duration-150",
            "hover:border-border-hover",
            "focus-visible:outline-none focus-visible:border-primary",
            "focus-visible:ring-2 focus-visible:ring-ring/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-9",
            suffix && "pr-9",
            error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
        )

        if (!icon && !suffix) {
            return (
                <input
                    type={type}
                    className={cn(baseStyles, "h-10", className)}
                    ref={ref}
                    {...props}
                />
            )
        }

        return (
            <div className={cn("relative w-full", className)}>
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(baseStyles, "h-10")}
                    ref={ref}
                    {...props}
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                        {suffix}
                    </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
