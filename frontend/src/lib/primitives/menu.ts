import * as React from "react"

/**
 * منطق مشترک بین منوهای مبتنی بر نقش (DropdownMenu، ContextMenu، Menubar):
 * رویداد onSelect قابل‌جلوگیری، پیمایش کیبورد با roving focus، و فوکوس
 * اولین آیتم با تلاش دوباره. هر سه کامپوننت همین یک نسخه را به اشتراک
 * می‌گذارند تا رفتارشان یکسان بماند.
 */

/**
 * رویداد سبک برای onSelect: مثل رویداد واقعی preventDefault دارد، تا اگر
 * مصرف‌کننده صداش بزند منو باز بماند، بدون پیاده‌سازی کامل رابط Event
 * مرورگر.
 */
export type MenuSelectEvent = {
  preventDefault: () => void
  defaultPrevented: boolean
}

export function createSelectEvent(): MenuSelectEvent {
  const evt: MenuSelectEvent = {
    defaultPrevented: false,
    preventDefault: () => {
      evt.defaultPrevented = true
    },
  }
  return evt
}

/** آیتم‌های فعال (منو یا زیرمنو) داخل نزدیک‌ترین content، به ترتیب DOM. */
export function getMenuItems(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([data-disabled]), [role="menuitemcheckbox"]:not([data-disabled]), [role="menuitemradio"]:not([data-disabled])'
    )
  ).filter((el) => el.closest('[role="menu"]') === container)
}

/**
 * فوکوس روی گزینهٔ انتخاب‌شده (اگر منو رادیو/چک‌باکس دارد) وگرنه اولین
 * آیتم، با چند بار تلاش دوباره اگر container هنوز در commit جاری متصل
 * نشده (presence حین رندر باز شده و ref یک تیک دیرتر می‌رسد) — همان
 * مشکلی که در useFloatingPosition هم بود. تا وقتی container واقعاً
 * visible نشده هم صبر می‌کنیم: موتور موقعیت‌یابی تا محاسبهٔ جا خودش را
 * با visibility:hidden پنهان نگه می‌دارد، و مرورگر روی عنصر پنهان فوکوس
 * نمی‌گذارد — تلاش زودهنگام بی‌صدا شکست می‌خورد.
 *
 * قبلاً همیشه اولین آیتم فوکوس می‌گرفت، حتی وقتی یکی دیگر واقعاً checked
 * بود (مثلِ منوی تمِ روشن/تیره): کاربر با باز کردنِ دوباره‌ی منو، هایلایتِ
 * فوکوس را روی «روشن» می‌دید و فکر می‌کرد همان انتخابِ فعلی است، حتی در
 * تمِ تیره. یک <select> بومی هم گزینهٔ فعلی را هایلایت می‌کند، نه همیشه
 * اولی را.
 */
export function focusFirstItemOnceReady(
  getContainer: () => HTMLElement | null,
  maxAttempts = 10
): () => void {
  let cancelled = false
  let attempts = 0

  function attempt() {
    if (cancelled) return
    const container = getContainer()
    const items = getMenuItems(container)
    const checked = items.find((item) => item.getAttribute("aria-checked") === "true")
    const target = checked ?? items[0]
    const isVisible =
      container && getComputedStyle(container).visibility !== "hidden"
    if (target && isVisible) {
      target.focus()
      // خودِ focus() گاهی بی‌صدا جواب نمی‌دهد (لایه‌بندی/layout هنوز کامل
      // نشده)؛ اگر واقعاً نگرفت، به‌جای رها کردن دوباره تلاش می‌کنیم.
      if (document.activeElement === target) return
    }
    attempts++
    if (attempts < maxAttempts) requestAnimationFrame(attempt)
  }

  attempt()
  return () => {
    cancelled = true
  }
}

/**
 * پیمایش کیبورد مشترک بین منوی اصلی و زیرمنو: بالا/پایین، Home/End، و
 * تایپ‌اِهد (تایپ حرف اول برای پرش به آیتم بعدی که با آن شروع می‌شود).
 */
export function useMenuTypeahead() {
  const bufferRef = React.useRef("")
  const timerRef = React.useRef<number | undefined>(undefined)

  return function handleTypeahead(key: string, items: HTMLElement[]) {
    if (key.length !== 1 || key === " ") return false
    window.clearTimeout(timerRef.current)
    bufferRef.current += key.toLowerCase()
    timerRef.current = window.setTimeout(() => {
      bufferRef.current = ""
    }, 600)

    const match = items.find((item) =>
      item.textContent?.trim().toLowerCase().startsWith(bufferRef.current)
    )
    match?.focus()
    return true
  }
}

export function handleMenuKeyDown(
  event: React.KeyboardEvent,
  container: HTMLElement | null,
  typeahead: ReturnType<typeof useMenuTypeahead>
) {
  const items = getMenuItems(container)
  if (items.length === 0) return

  const currentIndex = items.indexOf(document.activeElement as HTMLElement)

  if (event.key === "ArrowDown") {
    event.preventDefault()
    items[(currentIndex + 1 + items.length) % items.length]?.focus()
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    items[(currentIndex - 1 + items.length) % items.length]?.focus()
  } else if (event.key === "Home") {
    event.preventDefault()
    items[0]?.focus()
  } else if (event.key === "End") {
    event.preventDefault()
    items[items.length - 1]?.focus()
  } else if (typeahead(event.key, items)) {
    event.preventDefault()
  }
}
