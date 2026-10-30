"use client"

import * as React from "react"

/**
 * پشتهٔ لایه‌های باز، به ترتیبِ باز شدن. Select یا Popoverِ داخلِ Dialog
 * محتوایش را با Portal بیرون از Dialog می‌گذارد؛ بدونِ این پشته، کلیک روی
 * گزینهٔ Select برای Dialog «بیرون» حساب می‌شد و Dialog بسته می‌شد. حالا فقط
 * بالاترین لایه با کلیک بیرون یا Escape بسته می‌شود.
 */
const layerStack: React.RefObject<HTMLElement | null>[] = []

/**
 * بستن یک لایهٔ شناور با Escape یا کلیک بیرون از آن. کلیکی که خودِ لایه را باز کرده
 * نباید بلافاصله ببندتش، برای همین شنوندهٔ کلیک بیرون یک تیک دیرتر وصل
 * می‌شود.
 */
function useDismissableLayer({
  ref,
  ignoreRef,
  enabled,
  onDismiss,
  dismissOnOutsideClick = true,
  dismissOnEscape = true,
}: {
  ref: React.RefObject<HTMLElement | null>
  /**
   * عنصر دومی که کلیک رویش هم «بیرون» حساب نشود — مثل دکمهٔ بازکننده.
   * بدونش، کلیک دوم روی همان دکمه برای بستن، یک تناقض می‌سازد: pointerdown
   * (که زودتر از click شلیک می‌شود) چون هدف داخل ref نیست لایه را می‌بندد،
   * بعد click خودِ دکمه با toggle (!open) دوباره بازش می‌کند — یعنی از
   * دید کاربر، کلیک روی دکمه برای بستن اصلاً اثر نمی‌کند.
   */
  ignoreRef?: React.RefObject<HTMLElement | null>
  enabled: boolean
  onDismiss: (reason: "escape" | "outside-click") => void
  dismissOnOutsideClick?: boolean
  dismissOnEscape?: boolean
}) {
  React.useEffect(() => {
    if (!enabled) return
    layerStack.push(ref)
    const isTop = () => layerStack[layerStack.length - 1] === ref

    function onKeyDown(event: KeyboardEvent) {
      if (dismissOnEscape && event.key === "Escape" && isTop()) {
        event.preventDefault()
        onDismiss("escape")
      }
    }

    function onPointerDown(event: PointerEvent) {
      if (!dismissOnOutsideClick) return
      const target = event.target as Node
      if (ignoreRef?.current?.contains(target)) return
      // لایه‌ای رویِ این باز است: کلیکِ بیرون مالِ همان لایهٔ بالایی است.
      if (!isTop()) return
      if (ref.current && !ref.current.contains(target)) {
        onDismiss("outside-click")
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown)
    }, 0)

    return () => {
      const index = layerStack.lastIndexOf(ref)
      if (index !== -1) layerStack.splice(index, 1)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("pointerdown", onPointerDown)
      window.clearTimeout(timer)
    }
  }, [enabled, onDismiss, dismissOnOutsideClick, dismissOnEscape, ref, ignoreRef])
}

export { useDismissableLayer }
