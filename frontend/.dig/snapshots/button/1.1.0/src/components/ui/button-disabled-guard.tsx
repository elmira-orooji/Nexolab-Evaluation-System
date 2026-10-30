"use client"

import * as React from "react"

import { Slot } from "@/lib/primitives/slot"

function ButtonDisabledGuard({
  children,
  onClick: _onClick,
  onKeyDown: _onKeyDown,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <Slot
      {...props}
      tabIndex={-1}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
    >
      {children}
    </Slot>
  )
}

export { ButtonDisabledGuard }
