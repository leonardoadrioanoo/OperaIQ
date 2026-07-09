"use client"

import * as React from "react"
import { Radio } from "@base-ui/react/radio"

import { cn } from "@/lib/utils"

function RadioGroup({ className, children, ...props }: any) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { RadioGroup }
