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
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/40 focus-visible:outline-none focus:border-foreground/50 focus:ring-1 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-200",
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            )
        }

        return (
            <div className={cn("relative group w-full", className)}>
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors group-focus-within:text-foreground">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/40 focus-visible:outline-none focus:border-foreground/50 focus:ring-1 focus:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
                        icon && "pl-10",
                        suffix && "pr-10",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-200"
                    )}
                    ref={ref}
                    {...props}
                />
                {suffix && (
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
                       {suffix}
                   </div>
                )}
            </div>
        )
    }
)
Input.displayName = "Input"

export { Input }
