"use client"

import * as React from "react"

import {
  computePosition,
  type Align,
  type PositionResult,
  type Side,
} from "@/lib/primitives/positioning"

/**
 * موقعیت زندهٔ یک عنصر شناور نسبت به دکمهٔ بازکننده‌اش را نگه می‌دارد: اول
 * باز شدن حساب می‌کند و با اسکرول/تغییر اندازه به‌روز می‌نگه‌دارد.
 */
function useFloatingPosition(
  triggerRef: React.RefObject<HTMLElement | null>,
  floatingRef: React.RefObject<HTMLElement | null>,
  open: boolean,
  {
    side = "bottom",
    align = "center",
    sideOffset = 4,
    collisionPadding = 8,
  }: {
    side?: Side
    align?: Align
    sideOffset?: number
    collisionPadding?: number
  }
): (PositionResult & { triggerWidth: number }) | null {
  const [computed, setComputed] = React.useState<
    (PositionResult & { triggerWidth: number }) | null
  >(null)

  React.useLayoutEffect(() => {
    if (!open) return

    // ref هدف ممکن است در همین کامیت، یک تیک بعد از این افکت متصل شود
    // (وقتی presence حین رندر فعال می‌شود)؛ چند فریم تلاش دوباره می‌کنیم
    // قبل از اینکه واقعاً بی‌خیال شویم.
    let resizeObserver: ResizeObserver | undefined
    let rafId: number | undefined
    let cancelled = false

    function update() {
      const trigger = triggerRef.current
      const floating = floatingRef.current
      if (!trigger || !floating) return
      const triggerRect = trigger.getBoundingClientRect()
      // عمداً به‌جای floating.getBoundingClientRect(): آن، اندازهٔ فعلیِ
      // *تبدیل‌شده* (transform) را برمی‌گرداند. وقتی محتوا تازه باز شده،
      // انیمیشن ورودش (zoom-in-95) از scale(0.95) شروع می‌شود و این افکت
      // درست همان فریمِ اول (پیش از رسیدن به scale(1)) اجرا می‌شود — یعنی
      // عرض واقعی را ۵٪ کوچک‌تر اندازه می‌گیرد و دیگر هیچ‌وقت (چون تغییرِ
      // transform باعث ResizeObserver نمی‌شود) خودش را اصلاح نمی‌کند.
      // offsetWidth/Height اندازهٔ چیدمانی (بدون transform) است، همیشه درست.
      const floatingWidth = floating.offsetWidth
      const floatingHeight = floating.offsetHeight
      const position = computePosition({
        trigger: {
          x: triggerRect.left,
          y: triggerRect.top,
          width: triggerRect.width,
          height: triggerRect.height,
        },
        floating: { width: floatingWidth, height: floatingHeight },
        side,
        align,
        sideOffset,
        collisionPadding,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        isRtl: trigger.closest('[dir="rtl"]') !== null,
      })
      // triggerWidth از همین اندازه‌گیری می‌آید، نه یک getBoundingClientRect
      // جداگانه در رندر مصرف‌کننده — وگرنه اگر فونت وب بعد از اولین رندر
      // عرض trigger را عوض کند (که برای Vazirmatn/فالبک پیش می‌آید)، آن
      // مقدار جدا افتاده و minWidth محتوا برای همیشه با اندازهٔ واقعی
      // trigger ناهم‌خوان می‌ماند.
      setComputed({ ...position, triggerWidth: triggerRect.width })
    }

    function setup() {
      if (cancelled) return
      const trigger = triggerRef.current
      const floating = floatingRef.current
      if (!trigger || !floating) {
        rafId = requestAnimationFrame(setup)
        return
      }

      update()
      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(trigger)
      resizeObserver.observe(floating)
      window.addEventListener("scroll", update, true)
      window.addEventListener("resize", update)

      // اگر وقتِ اولین اندازه‌گیری، فونتِ وب (Vazirmatn) هنوز جایگزینِ
      // فالبک نشده باشد، عرض trigger/floating بعداً یک‌باره عوض می‌شود —
      // بدون این خط، آن تغییر فقط وقتی خودش را اصلاح می‌کند که کاربر یک
      // رویدادِ دیگر (اسکرول/resize) راه بیندازد.
      document.fonts?.ready?.then(() => {
        if (!cancelled) update()
      })
    }

    setup()

    return () => {
      cancelled = true
      if (rafId !== undefined) cancelAnimationFrame(rafId)
      resizeObserver?.disconnect()
      window.removeEventListener("scroll", update, true)
      window.removeEventListener("resize", update)
    }
  }, [open, side, align, sideOffset, collisionPadding, triggerRef, floatingRef])

  return open ? computed : null
}

export { useFloatingPosition }
