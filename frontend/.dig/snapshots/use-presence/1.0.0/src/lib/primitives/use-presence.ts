"use client"

import * as React from "react"

function getAnimationName(node: HTMLElement | null): string {
  if (!node) return "none"
  return getComputedStyle(node).animationName || "none"
}

/**
 * نگه‌داشتن گره در DOM تا انیمیشن CSS خروج (data-state=closed) تمام شود،
 * سپس واقعاً جدا کردنش؛ برای Accordion/Collapsible که هنگام بسته‌شدن انیمیشن ارتفاع دارند.
 */
export function usePresence(present: boolean): {
  shouldRender: boolean
  ref: (node: HTMLElement | null) => void
} {
  const [shouldRender, setShouldRender] = React.useState(present)
  const [prevPresent, setPrevPresent] = React.useState(present)
  const nodeRef = React.useRef<HTMLElement | null>(null)

  const setRef = React.useCallback((node: HTMLElement | null) => {
    nodeRef.current = node
  }, [])

  // ورود بلافاصله حین رندر تطبیق داده می‌شود (الگوی رسمی «تنظیم state حین
  // رندر» ری‌اکت)، نه با یک افکت جدا — چیزی برای اشتراک/پاک‌سازی نیست.
  if (present !== prevPresent) {
    setPrevPresent(present)
    if (present) setShouldRender(true)
  }

  React.useEffect(() => {
    if (present || !shouldRender) return

    const node = nodeRef.current
    // خواندن استایل محاسبه‌شده از DOM — یک سیستم خارجی — پس اینجا (نه حین
    // رندر) درست است؛ خودِ setState فقط داخل رویداد/تایمر بعدی صدا زده می‌شود.
    const animationName = getAnimationName(node)
    if (!node || animationName === "none") {
      const raf = requestAnimationFrame(() => setShouldRender(false))
      return () => cancelAnimationFrame(raf)
    }

    const durationMs =
      parseFloat(getComputedStyle(node).animationDuration || "0") * 1000
    const finish = () => setShouldRender(false)

    node.addEventListener("animationend", finish, { once: true })
    node.addEventListener("animationcancel", finish, { once: true })
    // محافظ: اگر به هر دلیلی رویداد شلیک نشد (مثلاً prefers-reduced-motion).
    const timeout = window.setTimeout(finish, durationMs + 50)

    return () => {
      node.removeEventListener("animationend", finish)
      node.removeEventListener("animationcancel", finish)
      window.clearTimeout(timeout)
    }
  }, [present, shouldRender])

  return { shouldRender, ref: setRef }
}
