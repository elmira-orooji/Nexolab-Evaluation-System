"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useControllableState } from "@/lib/primitives/use-controllable-state"
import {
  selectionIndicatorInteraction,
  selectionRootInteraction,
  type CheckboxInteraction,
} from "@/lib/primitives/interaction"
import { CheckIcon, MinusIcon } from "@/components/icons"

type CheckedState = boolean | "indeterminate"

/**
 * محور variant همان الگوی Textarea را دارد: default سایه‌دار است (حالت
 * پیش‌فرض) و flat بدون سایه با پس‌زمینهٔ خاکستری خنثی — برای داخل
 * کارت/Surface که خودش سایه دارد و سایهٔ دوم روی هم تلنبار می‌شود.
 */
const checkboxVariants = cva(
  [
    "peer size-4 shrink-0 cursor-pointer rounded-[5px] border transition-[color,background-color,border-color,box-shadow,scale] outline-none",
    selectionRootInteraction,
    "focus-visible:border-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-foreground focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-foreground)_12%,var(--color-background))]",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:shadow-none disabled:hover:border-border disabled:hover:brightness-100 disabled:data-[state=checked]:border-placeholder disabled:data-[state=checked]:bg-placeholder disabled:data-[state=indeterminate]:border-placeholder disabled:data-[state=indeterminate]:bg-placeholder dark:disabled:data-[state=checked]:bg-placeholder dark:disabled:data-[state=indeterminate]:bg-placeholder",
    "data-[readonly=true]:cursor-default",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
    "aria-invalid:focus-visible:outline-destructive aria-invalid:focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-destructive)_12%,var(--color-background))]",
    "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    "data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
    // variant=default در تم تیره dark:bg-input دارد که با data-[state=checked]:bg-primary
    // در یک سطح تخصیص (specificity) مساوی است؛ بدون این دو ردیف، ترتیب صدور کلاس در
    // Tailwind می‌تواند dark:bg-input را برنده کند و چک‌باکسِ انتخاب‌شده در تم تیره
    // بی‌رنگ (فقط حاشیه) نشان داده شود.
    "dark:data-[state=checked]:bg-primary dark:data-[state=indeterminate]:bg-primary",
    // نامعتبر + انتخاب‌شده/نامشخص: به‌جای رنگ primary، رنگ خطا نشان داده شود.
    "aria-invalid:data-[state=checked]:border-destructive aria-invalid:data-[state=checked]:bg-destructive aria-invalid:data-[state=checked]:text-destructive-foreground",
    "aria-invalid:data-[state=indeterminate]:border-destructive aria-invalid:data-[state=indeterminate]:bg-destructive aria-invalid:data-[state=indeterminate]:text-destructive-foreground",
    "dark:aria-invalid:data-[state=checked]:bg-destructive dark:aria-invalid:data-[state=indeterminate]:bg-destructive",
  ],
  {
    variants: {
      variant: {
        // پرشدگیِ خاموش همیشه توپُر است (bg-card، نه نیم‌شفاف) — طبق قاعدهٔ
        // «هیچ‌وقت ترنسپرنت/اپسیتی نه» در [[component-transparency-hover-rules]].
        // bg-input فقط برای حاشیه (border-input) به‌کار می‌رود؛ بعد از
        // تقویتِ آن توکن برای خوانایی مرزها، پرشدگیِ خودِ چک‌باکس دیگر
        // نباید از همان بخورد وگرنه خاموش هم رنگی/کدر به نظر می‌رسد.
        default:
          "border-input bg-card shadow-control hover:border-foreground/35",
        flat: "border-transparent bg-muted shadow-none hover:border-foreground/35 hover:brightness-95 dark:hover:brightness-125",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type CheckboxGroupContextValue = {
  value: string[]
  toggleValue: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  interaction?: CheckboxInteraction
}

const CheckboxGroupContext =
  React.createContext<CheckboxGroupContextValue | null>(null)

type CheckboxProps = Omit<
  React.ComponentProps<"button">,
  "checked" | "defaultChecked" | "onChange" | "value"
> &
  VariantProps<typeof checkboxVariants> & {
    checked?: CheckedState
    defaultChecked?: CheckedState
    onCheckedChange?: (checked: CheckedState) => void
    required?: boolean
    /** جلوی تغییر وضعیت را می‌گیرد ولی برخلاف disabled، فوکوس‌پذیر و در Tab باقی می‌ماند. */
    readOnly?: boolean
    /** وضعیت نامعتبر (فرم‌ها)؛ حاشیه و — در حالت انتخاب‌شده — رنگ را قرمز می‌کند. */
    invalid?: boolean
    /** فقط داخل CheckboxGroup معنا دارد: مقدار این گزینه در آرایهٔ انتخاب‌شده‌ها. */
    value?: string
    /** واکنش چک‌باکس به فشردن و هاور؛ نبود آن یعنی از CheckboxGroup ارث می‌برد و در غیر این صورت none. */
    interaction?: CheckboxInteraction
  }

function Checkbox({
  className,
  variant,
  checked,
  defaultChecked = false,
  onCheckedChange,
  onClick,
  disabled,
  required,
  readOnly = false,
  invalid,
  value,
  interaction: interactionProp,
  ...props
}: CheckboxProps) {
  const group = React.useContext(CheckboxGroupContext)
  const checkedFromGroup =
    group && value !== undefined ? group.value.includes(value) : undefined
  const isGrouped = checkedFromGroup !== undefined

  const [state, setState] = useControllableState<CheckedState>({
    value: isGrouped ? checkedFromGroup : checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  })

  const effectiveDisabled = disabled ?? group?.disabled ?? false
  const effectiveInvalid = invalid ?? group?.invalid ?? false
  const effectiveRequired = required ?? group?.required ?? false
  const interaction = interactionProp ?? group?.interaction ?? "none"
  const interactive = !effectiveDisabled && !readOnly

  // ضربهٔ pop فقط وقتی وضعیت بعد از نخستین رندر عوض شده باشد، نه برای
  // گزینه‌ای که هنگام بارگذاری صفحه از قبل انتخاب شده است.
  const [previousState, setPreviousState] = React.useState(state)
  const [touched, setTouched] = React.useState(false)
  if (previousState !== state) {
    setPreviousState(state)
    setTouched(true)
  }

  const dataState =
    state === "indeterminate" ? "indeterminate" : state ? "checked" : "unchecked"

  return (
    <button
      type="button"
      role="checkbox"
      data-slot="checkbox"
      data-state={dataState}
      data-readonly={readOnly ? "true" : undefined}
      data-interaction={interactive ? interaction : undefined}
      data-touched={touched ? "true" : undefined}
      aria-checked={state === "indeterminate" ? "mixed" : state}
      aria-required={effectiveRequired || undefined}
      aria-invalid={effectiveInvalid || undefined}
      aria-readonly={readOnly || undefined}
      disabled={effectiveDisabled}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented || effectiveDisabled || readOnly) return
        if (isGrouped && value !== undefined) {
          group!.toggleValue(value)
          onCheckedChange?.(!state)
        } else {
          setState(state === "indeterminate" ? true : !state)
        }
      }}
      className={cn(checkboxVariants({ variant }), className)}
      {...props}
    >
      <span
        data-slot="checkbox-indicator"
        className={cn(
          "grid place-content-center text-current transition-none",
          interaction === "draw"
            ? "" // خود خط با dashoffset پنهان می‌شود تا پاک شدنش هم دیده شود
            : selectionIndicatorInteraction(
                interaction,
                state !== false,
                interactive,
                "text-placeholder"
              )
        )}
      >
        {state === "indeterminate" ? (
          <MinusIcon className="size-3" />
        ) : interaction === "draw" ? (
          // تیک با stroke-dashoffset از ابتدا تا انتها کشیده می‌شود. در حالت
          // خاموش، خط کامل پیش از شروع مسیر قرار می‌گیرد تا حتی نقطهٔ سرِ
          // گرد خط هم دیده نشود.
          <svg
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="size-3"
          >
            <path
              d="M2.5 6.5 5 9l4.5-5.5"
              pathLength={1}
              strokeDasharray="1 2"
              strokeDashoffset={state ? 0 : 1.05}
              className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
            />
          </svg>
        ) : (
          <CheckIcon className="size-3" />
        )}
      </span>
    </button>
  )
}

type CheckboxGroupProps = Omit<
  React.ComponentProps<"div">,
  "onChange" | "defaultValue"
> & {
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  disabled?: boolean
  invalid?: boolean
  required?: boolean
  /** اینتراکشن پیش‌فرض همهٔ چک‌باکس‌های داخل گروه. */
  interaction?: CheckboxInteraction
}

/**
 * چند Checkbox را با یک آرایهٔ مقادیر انتخاب‌شده (به‌جای چند boolean جدا)
 * هماهنگ می‌کند. هر Checkbox فرزند باید
 * پراپ value بگیرد تا داخل گروه شناخته شود؛ disabled/invalid/required
 * ست‌شده روی گروه به‌صورت پیش‌فرض به همهٔ فرزندان می‌رسد مگر خودشان مقدار
 * جداگانه بدهند.
 */
function CheckboxGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  disabled,
  invalid,
  required,
  interaction,
  ...props
}: CheckboxGroupProps) {
  const [current, setCurrent] = useControllableState<string[]>({
    value,
    defaultValue: defaultValue ?? [],
    onChange: onValueChange,
  })

  const toggleValue = React.useCallback(
    (item: string) => {
      setCurrent(
        current.includes(item)
          ? current.filter((v) => v !== item)
          : [...current, item]
      )
    },
    [current, setCurrent]
  )

  const context = React.useMemo<CheckboxGroupContextValue>(
    () => ({ value: current, toggleValue, disabled, invalid, required, interaction }),
    [current, toggleValue, disabled, invalid, required, interaction]
  )

  return (
    <CheckboxGroupContext.Provider value={context}>
      <div
        data-slot="checkbox-group"
        role="group"
        // نقشِ group طبق مشخصات ARIA نه aria-required می‌پذیرد نه
        // aria-invalid. هر دو اعلان جای درست خودشان را دارند: روی تک‌تکِ
        // checkboxهای داخل گروه، که از همین context ارث می‌برند و نقششان
        // این دو را پشتیبانی می‌کند. گذاشتنشان اینجا نه چیزی اضافه می‌کرد
        // نه صفحه‌خوان می‌خواندش.
        data-required={required ? "true" : undefined}
        data-invalid={invalid ? "true" : undefined}
        aria-disabled={disabled || undefined}
        className={cn("grid gap-3", className)}
        {...props}
      />
    </CheckboxGroupContext.Provider>
  )
}

export {
  Checkbox,
  CheckboxGroup,
  checkboxVariants,
  type CheckboxProps,
  type CheckboxGroupProps,
}
