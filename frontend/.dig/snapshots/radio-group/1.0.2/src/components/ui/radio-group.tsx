"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useControllableState } from "@/lib/primitives/use-controllable-state"
import {
  rendersIdleIndicator,
  selectionIndicatorInteraction,
  selectionRootInteraction,
  type SelectionInteraction,
} from "@/lib/primitives/interaction"
import { CircleIcon } from "@/components/icons"

/**
 * محور variant با Checkbox هم‌راستا است: default (سایه‌دار، حالت
 * پیش‌فرض) و flat (بدون سایه، پس‌زمینهٔ خاکستری خنثی — برای وقتی رادیو
 * داخل کارت/Surface است که خودش سایه دارد و سایهٔ دوم روی هم تلنبار می‌شود).
 */
const radioItemVariants = cva(
  [
    "aspect-square size-4 shrink-0 cursor-pointer rounded-full border shadow-control transition-[color,box-shadow,scale] outline-none",
    selectionRootInteraction,
    "focus-visible:border-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-foreground focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-foreground)_12%,var(--color-background))]",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:shadow-none disabled:hover:border-border disabled:hover:brightness-100 disabled:data-[state=checked]:border-placeholder",
    "data-[readonly=true]:cursor-default",
    // نشانهٔ خطا روی data-invalid سوار است نه aria-invalid: نقشِ radio طبق
    // مشخصات ARIA اصلاً aria-invalid نمی‌پذیرد؛ آن اعلان جای خودش روی
    // radiogroup نشسته و اینجا فقط یک قلابِ ظاهری لازم داریم.
    "data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/20 data-[invalid=true]:focus-visible:outline-destructive data-[invalid=true]:focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-destructive)_12%,var(--color-background))] dark:data-[invalid=true]:ring-destructive/40",
  ],
  {
    variants: {
      variant: {
        // پرشدگیِ خاموش توپُر است (bg-card، نه bg-input)، نه نیم‌شفاف — طبق
        // قاعدهٔ «هیچ‌وقت ترنسپرنت/اپسیتی نه» در
        // [[component-transparency-hover-rules]]. bg-input فقط برای حاشیه
        // (border-input) به‌کار می‌رود؛ بعد از تقویتِ آن توکن برای
        // خوانایی مرزها، اگر خودِ پرشدگی هم از همان می‌خورد رادیوی خاموش
        // رنگی/کدر به نظر می‌رسید، نه سفید.
        default:
          "border-input bg-card hover:border-foreground/35",
        flat: "border-transparent bg-muted shadow-none hover:border-foreground/35 hover:brightness-95 dark:hover:brightness-125",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type RadioGroupContextValue = {
  value: string | undefined
  setValue: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  readOnly?: boolean
  interaction?: SelectionInteraction
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null
)

type RadioGroupProps = Omit<React.ComponentProps<"div">, "onChange"> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  /** وضعیت نامعتبر برای فرم‌ها؛ به همهٔ گزینه‌ها می‌رسد مگر خودشان مقدار جداگانه بدهند. */
  invalid?: boolean
  /** aria-required روی نقش radiogroup می‌گذارد (یعنی انتخاب یکی از گزینه‌ها اجباری است). */
  required?: boolean
  /** کل گروه را از تغییر مقدار باز می‌دارد ولی برخلاف disabled، در چرخهٔ Tab می‌ماند — برای نمایش فرمِ ثبت‌شده. */
  readOnly?: boolean
  /** چیدمان گزینه‌ها؛ برای فهرست‌های کوتاه (مثل بله/خیر) horizontal فضای کمتری می‌گیرد. */
  orientation?: "horizontal" | "vertical"
  /**
   * نامِ فیلد در فرم. گزینه‌ها دکمه‌اند نه input، پس بدونِ این مقدار با
   * submitِ بومی یا FormData ارسال نمی‌شد؛ با name یک input مخفی هم‌نام
   * مقدارِ انتخاب‌شده را می‌فرستد.
   */
  name?: string
  /** شناسهٔ فرمی که input مخفی به آن تعلق دارد، وقتی گروه بیرون از تگ form است. */
  form?: string
  /** اینتراکشن پیش‌فرض همهٔ گزینه‌های گروه؛ هر گزینه می‌تواند جداگانه عوضش کند. */
  interaction?: SelectionInteraction
}

function RadioGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  invalid,
  required,
  readOnly,
  orientation = "vertical",
  name,
  form,
  interaction,
  children,
  ...props
}: RadioGroupProps) {
  const [current, setCurrent] = useControllableState<string | undefined>({
    value,
    defaultValue,
    onChange: onValueChange as (value: string | undefined) => void,
  })

  const context = React.useMemo<RadioGroupContextValue>(
    () => ({
      value: current,
      setValue: (v) => setCurrent(v),
      disabled,
      invalid,
      required,
      readOnly,
      interaction,
    }),
    [current, setCurrent, disabled, invalid, required, readOnly, interaction]
  )

  return (
    <RadioGroupContext.Provider value={context}>
      <div
        data-slot="radio-group"
        data-orientation={orientation}
        role="radiogroup"
        aria-orientation={orientation}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        aria-disabled={disabled || undefined}
        aria-readonly={readOnly || undefined}
        className={cn(
          orientation === "horizontal"
            ? "flex flex-row flex-wrap items-center gap-4"
            : "grid gap-3",
          className
        )}
        {...props}
      >
        {children}
        {name && (
          <input type="hidden" name={name} form={form} value={current ?? ""} disabled={disabled} />
        )}
      </div>
    </RadioGroupContext.Provider>
  )
}

/** رادیوهای فعال داخل نزدیک‌ترین radiogroup، به ترتیب DOM. */
function getEnabledRadios(from: HTMLElement): HTMLButtonElement[] {
  const group = from.closest('[role="radiogroup"]')
  if (!group) return []
  return Array.from(
    group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')
  )
}

type RadioGroupItemProps = Omit<React.ComponentProps<"button">, "value"> &
  VariantProps<typeof radioItemVariants> & {
    value: string
    disabled?: boolean
    /** وضعیت نامعتبر همین گزینه؛ نبود آن یعنی از گروه ارث می‌برد. */
    invalid?: boolean
    /** جلوی انتخاب این گزینه را می‌گیرد ولی برخلاف disabled، فوکوس‌پذیر و در Tab باقی می‌ماند. */
    readOnly?: boolean
    /** واکنش گزینه به فشردن و هاور؛ نبود آن یعنی از RadioGroup ارث می‌برد و در غیر این صورت none. */
    interaction?: SelectionInteraction
  }

function RadioGroupItem({
  className,
  variant,
  value,
  disabled,
  invalid,
  readOnly,
  interaction: interactionProp,
  onClick,
  onKeyDown,
  ...props
}: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  const checked = context?.value === value
  const isDisabled = disabled || context?.disabled
  const isInvalid = invalid ?? context?.invalid ?? false
  const isReadOnly = readOnly ?? context?.readOnly ?? false
  const interaction = interactionProp ?? context?.interaction ?? "none"
  const interactive = !isDisabled && !isReadOnly

  // ضربهٔ pop فقط بعد از تغییر واقعی، نه برای گزینهٔ انتخاب‌شده هنگام بارگذاری.
  const [previousChecked, setPreviousChecked] = React.useState(checked)
  const [touched, setTouched] = React.useState(false)
  if (previousChecked !== checked) {
    setPreviousChecked(checked)
    setTouched(true)
  }

  return (
    <button
      type="button"
      role="radio"
      data-slot="radio-group-item"
      data-value={value}
      data-state={checked ? "checked" : "unchecked"}
      data-readonly={isReadOnly ? "true" : undefined}
      data-invalid={isInvalid ? "true" : undefined}
      data-interaction={interactive ? interaction : undefined}
      data-touched={touched ? "true" : undefined}
      aria-checked={checked}
      disabled={isDisabled}
      // Roving tabindex: فقط گزینهٔ انتخاب‌شده در چرخهٔ Tab است؛ اگر هنوز
      // هیچ‌کدام انتخاب نشده همه در دسترس Tab می‌مانند (حالت اولیه، نادر).
      tabIndex={isDisabled ? -1 : checked || context?.value === undefined ? 0 : -1}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || isDisabled || isReadOnly) return
        context?.setValue(value)
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || isDisabled) return

        const isRtl = event.currentTarget.closest('[dir="rtl"]') !== null
        const forwardKeys = isRtl
          ? ["ArrowDown", "ArrowLeft"]
          : ["ArrowDown", "ArrowRight"]
        const backwardKeys = isRtl
          ? ["ArrowUp", "ArrowRight"]
          : ["ArrowUp", "ArrowLeft"]

        if (![...forwardKeys, ...backwardKeys].includes(event.key)) return
        event.preventDefault()

        const items = getEnabledRadios(event.currentTarget)
        const index = items.indexOf(event.currentTarget)
        if (index === -1 || items.length === 0) return

        const delta = forwardKeys.includes(event.key) ? 1 : -1
        const next = items[(index + delta + items.length) % items.length]
        next.focus()
        if (!isReadOnly) {
          const nextValue = next.dataset.value
          if (nextValue !== undefined) context?.setValue(nextValue)
        }
      }}
      className={cn(radioItemVariants({ variant }), className)}
      {...props}
    >
      {(checked || rendersIdleIndicator(interaction)) && (
        <span
          data-slot="radio-group-indicator"
          className="relative flex items-center justify-center"
        >
          <CircleIcon
            stroke="none"
            className={cn(
              "absolute top-1/2 start-1/2 size-2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2",
              isInvalid ? "fill-destructive" : "fill-primary",
              selectionIndicatorInteraction(
                interaction,
                checked,
                interactive,
                "fill-placeholder"
              )
            )}
          />
        </span>
      )}
    </button>
  )
}

export {
  RadioGroup,
  RadioGroupItem,
  radioItemVariants,
  type RadioGroupProps,
  type RadioGroupItemProps,
}
