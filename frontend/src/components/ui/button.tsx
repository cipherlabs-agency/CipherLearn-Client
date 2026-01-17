import { ButtonHTMLAttributes, forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "prefix"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  // Geist specific props
  loading?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading,
  prefix,
  suffix,
  children,
  disabled,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"
  
  // Mapping old variants to Geist Visuals
  // default -> Geist Primary (Black/White)
  // secondary -> Geist Secondary (White/Black with border)
  // outline -> Geist Secondary (Same as functionality)
  // ghost -> Geist Tertiary
  // destructive -> Geist Error
  
  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      className={cn(
        "relative inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 select-none disabled:cursor-not-allowed disabled:opacity-50 outline-none focus-visible:ring-1 focus-visible:ring-ring",
        
        "data-[variant=default]:bg-foreground data-[variant=default]:text-background data-[variant=default]:hover:bg-foreground/90",
        "data-[variant=destructive]:bg-red-500 data-[variant=destructive]:text-white data-[variant=destructive]:hover:bg-red-600",
        "data-[variant=outline]:border data-[variant=outline]:border-input data-[variant=outline]:bg-background data-[variant=outline]:hover:bg-accent data-[variant=outline]:hover:text-accent-foreground",
        "data-[variant=secondary]:bg-secondary data-[variant=secondary]:text-secondary-foreground data-[variant=secondary]:hover:bg-secondary/80",
        "data-[variant=ghost]:hover:bg-accent data-[variant=ghost]:hover:text-accent-foreground",
        "data-[variant=link]:text-primary data-[variant=link]:underline-offset-4 data-[variant=link]:hover:underline",
        
        "data-[size=default]:h-10 data-[size=default]:px-4 data-[size=default]:py-2 data-[size=default]:text-[13px]",
        "data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:text-xs",
        "data-[size=lg]:h-12 data-[size=lg]:px-8 data-[size=lg]:text-sm",
        "data-[size=icon]:h-10 data-[size=icon]:w-10",
        
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </span>
      )}
      <div className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {prefix}
        {children}
        {suffix}
      </div>
    </Comp>
  )
})

Button.displayName = "Button"

export { Button }
