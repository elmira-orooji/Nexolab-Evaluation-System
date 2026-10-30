import * as React from "react"

import { cn } from "@/lib/utils"
import { Slot } from "@/lib/primitives/slot"

/**
 * یک اندازه برای همهٔ کنترل‌های یک ناحیه.
 *
 * مشکل واقعی: ایجنتی که یک فرم یا نوار ابزار می‌ساخت می‌خواست همه‌چیز ۴۸
 * پیکسل باشد، ولی Select و DatePicker و SearchField آن اندازه را نداشتند؛
 * پس با className ارتفاع دلخواه داد و هر کنترل یک ارتفاع گرفت.
 *
 * این Provider فقط چند متغیر CSS می‌گذارد و هیچ state یا context ری‌اکتی
 * ندارد؛ پس در Server Component هم کار می‌کند و تو در تو هم درست است
 * (نزدیک‌ترین Provider برنده است، چون متغیر CSS از نزدیک‌ترین والد ارث
 * می‌رسد). هر کنترلی که prop اندازه نگرفته باشد این متغیرها را می‌خواند و
 * اگر Providerی بالایش نباشد به اندازهٔ default برمی‌گردد. اندازهٔ صریح
 * (size="sm") همیشه بر Provider غلبه می‌کند.
 *
 *   <ControlSizeProvider size="xl" className="flex gap-2">
 *     <SearchField />
 *     <Select>…</Select>
 *     <Button>خروجی اکسل</Button>
 *   </ControlSizeProvider>
 */
type ControlSize = "sm" | "default" | "lg" | "xl"

/**
 * جدول اندازه‌ها، همان پله‌هایی که محور size تک‌تک کامپوننت‌ها دارد:
 * ارتفاع، متن، پدینگ افقی دکمه و پدینگ افقی فیلد.
 */
const controlSizeVars: Record<ControlSize, string> = {
  sm: "[--control-h:calc(var(--spacing)*8)] [--control-text:var(--text-sm)] [--control-btn-px:calc(var(--spacing)*3)] [--control-btn-px-icon:calc(var(--spacing)*2.5)] [--control-field-px:calc(var(--spacing)*2.5)]",
  default:
    "[--control-h:calc(var(--spacing)*9)] [--control-text:var(--text-sm)] [--control-btn-px:calc(var(--spacing)*4)] [--control-btn-px-icon:calc(var(--spacing)*3)] [--control-field-px:calc(var(--spacing)*3)]",
  lg: "[--control-h:calc(var(--spacing)*10)] [--control-text:var(--text-base)] [--control-btn-px:calc(var(--spacing)*6)] [--control-btn-px-icon:calc(var(--spacing)*4)] [--control-field-px:calc(var(--spacing)*4)]",
  xl: "[--control-h:calc(var(--spacing)*12)] [--control-text:var(--text-base)] [--control-btn-px:calc(var(--spacing)*6)] [--control-btn-px-icon:calc(var(--spacing)*5)] [--control-field-px:calc(var(--spacing)*4)]",
}

/**
 * همان جدول برای موبایل (زیرِ ۶۴۰ پیکسل). Tailwind کلاس را از متن می‌خواند، پس پیشوندِ max-sm:
 * این‌جا صریح نوشته شده، نه با ساختنِ رشته در زمانِ اجرا.
 */
const controlSizeVarsMobile: Record<ControlSize, string> = {
  sm: "max-sm:[--control-h:calc(var(--spacing)*8)] max-sm:[--control-text:var(--text-sm)] max-sm:[--control-btn-px:calc(var(--spacing)*3)] max-sm:[--control-btn-px-icon:calc(var(--spacing)*2.5)] max-sm:[--control-field-px:calc(var(--spacing)*2.5)]",
  default:
    "max-sm:[--control-h:calc(var(--spacing)*9)] max-sm:[--control-text:var(--text-sm)] max-sm:[--control-btn-px:calc(var(--spacing)*4)] max-sm:[--control-btn-px-icon:calc(var(--spacing)*3)] max-sm:[--control-field-px:calc(var(--spacing)*3)]",
  lg: "max-sm:[--control-h:calc(var(--spacing)*10)] max-sm:[--control-text:var(--text-base)] max-sm:[--control-btn-px:calc(var(--spacing)*6)] max-sm:[--control-btn-px-icon:calc(var(--spacing)*4)] max-sm:[--control-field-px:calc(var(--spacing)*4)]",
  xl: "max-sm:[--control-h:calc(var(--spacing)*12)] max-sm:[--control-text:var(--text-base)] max-sm:[--control-btn-px:calc(var(--spacing)*6)] max-sm:[--control-btn-px-icon:calc(var(--spacing)*5)] max-sm:[--control-field-px:calc(var(--spacing)*4)]",
}

/**
 * کلاس‌های «اندازهٔ خودکار» که کامپوننت‌ها وقتی size نگرفته‌اند می‌گذارند.
 * مقدار دوم هر var همان اندازهٔ default است تا بدون Provider چیزی عوض نشود.
 */
const autoControlHeight = "h-[var(--control-h,calc(var(--spacing)*9))]"
const autoControlText = "text-[length:var(--control-text,var(--text-sm))]"

type ControlSizeProviderProps = React.ComponentProps<"div"> & {
  size: ControlSize
  /**
   * اندازه زیرِ ۶۴۰ پیکسل. کنترلِ ثانویه‌ای که در دسکتاپ ۴۰ است روی صفحهٔ گوشی سنگین دیده
   * می‌شود؛ با mobileSize="default" در موبایل ۳۶ می‌شود. نبودنش یعنی همان size در همه‌جا.
   */
  mobileSize?: ControlSize
  /** به‌جای div، متغیرها روی تنها فرزند می‌نشینند. */
  asChild?: boolean
}

function ControlSizeProvider({
  size,
  mobileSize,
  asChild = false,
  className,
  ...props
}: ControlSizeProviderProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="control-size"
      data-control-size={size}
      className={cn(
        controlSizeVars[size],
        mobileSize && controlSizeVarsMobile[mobileSize],
        // بدون className، ظرف در چیدمان دیده نمی‌شود و فقط متغیرها را ارث می‌دهد.
        !className && !asChild && "contents",
        className
      )}
      {...props}
    />
  )
}

export {
  ControlSizeProvider,
  autoControlHeight,
  autoControlText,
  controlSizeVars,
  controlSizeVarsMobile,
  type ControlSize,
}
