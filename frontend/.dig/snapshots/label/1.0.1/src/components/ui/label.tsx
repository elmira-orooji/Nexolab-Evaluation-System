"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Label({
  className,
  onMouseDown,
  ...props
}: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      onMouseDown={(event) => {
        // با دو/سه‌بار کلیک روی خود برچسب، انتخاب متن راه نیفتد — کاربر
        // می‌خواهد کنترل مرتبط فوکوس بگیرد، نه اینکه متن برچسب سلکت شود.
        if (!event.defaultPrevented && event.detail > 1) {
          event.preventDefault()
        }
        onMouseDown?.(event)
      }}
      className={cn(
        "flex items-center gap-2 text-sm leading-5 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-placeholder peer-disabled:cursor-not-allowed peer-disabled:text-placeholder",
        className
      )}
      {...props}
    />
  )
}

export { Label }
