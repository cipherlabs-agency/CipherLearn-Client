import { ButtonHTMLAttributes, forwardRef } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "relative inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-150 select-none outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
  {
    variants: {
      variant: {
        // Primary — deep teal (teacher's main action)
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:shadow-none",
        // Secondary — warm gray
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        // Outline — warm bordered
        outline: "border border-border bg-transparent hover:bg-secondary text-foreground hover:border-border-hover",
        // Ghost — subtle hover
        ghost: "text-foreground hover:bg-secondary",
        // Link
        link: "text-primary underline-offset-4 hover:underline",
        // Destructive
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
        // Warm amber (accent actions)
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow-md active:shadow-none",
      },
      size: {
        default: "h-10 px-4 text-sm gap-2",
        sm: "h-8 px-3 text-[13px] gap-1.5",
        lg: "h-11 px-6 text-sm gap-2",
        xl: "h-12 px-8 text-base gap-2",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "prefix">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
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
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="geist-spinner">
            <div /><div /><div /><div /><div /><div />
            <div /><div /><div /><div /><div /><div />
          </div>
        </span>
      )}
      <span className={cn("flex items-center gap-[inherit]", loading && "opacity-0")}>
        {prefix}
        {children}
        {suffix}
      </span>
    </Comp>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
