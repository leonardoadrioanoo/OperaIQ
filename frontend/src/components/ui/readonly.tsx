import * as React from "react"

import { cn } from "@/lib/utils"

function Readonly({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-border/60 bg-background px-3 text-sm text-white",
        "flex items-center transition-colors",
        className
      )}
      {...props}
    />
  )
}

export { Readonly }
