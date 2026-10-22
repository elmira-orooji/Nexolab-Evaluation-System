"use client"

import * as React from "react"

/**
 * حالت کنترل‌شونده/غیرکنترل‌شونده: اگر value داده شود، فقط onChange صدا زده
 * می‌شود و state داخلی نادیده گرفته می‌شود؛ وگرنه state داخلی منبع حقیقت
 * است.
 */
export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: {
  value: T | undefined
  defaultValue: T
  onChange?: (value: T) => void
}): [T, (value: T) => void] {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : uncontrolled

  const setValue = React.useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next)
      onChange?.(next)
    },
    [isControlled, onChange]
  )

  return [current, setValue]
}
