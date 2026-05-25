import { cn } from "@/lib/utils"

interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "text-foreground border-foreground",
  }

  return (
    <span className={cn(
      "inline-flex items-center text-[10px] px-2 py-0.5 rounded-full border font-medium",
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  )
}
