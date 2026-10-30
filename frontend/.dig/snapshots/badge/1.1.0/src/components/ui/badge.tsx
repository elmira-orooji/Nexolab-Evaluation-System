import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Slot } from "@/lib/primitives/slot"

/**
 * رنگ نشان هم مثل Button/Alert با متغیرهای CSS منتقل می‌شود: --badge/--badge-foreground
 * برای حالت پررنگ و --badge-subtle/--badge-subtle-foreground برای پس‌زمینهٔ ملایم (از
 * توکن‌های `-subtle`). محور `color` فقط این چهار متغیر را ست می‌کند و محور `variant`
 * تصمیم می‌گیرد رنگ کجا بنشیند. افزودن رنگ تازه = یک سطر در محور color، نه یک ردیف
 * compound به‌ازای هر حالت بصری.
 */
const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border font-medium leading-none whitespace-nowrap transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-(color:--badge) text-(color:--badge-foreground) [a&]:hover:brightness-95 dark:[a&]:hover:brightness-125",
        secondary:
          "border-transparent bg-secondary text-(color:--badge) [a&]:hover:bg-secondary/80",
        // تمِ تیره: ته‌رنگِ ملایمِ همان رنگ با متنِ رنگیِ روشن، نه زمینهٔ اشباعِ تیره.
        soft: "border-transparent bg-(color:--badge-subtle) text-(color:--badge-subtle-foreground) [a&]:hover:bg-(color:--badge-subtle)/70 dark:bg-[color-mix(in_oklab,var(--badge)_18%,var(--background))] dark:text-(color:--badge)",
        outline:
          "border-(color:--badge)/40 bg-background text-(color:--badge) [a&]:hover:bg-(color:--badge) [a&]:hover:text-(color:--badge-foreground)",
      },
      color: {
        default:
          "[--badge:var(--color-foreground)] [--badge-foreground:var(--color-background)] [--badge-subtle:var(--color-muted)] [--badge-subtle-foreground:var(--color-foreground)]",
        primary:
          "[--badge:var(--color-primary)] [--badge-foreground:var(--color-primary-foreground)] [--badge-subtle:var(--color-primary-subtle)] [--badge-subtle-foreground:var(--color-primary-subtle-foreground)]",
        success:
          "[--badge:var(--color-success)] [--badge-foreground:var(--color-success-foreground)] [--badge-subtle:var(--color-success-subtle)] [--badge-subtle-foreground:var(--color-success-subtle-foreground)]",
        warning:
          "[--badge:var(--color-warning)] [--badge-foreground:var(--color-warning-foreground)] [--badge-subtle:var(--color-warning-subtle)] [--badge-subtle-foreground:var(--color-warning-subtle-foreground)]",
        destructive:
          "[--badge:var(--color-destructive)] [--badge-foreground:var(--color-destructive-foreground)] [--badge-subtle:var(--color-destructive-subtle)] [--badge-subtle-foreground:var(--color-destructive-subtle-foreground)]",
        info: "[--badge:var(--color-info)] [--badge-foreground:var(--color-info-foreground)] [--badge-subtle:var(--color-info-subtle)] [--badge-subtle-foreground:var(--color-info-subtle-foreground)]",
        violet:
          "[--badge:var(--color-violet)] [--badge-foreground:var(--color-violet-foreground)] [--badge-subtle:var(--color-violet-subtle)] [--badge-subtle-foreground:var(--color-violet-subtle-foreground)]",
        indigo:
          "[--badge:var(--color-indigo)] [--badge-foreground:var(--color-indigo-foreground)] [--badge-subtle:var(--color-indigo-subtle)] [--badge-subtle-foreground:var(--color-indigo-subtle-foreground)]",
        cyan: "[--badge:var(--color-cyan)] [--badge-foreground:var(--color-cyan-foreground)] [--badge-subtle:var(--color-cyan-subtle)] [--badge-subtle-foreground:var(--color-cyan-subtle-foreground)]",
        orange:
          "[--badge:var(--color-orange)] [--badge-foreground:var(--color-orange-foreground)] [--badge-subtle:var(--color-orange-subtle)] [--badge-subtle-foreground:var(--color-orange-subtle-foreground)]",
        pink:
          "[--badge:var(--color-pink)] [--badge-foreground:var(--color-pink-foreground)] [--badge-subtle:var(--color-pink-subtle)] [--badge-subtle-foreground:var(--color-pink-subtle-foreground)]",
      },
      size: {
        default: "h-5 min-w-5 px-2 text-xs/none tabular-nums",
        sm: "h-4 min-w-4 px-1 text-[10px]/none tabular-nums [&>svg]:size-2.5",
        lg: "h-7 min-w-7 px-2.5 text-sm/none tabular-nums [&>svg]:size-3.5",
      },
      dot: {
        true: "",
      },
      placement: {
        "top-end":
          "absolute top-0 end-0 z-10 -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 group-data-[shape=circle]/badge-anchor:top-[14.65%] group-data-[shape=circle]/badge-anchor:end-[14.65%]",
        "top-start":
          "absolute top-0 start-0 z-10 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 group-data-[shape=circle]/badge-anchor:top-[14.65%] group-data-[shape=circle]/badge-anchor:start-[14.65%]",
        "bottom-end":
          "absolute bottom-0 end-0 z-10 translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 group-data-[shape=circle]/badge-anchor:bottom-[14.65%] group-data-[shape=circle]/badge-anchor:end-[14.65%]",
        "bottom-start":
          "absolute bottom-0 start-0 z-10 translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 group-data-[shape=circle]/badge-anchor:bottom-[14.65%] group-data-[shape=circle]/badge-anchor:start-[14.65%]",
      },
    },
    compoundVariants: [
      // رنگ پیش‌فرض = ظاهر تاریخی هر واریانت، نه رنگِ foreground.
      {
        variant: "default",
        color: "default",
        class: "bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
      },
      {
        variant: "secondary",
        color: "default",
        class:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
      },
      {
        variant: "soft",
        color: "default",
        class: "bg-muted text-foreground [a&]:hover:bg-muted/70",
      },
      {
        variant: "outline",
        color: "default",
        class:
          "border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
      // بدون متن، نشان به یک نقطهٔ کوچک توپر تبدیل می‌شود؛ اندازه‌اش تابع محور
      // size است اما هم‌قد نسخهٔ متن‌دار نمی‌شود — چون placement با درصدِ اندازهٔ
      // خودِ Badge جابه‌جا می‌شود، نقطهٔ کوچک خودش را دقیقاً روی لبهٔ لنگر می‌نشاند.
      { dot: true, size: "sm", class: "size-2 min-w-0 gap-0 p-0" },
      { dot: true, size: "default", class: "size-2.5 min-w-0 gap-0 p-0" },
      { dot: true, size: "lg", class: "size-3 min-w-0 gap-0 p-0" },
    ],
    defaultVariants: {
      variant: "default",
      color: "default",
      size: "default",
    },
  }
)

type BadgeProps = Omit<React.ComponentProps<"span">, "color"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }

function Badge({
  className,
  variant = "default",
  color = "default",
  size = "default",
  placement,
  dot,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span"
  const isDot = dot ?? (children === undefined || children === null || children === "")
  const isPrimitiveLabel =
    typeof children === "string" || typeof children === "number"
  const labelText = isPrimitiveLabel ? String(children).trim() : ""
  const isNumericLabel =
    isPrimitiveLabel && /^[0-9۰-۹٠-٩.,:+\-/%\s]+$/.test(labelText)
  const needsOpticalOffset =
    isPrimitiveLabel &&
    (/[A-Za-z]/.test(labelText) || isNumericLabel)

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-dot={isDot ? "true" : undefined}
      data-placement={placement}
      data-optical-offset={needsOpticalOffset ? "true" : undefined}
      className={cn(
        badgeVariants({
          variant,
          color,
          size,
          dot: isDot,
          placement,
          className,
        })
      )}
      {...props}
    >
      {isDot ? null : needsOpticalOffset ? (
        <span
          data-slot="badge-label"
          data-optical-offset="true"
          className={isNumericLabel ? "translate-y-0.5" : "translate-y-px"}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </Comp>
  )
}

/**
 * قاب موقعیت‌دهی برای نشانی که باید روی گوشهٔ یک عنصر دیگر (مثل آواتار) بنشیند؛
 * فرزند اول عنصر لنگر است و Badge با placement روی گوشهٔ آن قرار می‌گیرد.
 */
type BadgeAnchorProps = React.ComponentProps<"span"> & {
  shape?: "rect" | "circle"
}

function BadgeAnchor({
  className,
  shape = "rect",
  ...props
}: BadgeAnchorProps) {
  return (
    <span
      data-slot="badge-anchor"
      data-shape={shape}
      className={cn(
        "group/badge-anchor relative inline-flex shrink-0 [&[data-shape=circle]>[data-slot=badge][data-placement=top-end]]:top-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=top-end]]:end-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=top-start]]:top-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=top-start]]:start-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=bottom-end]]:bottom-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=bottom-end]]:end-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=bottom-start]]:bottom-[14.65%] [&[data-shape=circle]>[data-slot=badge][data-placement=bottom-start]]:start-[14.65%]",
        className
      )}
      {...props}
    />
  )
}

export {
  Badge,
  BadgeAnchor,
  badgeVariants,
  type BadgeProps,
  type BadgeAnchorProps,
}
