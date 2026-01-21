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
        if (!icon && !suffix) {
            return (
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-lg border bg-background px-3 py-2",
                        "text-sm placeholder:text-muted-foreground",
                        "border-input transition-colors",
                        "hover:border-border-hover",
                        "focus-visible:outline-none focus-visible:border-foreground",
                        "focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-10",
                        suffix && "pr-10",
                        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                    )}
                    ref={ref}
                    {...props}
                />
            )
        }

        return (
            <div className={cn("relative w-full", className)}>
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-foreground">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border bg-background px-3 py-2",
                        "text-sm ring-offset-background placeholder:text-muted-foreground/60",
                        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
                        "border-input transition-colors duration-150",
                        "hover:border-border-hover",
                        "focus-visible:outline-none focus-visible:border-border-active",
                        "focus-visible:ring-1 focus-visible:ring-ring",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        icon && "pl-10",
                        suffix && "pr-10",
                        error && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive"
                    )}
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
