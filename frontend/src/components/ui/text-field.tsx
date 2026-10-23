"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Input, type InputProps } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * TextField ترکیب برچسب، ورودی، توضیح و پیام خطا را در یک فیلد فرم می‌سازد.
 * اینجا هر دو سبک پشتیبانی می‌شود:
 *
 * ۱) میان‌بر: همهٔ اجزا را با props بدهید.
 *      <TextField label="ایمیل" description="…" errorMessage="…" invalid />
 *
 * ۲) ترکیبی: اجزا را خودتان بچینید و اتصال id و aria خودکار از طریق
 *    context انجام می‌شود.
 *      <TextField invalid>
 *        <TextFieldLabel>ایمیل</TextFieldLabel>
 *        <TextFieldInput type="email" />
 *        <TextFieldDescription>…</TextFieldDescription>
 *        <TextFieldError>…</TextFieldError>
 *      </TextField>
 *
 * برچسبِ شناور (labelPlacement="inside") فقط با CSS کار می‌کند: ظرف کلاس
 * group دارد و برچسب با group-has-[input:focus] و
 * group-has-[input:not(:placeholder-shown)] بالا می‌رود. به همین دلیل ترتیب
 * DOM اجزا آزاد است و هیچ state ری‌اکتی لازم نیست.
 *
 * برای فیلد چندخطی به‌جای TextFieldInput از TextFieldTextarea استفاده کنید.
 * برچسب شناور برای این حالت پشتیبانی نمی‌شود، چون Textarea خودِ data-filled
 * را ندارد.
 *
 * validate یک میان‌بر برای اعتبارسنجی است: بعد از اولین ترکِ فیلد، هر بار که
 * مقدار عوض شود validate صدا زده می‌شود (کنترل‌شده یا نه)؛ برگرداندن رشته یعنی نامعتبر (همان رشته پیام خطا می‌شود) و
 * true/null/undefined یعنی معتبر — دقیقاً همان قرارداد پراپ validate در
 * React Aria.
 */

type LabelPlacement = "outside" | "outside-top" | "outside-left" | "inside"

type TextFieldContextValue = {
  inputId: string
  descriptionId: string
  errorId: string
  labelPlacement: LabelPlacement
  invalid: boolean
  required: boolean
  optional: boolean
  disabled: boolean
  readOnly: boolean
  /** وقتی پیام خطا نمایش داده می‌شود، توضیح جایش را می‌دهد. */
  showDescription: boolean
  /** id عنصری که واقعاً رندر می‌شود؛ undefined یعنی aria-describedby نگذار. */
  describedBy?: string
}

const TextFieldContext = React.createContext<TextFieldContextValue | null>(null)

function useTextField(component: string): TextFieldContextValue {
  const context = React.useContext(TextFieldContext)
  if (!context) {
    throw new Error(`${component} باید داخل <TextField> استفاده شود.`)
  }
  return context
}

const textFieldVariants = cva("flex text-start", {
  variants: {
    labelPlacement: {
      outside: "flex-col gap-2",
      "outside-top": "flex-col gap-2",
      "outside-left": "flex-row items-center gap-3",
      inside: "group relative flex-col gap-2",
    },
    fullWidth: {
      true: "w-full",
      false: "w-auto",
    },
  },
  defaultVariants: { labelPlacement: "outside", fullWidth: true },
})

type TextFieldOwnProps = {
  /**
   * نامِ اسلاتِ ریشه. پیش‌فرض `text-field` است؛ کامپوننت‌هایی که TextField
   * را در خودشان می‌پیچند (مثل ColorField) با این پراپ نامِ خودشان را
   * می‌گذارند تا در DOM قابلِ تشخیص باشند.
   */
  slot?: string
  label?: React.ReactNode
  labelPlacement?: LabelPlacement
  description?: React.ReactNode
  errorMessage?: React.ReactNode
  /** فیلد نامعتبر است؛ aria-invalid و پیام خطا را روشن می‌کند. */
  invalid?: boolean
  /**
   * اعتبارسنجی؛ با فیلدِ کنترل‌شده و uncontrolled هر دو کار می‌کند. خطا بعد از
   * اولین blur نشان داده و از آن به بعد زنده به‌روز می‌شود. رشته (یا آرایه‌ای
   * از رشته‌ها) برگردانید تا فیلد نامعتبر شود و همان متن errorMessage بشود؛
   * true/null/undefined یعنی معتبر.
   */
  validate?: (value: string) => string | string[] | true | null | undefined
  required?: boolean
  /**
   * برچسبِ «(اختیاری)» را کنارِ label نشان می‌دهد. وقتی بیشترِ فیلدهای
   * فرم اجباری‌اند، به‌جای ستاره روی همه، همین را روی چندتای اختیاری
   * بگذارید. با required هم‌زمان نادیده گرفته می‌شود.
   */
  optional?: boolean
  disabled?: boolean
  readOnly?: boolean
  /** کلاس ظرف بیرونی. */
  className?: string
  /**
   * کلاسِ کادرِ فیلد در حالت میان‌بر (همان ریشهٔ Input، نه تگ input).
   * نامش تاریخی است؛ برای کدِ تازه classNames.field روشن‌تر است.
   */
  inputClassName?: string
  /**
   * کلاسِ هر بخش در حالت میان‌بر، بدون نیاز به انتخاب‌گرِ data-slot از
   * بیرون (که با تغییرِ ساختارِ داخلی بی‌صدا می‌شکند):
   *   label        برچسب
   *   field        کادرِ فیلد (ارتفاع، گوشه، پس‌زمینه، سایه)
   *   input        خودِ تگ input (تراز و اندازهٔ متن، placeholder)
   *   startContent / endContent  ظرفِ محتوای ابتدا و انتها (رنگِ آیکون)
   *   description / error        متنِ زیرِ فیلد
   */
  classNames?: TextFieldClassNames
  children?: React.ReactNode
} & Pick<VariantProps<typeof textFieldVariants>, "fullWidth">

type TextFieldClassNames = {
  label?: string
  field?: string
  input?: string
  startContent?: string
  endContent?: string
  description?: string
  error?: string
}

/** propهایی که در حالت میان‌بر مستقیم به <Input> می‌رسند. */
type TextFieldProps = TextFieldOwnProps &
  Omit<InputProps, "required" | "disabled" | "readOnly" | "className">

function TextField({
  slot = "text-field",
  label,
  labelPlacement = "outside",
  description,
  errorMessage,
  invalid = false,
  validate,
  required = false,
  optional = false,
  disabled = false,
  readOnly = false,
  fullWidth = true,
  className,
  inputClassName,
  classNames,
  children,
  id,
  ...inputProps
}: TextFieldProps) {
  const generatedId = React.useId()
  const inputId = id ?? `${generatedId}-input`
  const isComposed = children !== undefined

  // خطای validate بعد از اولین ترکِ فیلد (blur) نشان داده می‌شود و از آن به
  // بعد زنده به‌روز می‌شود؛ وگرنه با اولین حرف، فیلدِ نیمه‌کاره قرمز می‌شد.
  const [touched, setTouched] = React.useState(false)
  // مقدارِ فیلدِ uncontrolled را هم نگه می‌داریم تا validate بدونِ state در
  // والد کار کند؛ برای فیلدهای عددی همان مقدارِ لاتینِ onValueChange است.
  const [innerValue, setInnerValue] = React.useState(() => String(inputProps.defaultValue ?? ""))
  const currentValue = inputProps.value !== undefined ? String(inputProps.value) : innerValue

  const validationResult = validate && touched ? validate(currentValue) : undefined
  const validationMessage = Array.isArray(validationResult)
    ? validationResult.filter(Boolean).join(" ")
    : typeof validationResult === "string"
      ? validationResult
      : undefined
  const resolvedInvalid = invalid || Boolean(validationMessage)
  const resolvedErrorMessage = errorMessage ?? validationMessage

  const showError = resolvedInvalid && (isComposed || Boolean(resolvedErrorMessage))
  const descriptionId = `${inputId}-description`
  const errorId = `${inputId}-error`

  const context: TextFieldContextValue = {
    inputId,
    descriptionId,
    errorId,
    labelPlacement,
    invalid: resolvedInvalid,
    required,
    optional: optional && !required,
    disabled,
    readOnly,
    showDescription: !showError,
    // به idای اشاره نکنیم که هیچ عنصری آن را ندارد.
    describedBy: showError
      ? errorId
      : isComposed || description
        ? descriptionId
        : undefined,
  }

  const fieldProps: InputProps = {
    ...inputProps,
    onValueChange: (next: string) => {
      setInnerValue(next)
      inputProps.onValueChange?.(next)
    },
    onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
      if (validate && currentValue.length > 0) setTouched(true)
      inputProps.onBlur?.(event)
    },
    className: cn(inputClassName, classNames?.field),
    inputClassName: classNames?.input,
    startContentClassName: classNames?.startContent,
    endContentClassName: classNames?.endContent,
  }

  return (
    <TextFieldContext.Provider value={context}>
      <div
        data-slot={slot}
        data-invalid={resolvedInvalid ? "true" : undefined}
        data-required={required ? "true" : undefined}
        data-disabled={disabled ? "true" : undefined}
        data-readonly={readOnly ? "true" : undefined}
        className={cn(
          textFieldVariants({ labelPlacement, fullWidth }),
          disabled && "[&_[data-slot=text-field-label]]:text-muted-foreground [&_[data-slot=text-field-description]]:text-placeholder",
          className
        )}
      >
        {isComposed ? (
          children
        ) : (
          <>
            {/* در حالت شناور، ورودی باید قبل از برچسب رندر شود تا برچسب
                بتواند روی آن بنشیند؛ در بقیهٔ حالت‌ها برچسب اول می‌آید. */}
            {labelPlacement === "inside" ? (
              <div className="relative">
                <TextFieldInput {...fieldProps} />
                {label && <TextFieldLabel className={classNames?.label}>{label}</TextFieldLabel>}
              </div>
            ) : (
              <>
                {label && <TextFieldLabel className={classNames?.label}>{label}</TextFieldLabel>}
                <TextFieldInput {...fieldProps} />
              </>
            )}

            {showError ? (
              <TextFieldError className={classNames?.error}>{resolvedErrorMessage}</TextFieldError>
            ) : (
              description && (
                <TextFieldDescription className={classNames?.description}>
                  {description}
                </TextFieldDescription>
              )
            )}
          </>
        )}
      </div>
    </TextFieldContext.Provider>
  )
}

function TextFieldLabel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { inputId, labelPlacement, invalid, required, optional } =
    useTextField("TextFieldLabel")

  return (
    <Label
      htmlFor={inputId}
      data-slot="text-field-label"
      className={cn(
        // Label یک flex container با gap-2 است، پس شبه‌عنصرِ ستاره هم یک آیتم
        // flex می‌شود و همان gap را می‌گیرد؛ برای همین gap را اینجا کم می‌کنیم.
        required &&
          "gap-1 after:text-destructive after:content-['*'] after:leading-none",
        // «(اختیاری)» بلافاصله کنارِ برچسب می‌نشیند، نه با justify-between
        // در لبهٔ دیگر؛ آنجا از خودِ برچسب جدا می‌افتد.
        optional && "gap-1",
        labelPlacement === "outside-left" && "shrink-0",
        // برچسبِ شناور فقط CSS است، بدون هیچ state ری‌اکتی: کادر Input کلاس
        // peer می‌گیرد و چون در DOM قبل از برچسب می‌آید، برچسب با ~ به حالتش
        // واکنش نشان می‌دهد. دو شرطِ «فوکوس» و «پر بودن» هر دو یک ظاهر
        // می‌سازند، پس ترتیب کلاس‌ها اهمیتی ندارد. پر بودن را از
        // data-filled می‌خوانیم که خودِ Input می‌گذارد.
        labelPlacement === "inside" && [
          "pointer-events-none absolute start-3 z-10",
          "top-1/2 -translate-y-1/2 text-sm font-normal text-muted-foreground transition-all duration-200",
          "peer-focus-within:top-1.5 peer-focus-within:translate-y-0 peer-focus-within:text-xs",
          "peer-data-[filled=true]:top-1.5 peer-data-[filled=true]:translate-y-0 peer-data-[filled=true]:text-xs",
        ],
        invalid && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {optional && (
        <span className="font-normal text-muted-foreground">(اختیاری)</span>
      )}
    </Label>
  )
}

function TextFieldInput({
  className,
  inputClassName,
  placeholder,
  ...props
}: InputProps) {
  const {
    inputId,
    describedBy,
    labelPlacement,
    invalid,
    required,
    disabled,
    readOnly,
  } = useTextField("TextFieldInput")

  return (
    <Input
      id={inputId}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
      className={cn(
        // ارتفاع و padding روی کادر می‌نشیند…
        labelPlacement === "inside" && "peer h-14 items-end pb-1.5",
        labelPlacement === "outside-left" && "flex-1",
        className
      )}
      // …ولی پنهان‌کردن placeholder (تا برچسب رویش نیفتد) فقط روی خودِ تگ
      // input معنی دارد.
      inputClassName={cn(
        labelPlacement === "inside" &&
          "h-auto placeholder:opacity-0 focus:placeholder:opacity-100",
        inputClassName
      )}
      {...props}
    />
  )
}

/**
 * جایگزینِ TextFieldInput برای فیلد چندخطی — <Textarea> به‌جای <Input>
 * داخل <TextField>. برخلاف TextFieldInput، برچسب شناور
 * (labelPlacement="inside") را پشتیبانی نمی‌کند چون Textarea کلاس peer و
 * data-filled ندارد.
 */
function TextFieldTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  const { inputId, describedBy, invalid, required, disabled, readOnly } =
    useTextField("TextFieldTextarea")

  return (
    <Textarea
      id={inputId}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      required={required}
      disabled={disabled}
      readOnly={readOnly}
      className={className}
      {...props}
    />
  )
}

function TextFieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId, showDescription } = useTextField(
    "TextFieldDescription"
  )
  if (!showDescription) return null

  return (
    <p
      id={descriptionId}
      data-slot="text-field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function TextFieldError({ className, ...props }: React.ComponentProps<"p">) {
  const { errorId, invalid } = useTextField("TextFieldError")
  if (!invalid) return null

  return (
    <p
      id={errorId}
      role="alert"
      data-slot="text-field-error"
      className={cn("text-xs text-destructive", className)}
      {...props}
    />
  )
}

export type { TextFieldClassNames }

export {
  TextField,
  TextFieldLabel,
  TextFieldInput,
  TextFieldTextarea,
  TextFieldDescription,
  TextFieldError,
  textFieldVariants,
  type TextFieldProps,
}
