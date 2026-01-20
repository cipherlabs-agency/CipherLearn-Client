import { ButtonHTMLAttributes, forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "prefix"> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
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
  
  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      data-variant={variant}
      data-size={size}
      className={cn(
        // Base styles - Geist button foundation
        "relative inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all duration-150",
        "select-none outline-none ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        
        // Focus states
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        
        // Variant: Default (Primary - Black/White)
        "data-[variant=default]:bg-foreground data-[variant=default]:text-background",
        "data-[variant=default]:hover:bg-foreground/90 data-[variant=default]:active:bg-foreground/80",
        
        // Variant: Secondary (Light gray with border)
        "data-[variant=secondary]:bg-secondary data-[variant=secondary]:text-secondary-foreground",
        "data-[variant=secondary]:border data-[variant=secondary]:border-border",
        "data-[variant=secondary]:hover:bg-muted data-[variant=secondary]:hover:border-border-hover",
        
        // Variant: Outline (Border only)
        "data-[variant=outline]:border data-[variant=outline]:border-border data-[variant=outline]:bg-background",
        "data-[variant=outline]:hover:bg-accent data-[variant=outline]:hover:border-border-hover",
        "data-[variant=outline]:active:bg-muted",
        
        // Variant: Ghost (No background)
        "data-[variant=ghost]:hover:bg-accent data-[variant=ghost]:hover:text-accent-foreground",
        "data-[variant=ghost]:active:bg-muted",
        
        // Variant: Link (Text only)
        "data-[variant=link]:text-foreground data-[variant=link]:underline-offset-4",
        "data-[variant=link]:hover:underline",
        
        // Variant: Destructive (Error/danger)
        "data-[variant=destructive]:bg-destructive data-[variant=destructive]:text-destructive-foreground",
        "data-[variant=destructive]:hover:bg-destructive/90",
        
        // Size: Default (40px height - Geist standard)
        "data-[size=default]:h-10 data-[size=default]:px-4 data-[size=default]:text-[13px]",
        
        // Size: Small (32px height)
        "data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:text-xs",
        
        // Size: Large (48px height)
        "data-[size=lg]:h-12 data-[size=lg]:px-6 data-[size=lg]:text-sm",
        
        // Size: Icon (square 40px)
        "data-[size=icon]:h-10 data-[size=icon]:w-10 data-[size=icon]:p-0",
        
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
      <span className={cn("flex items-center gap-2", loading && "opacity-0")}>
        {prefix}
        {children}
        {suffix}
      </span>
    </Comp>
  )
})

Button.displayName = "Button"

export { Button }
