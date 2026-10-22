"use client"

import * as React from "react"

type AnyProps = Record<string, unknown>

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") ref(node)
      else (ref as React.MutableRefObject<T | null>).current = node
    }
  }
}

function composeEventHandlers<E>(
  ours?: (event: E) => void,
  theirs?: (event: E) => void
) {
  return (event: E) => {
    ours?.(event)
    if (!(event as { defaultPrevented?: boolean }).defaultPrevented) {
      theirs?.(event)
    }
  }
}

const EVENT_HANDLER_RE = /^on[A-Z]/
const REACT_LAZY_TYPE = Symbol.for("react.lazy")

/**
 * وقتی یک عنصر کلاینت (مثل Link از next/link) از میان یک مرز
 * سرور-به-کلاینت به‌عنوان children رد می‌شود، ترنسپایلر گاهی به‌جایش یک
 * ارجاع react.lazy از پیش برطرف‌شده می‌فرستد، نه خودِ عنصر. این تابع همان
 * لفاف را باز می‌کند تا Children.only گیج نشود.
 */
function unwrapLazyChildren(children: unknown): unknown {
  const lazy = children as {
    $$typeof?: symbol
    _payload?: { status?: string; value?: unknown }
    _init?: (payload: unknown) => unknown
  } | null
  if (lazy && typeof lazy === "object" && lazy.$$typeof === REACT_LAZY_TYPE) {
    // موقع رندر سرور، این مرجع lazy معمولاً تا وقتی صداش نزنیم به‌صورت
    // pending می‌ماند حتی اگر مقدارش الان در دسترس باشد. با صدا زدن _init
    // (همان کاری که خودِ ری‌اکت موقع رندر یک تایپ lazy می‌کند) یا مقدار را
    // فوری می‌گیریم یا Promise واقعی‌اش پرتاب می‌شود تا Suspense بالادستی
    // منتظرش بماند و دوباره رندر کند.
    if (lazy._payload?.status !== "fulfilled" && lazy._init) {
      lazy._init(lazy._payload)
    }
    if (lazy._payload?.status === "fulfilled") {
      return unwrapLazyChildren(lazy._payload.value)
    }
  }
  return children
}

/**
 * ادغام props فرزند روی props اسلات: رویدادها ترکیب می‌شوند (هر دو صدا زده
 * می‌شوند)، className به هم می‌چسبد، style ادغام می‌شود، بقیه‌ی مقادیر فرزند
 * برنده‌اند.
 */
function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps, ...childProps }

  for (const key in childProps) {
    const slotValue = slotProps[key]
    const childValue = childProps[key]

    if (EVENT_HANDLER_RE.test(key)) {
      merged[key] =
        slotValue && childValue
          ? composeEventHandlers(slotValue as never, childValue as never)
          : (childValue ?? slotValue)
    } else if (key === "className") {
      merged[key] = [slotValue, childValue].filter(Boolean).join(" ")
    } else if (key === "style") {
      merged[key] = { ...(slotValue as object), ...(childValue as object) }
    }
  }

  return merged
}

/**
 * پریمیتیو Slot برای الگوی asChild: به‌جای رندر یک عنصر DOM
 * جدا، props/ref خودش را روی تک فرزندش می‌نشاند.
 */
const Slot = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  function Slot({ children, ...slotProps }, forwardedRef) {
    const child = React.Children.only(
      unwrapLazyChildren(children)
    ) as React.ReactElement

    // در React 19 ref یک prop معمولی است؛ element.ref حذف شده و خواندنش
    // خودش هشدار deprecation می‌دهد، برای همین فقط از props می‌خوانیم.
    const childRef = (child.props as AnyProps)?.ref

    const merged = mergeProps(slotProps, (child.props ?? {}) as AnyProps)
    // ref فقط وقتی هست که کسی واقعاً ref داده باشد. اگر همیشه یک تابعِ ترکیبی بفرستیم، کامپوننتی مثل
    // PopoverContent یا SelectContent که زیرِ <ControlSizeProvider asChild> نشسته آن را در props می‌گیرد و
    // {...props} رفِ داخلیِ خودش را بازنویسی می‌کند؛ موقعیتِ پنل حساب نمی‌شد و پنل پنهان می‌ماند.
    if (forwardedRef || childRef) {
      merged.ref = composeRefs(forwardedRef, childRef as React.Ref<HTMLElement>)
    }
    return React.cloneElement(child, merged)
  }
)

export { Slot }
