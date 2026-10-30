"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { normalizeArabicChars } from "@/lib/persian"

/**
 * محور variant دو حالت بصری دارد: default (سایه، حالت پیش‌فرض) و flat
 * (بدون سایه، پس‌زمینهٔ خاکستری خنثی — مناسب وقتی خودِ کارت/ظرف بیرونی از
 * قبل حاشیه یا سایه دارد و یک سایهٔ دوم روی هم تلنبار می‌شود). بدون رنگ
 * معنایی، چون رنگ فقط روی TextField معنا دارد نه روی خودِ ورودی چندخطی.
 */
const textareaVariants = cva(
  "flex field-sizing-content min-h-16 rounded-lg px-3 py-2 font-sans text-base transition-[color,background-color,border-color,box-shadow] outline-none placeholder:text-[0.9em] placeholder:text-placeholder placeholder:transition-opacity placeholder:duration-150 disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:outline-destructive aria-invalid:focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-destructive)_12%,var(--color-background))] md:text-sm dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        // border-input و bg-input در تم تیره یک توکن‌اند؛ پرشدگی باید توپُر
        // بماند، پس به‌جای کم‌رنگ کردن آن، حاشیه را در تم تیره جدا از
        // accent/input نگه می‌داریم.
        default:
          "border border-input bg-background shadow-control hover:border-foreground/35 focus-visible:border-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-foreground focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-foreground)_12%,var(--color-background))] dark:bg-input dark:border-foreground/25",
        flat: "border border-transparent bg-muted shadow-none hover:brightness-95 dark:hover:brightness-125 focus-visible:ring-ring/35",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      fullWidth: true,
    },
  }
)

type TextareaProps = Omit<React.ComponentProps<"textarea">, "onChange"> &
  VariantProps<typeof textareaVariants> & {
    /** مثل onChange ولی مستقیم مقدار متنی می‌دهد. */
    onValueChange?: (value: string) => void
    onChange?: React.ChangeEventHandler<HTMLTextAreaElement>
    /**
     * حروف عربیِ هم‌شکل با فارسی (ي، ى، ك، ة) را حین تایپ به معادل فارسی
     * تبدیل می‌کند تا کیبورد عربی و فارسی مقدار یکسانی بدهند. پیش‌فرض
     * روشن است؛ با normalizeArabic={false} خاموش می‌شود.
     */
    normalizeArabic?: boolean
    /**
     * با فوکوس (کلیک یا Tab) متن placeholder محو می‌شود تا کاربر یک بوم خالی
     * برای تایپ ببیند؛ اگر بدون تایپ بیرون برود دوباره برمی‌گردد. پیش‌فرض
     * روشن است؛ برای فیلدهایی که راهنما باید حین تایپ هم بماند
     * hidePlaceholderOnFocus={false} بدهید.
     */
    hidePlaceholderOnFocus?: boolean
  }

function Textarea({
  className,
  variant,
  fullWidth,
  onChange,
  onValueChange,
  normalizeArabic = true,
  hidePlaceholderOnFocus = true,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const element = event.currentTarget

    if (normalizeArabic) {
      const caret = element.selectionStart
      const normalized = normalizeArabicChars(element.value)
      if (normalized !== element.value) {
        const beforeCaret =
          caret === null
            ? null
            : normalizeArabicChars(element.value.slice(0, caret)).length
        element.value = normalized
        if (beforeCaret !== null) {
          element.setSelectionRange(beforeCaret, beforeCaret)
        }
      }
    }

    onValueChange?.(element.value)
    onChange?.(event)
  }

  const displayValue =
    normalizeArabic && typeof value === "string"
      ? normalizeArabicChars(value)
      : value
  const displayDefaultValue =
    normalizeArabic && typeof defaultValue === "string"
      ? normalizeArabicChars(defaultValue)
      : defaultValue

  return (
    <textarea
      data-slot="textarea"
      data-variant={variant ?? "default"}
      className={cn(
        textareaVariants({ variant, fullWidth }),
        hidePlaceholderOnFocus && "focus:placeholder:opacity-0",
        className
      )}
      onChange={handleChange}
      value={displayValue}
      defaultValue={displayDefaultValue}
      // مثل Input: دیکشنری مرورگر فارسی نیست. پیش‌فرض خاموش، ولی چون قبل از
      // spread آمده، مصرف‌کننده می‌تواند برای متن آزاد دوباره روشنش کند.
      spellCheck={false}
      {...props}
    />
  )
}

export { Textarea, textareaVariants, type TextareaProps }
