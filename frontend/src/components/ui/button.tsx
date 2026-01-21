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
        // Base styles - Vercel button
        "relative inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "select-none outline-none disabled:pointer-events-none disabled:opacity-50",
        
        // Focus
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        
        // Variant: Default
        "data-[variant=default]:bg-foreground data-[variant=default]:text-background",
        "data-[variant=default]:hover:bg-foreground/90",
        
        // Variant: Secondary
        "data-[variant=secondary]:bg-secondary data-[variant=secondary]:text-secondary-foreground",
        "data-[variant=secondary]:border data-[variant=secondary]:border-border",
        "data-[variant=secondary]:hover:bg-secondary/80",
        
        // Variant: Outline
        "data-[variant=outline]:border data-[variant=outline]:border-border data-[variant=outline]:bg-transparent",
        "data-[variant=outline]:hover:bg-secondary",
        
        // Variant: Ghost
        "data-[variant=ghost]:hover:bg-secondary",
        
        // Variant: Link
        "data-[variant=link]:text-foreground data-[variant=link]:underline-offset-4",
        "data-[variant=link]:hover:underline",
        
        // Variant: Destructive
        "data-[variant=destructive]:bg-destructive data-[variant=destructive]:text-destructive-foreground",
        "data-[variant=destructive]:hover:bg-destructive/90",
        
        // Size: Default (40px)
        "data-[size=default]:h-10 data-[size=default]:px-4 data-[size=default]:text-sm data-[size=default]:gap-2",
        
        // Size: Small (32px)
        "data-[size=sm]:h-8 data-[size=sm]:px-3 data-[size=sm]:text-xs data-[size=sm]:gap-1.5",
        
        // Size: Large (48px)
        "data-[size=lg]:h-12 data-[size=lg]:px-6 data-[size=lg]:text-sm data-[size=lg]:gap-2",
        
        // Size: Icon
        "data-[size=icon]:h-10 data-[size=icon]:w-10 data-[size=icon]:p-0",
        
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="geist-spinner">
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
            <div />
          </div>
        </span>
      )}
      <span className={cn("flex items-center", loading && "opacity-0")}>
        {prefix}
        {children}
        {suffix}
      </span>
    </Comp>
  )
})

Button.displayName = "Button"

export { Button }
