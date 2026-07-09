import * as React from "react"

import { cn } from "@/lib/utils"

function Select({ className, children, ...props }: React.ComponentPropsWithoutRef<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-input bg-input px-3 text-sm text-foreground transition-colors outline-none appearance-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export { Select }
