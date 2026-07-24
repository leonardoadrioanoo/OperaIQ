"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <div className="peer h-7 w-12 rounded-full border border-input bg-muted p-0.5 transition-colors peer-checked:border-primary peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:content-[''] after:block after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
    </label>
  )
}

export { Switch }
