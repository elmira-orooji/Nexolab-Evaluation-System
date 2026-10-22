import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Slot } from "@/lib/primitives/slot"
import { autoControlHeight, autoControlText } from "@/components/ui/control-size"
import { ButtonDisabledGuard } from "@/components/ui/button-disabled-guard"

/**
 * رنگ دکمه با چهار متغیر CSS منتقل می‌شود: --btn/--btn-foreground برای حالت
 * توپر و --btn-subtle/--btn-subtle-foreground برای پس‌زمینهٔ ملایمِ حالت‌های
 * ghost/bordered/flat (همان جفت رنگِ از‌پیش‌سنجیده‌ای که Badge هم برای soft
 * دارد). محور `variant` تصمیم می‌گیرد این رنگ‌ها کجا بنشینند.
 *
 * سود این کار: افزودن یک رنگ تازه = یک سطر در محور color، نه یک ردیف
 * compoundVariant به‌ازای هر واریانت.
 *
 * ردیف‌های compoundVariants فقط برای رنگ پیش‌فرض‌اند تا ظاهر شش واریانت
 * اصلی دقیقاً همانی بماند که بود.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none",
    "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
    // غیرفعال با تغییر رنگ نشان داده می‌شود، نه opacity: دکمهٔ نیمه‌شفاف
    // رنگ پشتش را نشان می‌دهد و روی هر زمینه‌ای یک رنگ دیگر می‌شود.
    // انتخاب‌گر :disabled ویژگی بیشتری از کلاس رنگِ واریانت دارد، پس بدون
    // وابستگی به ترتیب کلاس‌ها برنده است.
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:text-placeholder disabled:shadow-none disabled:brightness-100",
    "aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:text-placeholder aria-disabled:shadow-none",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // اسپینرِ حالت بارگذاری یک شبه‌عنصر است، نه یک آیکون؛ به همین دلیل در هر
    // چهار فریم‌ورک بدون هیچ کد اضافه‌ای یکسان کار می‌کند.
    "data-[loading=true]:pointer-events-none",
    // اینتراکشن press: دکمه هنگام فشردن کمی کوچک می‌شود؛ با reduced-motion نه.
    "motion-safe:data-[interaction=press]:active:scale-[0.96]",
    "data-[loading=true]:before:size-4 data-[loading=true]:before:shrink-0 data-[loading=true]:before:animate-spin",
    "data-[loading=true]:before:rounded-full data-[loading=true]:before:border-2 data-[loading=true]:before:border-current data-[loading=true]:before:border-e-transparent",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-(color:--btn) text-(color:--btn-foreground) hover:brightness-95 dark:hover:brightness-125 disabled:bg-muted aria-disabled:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:brightness-95 dark:hover:brightness-125 disabled:bg-muted aria-disabled:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-95 dark:hover:brightness-125 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 disabled:bg-muted aria-disabled:bg-muted",
        // قابِ خنثی و hover ملایم؛ پرشدنِ سیاهِ کامل روی hover حسِ قدیمی می‌داد.
        outline:
          "border border-border bg-background text-(color:--btn) shadow-control hover:border-input hover:bg-accent disabled:border-border aria-disabled:border-border",
        bordered:
          "border-2 border-(color:--btn) bg-transparent text-(color:--btn) hover:bg-(color:--btn-subtle) disabled:border-border aria-disabled:border-border",
        ghost: "text-(color:--btn) hover:bg-(color:--btn-subtle)",
        // پس‌زمینهٔ ملایمِ توپر از --btn-subtle می‌آید (همان جفت رنگ/کنتراستِ
        // از‌پیش‌سنجیده‌ای که Badge هم برای soft استفاده می‌کند)، نه یک تینتِ
        // opacity که کنتراست متنش دستی و شکننده باشد.
        flat: "bg-(color:--btn-subtle) text-(color:--btn-subtle-foreground) hover:brightness-95 dark:hover:brightness-110 disabled:bg-muted aria-disabled:bg-muted",
        faded:
          "border border-border bg-muted text-(color:--btn) hover:bg-accent",
        shadow:
          "bg-(color:--btn) text-(color:--btn-foreground) shadow-lg shadow-(color:--btn)/40 hover:brightness-95 dark:hover:brightness-125 disabled:bg-muted aria-disabled:bg-muted",
        link: "text-(color:--btn) underline-offset-4 hover:underline",
      },
      color: {
        default:
          "[--btn:var(--color-foreground)] [--btn-foreground:var(--color-background)] [--btn-subtle:var(--color-muted)] [--btn-subtle-foreground:var(--color-foreground)]",
        primary:
          "[--btn:var(--color-primary)] [--btn-foreground:var(--color-primary-foreground)] [--btn-subtle:var(--color-primary-subtle)] [--btn-subtle-foreground:var(--color-primary-subtle-foreground)]",
        success:
          "[--btn:var(--color-success)] [--btn-foreground:var(--color-success-foreground)] [--btn-subtle:var(--color-success-subtle)] [--btn-subtle-foreground:var(--color-success-subtle-foreground)]",
        warning:
          "[--btn:var(--color-warning)] [--btn-foreground:var(--color-warning-foreground)] [--btn-subtle:var(--color-warning-subtle)] [--btn-subtle-foreground:var(--color-warning-subtle-foreground)]",
        destructive:
          "[--btn:var(--color-destructive)] [--btn-foreground:var(--color-destructive-foreground)] [--btn-subtle:var(--color-destructive-subtle)] [--btn-subtle-foreground:var(--color-destructive-subtle-foreground)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        xl: "h-12 rounded-md px-6 text-base has-[>svg]:px-5",
        // بدون prop اندازه: از نزدیک‌ترین ControlSizeProvider پیروی می‌کند و
        // اگر نباشد دقیقاً همان default است.
        auto: [
          autoControlHeight,
          autoControlText,
          "px-[var(--control-btn-px,calc(var(--spacing)*4))] py-2 has-[>svg]:px-[var(--control-btn-px-icon,calc(var(--spacing)*3))]",
        ],
        // بدون ControlSizeProvider همان ۳۶ است؛ داخلش هم‌قدِ فیلد و دکمهٔ متنی می‌شود.
        icon: "size-[var(--control-h,calc(var(--spacing)*9))]",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-12",
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      // رنگ پیش‌فرض = ظاهر خنثای پایه، نه رنگِ foreground.
      {
        variant: "default",
        color: "default",
        class:
          "bg-primary text-primary-foreground hover:brightness-95 dark:hover:brightness-125",
      },
      {
        variant: "outline",
        color: "default",
        // border-input و bg-input در تم تیره یک توکن‌اند؛ پرشدگی باید توپُر
        // بماند، پس به‌جای کم‌رنگ کردن آن، حاشیه را در تم تیره جدا از
        // accent/input نگه می‌داریم.
        class:
          "border-border text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input dark:border-foreground/25 dark:hover:brightness-125",
      },
      {
        variant: "bordered",
        color: "default",
        class: "border-border text-foreground hover:bg-accent",
      },
      {
        variant: "ghost",
        color: "default",
        class:
          "text-foreground hover:bg-accent hover:text-accent-foreground",
      },
      {
        variant: "flat",
        color: "default",
        class: "bg-muted text-foreground hover:bg-accent",
      },
      {
        variant: "shadow",
        color: "default",
        class:
          "bg-primary text-primary-foreground shadow-primary/40 hover:brightness-95 dark:hover:brightness-125",
      },
      {
        variant: "link",
        color: "default",
        class: "text-primary",
      },
      // در دکمهٔ فقط‌آیکونی جا برای اسپینر و آیکون با هم نیست.
      {
        size: ["icon", "icon-sm", "icon-lg", "icon-xl"],
        class: "data-[loading=true]:[&>svg]:hidden",
      },
    ],
    defaultVariants: {
      variant: "default",
      // دکمهٔ اصلی رنگِ برند می‌گیرد؛ color="default" همان سیاه/سفیدِ قبلی است.
      color: "primary",
      size: "default",
    },
  }
)

type ButtonProps = Omit<React.ComponentProps<"button">, "color"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** اسپینر نشان می‌دهد، دکمه را غیرفعال می‌کند و aria-busy می‌گذارد. */
    loading?: boolean
    /** واکنش به فشردن؛ press دکمه را هنگام فشردن کمی کوچک می‌کند. */
    interaction?: "none" | "press"
  }

const PERSIAN_TEXT = /[\u0600-\u06FF]/

/**
 * فونتِ فارسی زیرِ خطِ پایه جا برای دنبالهٔ حروفِ فارسی نگه می‌دارد؛ برچسبِ
 * تمام‌لاتین (Claude Code، Export) بی‌آن دنباله حدود ۰.۱۳em بالاتر از وسط دیده
 * می‌شود. فقط وقتی هیچ متنِ فارسی‌ای در برچسب نیست، متنِ لاتین کمی پایین می‌آید.
 */
function centerLatin(children: React.ReactNode): React.ReactNode {
  const parts = React.Children.toArray(children)
  if (parts.some((part) => typeof part === "string" && PERSIAN_TEXT.test(part))) return children
  if (!parts.some((part) => typeof part === "string" && part.trim())) return children
  return parts.map((part, index) =>
    typeof part === "string" && part.trim() ? (
      <span key={index} className="inline-block translate-y-[0.12em]">
        {part}
      </span>
    ) : (
      part
    )
  )
}

function Button({
  className,
  variant = "default",
  color = "default",
  size: sizeProp,
  radius,
  fullWidth,
  loading = false,
  disabled,
  asChild = false,
  interaction = "none",
  children,
  onClick,
  onKeyDown,
  tabIndex,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"
  const size = sizeProp ?? "auto"
  const isDisabled = disabled || loading
  const resolvedClassName = cn(
    buttonVariants({ variant, color, size, radius, fullWidth, className })
  )

  if (asChild && isDisabled) {
    return (
      <ButtonDisabledGuard
        data-slot="button"
        data-variant={variant}
        data-color={color}
        data-size={size}
        data-loading={loading ? "true" : undefined}
        aria-busy={loading || undefined}
        aria-disabled="true"
        className={resolvedClassName}
        {...props}
      >
        {children}
      </ButtonDisabledGuard>
    )
  }

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-loading={loading ? "true" : undefined}
      data-interaction={isDisabled ? undefined : interaction}
      aria-busy={loading || undefined}
      // فرزند asChild معمولاً a است و disabled را نمی‌شناسد؛ برای همان حالت
      // aria-disabled می‌گذاریم تا هم صفحه‌خوان بفهمد هم کلاس‌های
      // aria-disabled ظاهر غیرفعال را بسازند.
      aria-disabled={asChild && isDisabled ? true : undefined}
      disabled={asChild ? undefined : isDisabled}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={resolvedClassName}
      {...props}
    >
      {asChild ? children : centerLatin(children)}
    </Comp>
  )
}

export { Button, buttonVariants, type ButtonProps }
