import * as React from "react"

import { cn } from "@/lib/utils"

function Readonly({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "min-h-[46px] w-full rounded-xl border border-border/60 bg-background shadow-sm px-3 py-2 text-sm text-white transition-colors",
        className
      )}
      {...props}
    />
  )
}

export { Readonly }
