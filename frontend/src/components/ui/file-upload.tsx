import * as React from "react"

import { cn } from "@/lib/utils"

function FileUpload({ className, ...props }: React.ComponentPropsWithoutRef<"input">) {
  return (
    <input
      type="file"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-input bg-input px-3 text-sm text-foreground transition-colors outline-none file:cursor-pointer file:rounded-md file:border file:border-input file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground file:transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { FileUpload }
