"use client"

import * as React from "react"
import { createPortal } from "react-dom"

/**
 * پورتال به body (یا container دلخواه). در اولین پاس (سرور و اولین رندر
 * کلاینت) چیزی برنمی‌گرداند تا با HTML سرور یکی بماند، بعد از mount شدن
 * واقعی وارد DOM می‌شود.
 */
function Portal({
  children,
  container,
}: {
  children?: React.ReactNode
  container?: Element | null
}) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- هم‌گام‌سازی با وجود واقعی DOM پس از هیدریشن، نه آینه‌کردن یک prop.
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, container ?? document.body)
}

export { Portal }
