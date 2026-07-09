"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: any) {
  return (
    <SwitchPrimitive
      className={cn(
        "peer inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-input bg-muted p-0.5 transition-colors outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        className
      )}
      {...props}
    />
  )
}

export { Switch }
