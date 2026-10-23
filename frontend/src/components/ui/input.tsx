"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { normalizeArabicChars, toEnDigits, toFaDigits } from "@/lib/persian"
import { XIcon as X } from "@/components/icons"
import { autoControlHeight } from "@/components/ui/control-size"

/**
 * ساختار: یک ظرف که کادر فیلد است (حاشیه، پس‌زمینه، ارتفاع، گردی گوشه) و
 * داخلش تگ بومی input که خودش بی‌رنگ و بی‌حاشیه است. محتوای ابتدا/انتها و
 * دکمهٔ پاک‌کردن هم‌ردیفِ input در همان ظرف flex می‌نشینند، پس هر عرضی
 * داشته باشند (آیکون یا کلمهٔ «تومان») فضای واقعی می‌گیرند و روی متن
 * نمی‌افتند.
 *
 * چون کادر روی ظرف است، حالت‌های تعاملی هم روی ظرف نوشته می‌شوند:
 * focus-within به‌جای focus-visible و has-[input:disabled] به‌جای disabled.
 *
 * رنگ فیلد با یک متغیر CSS منتقل می‌شود: --field. محور `color` فقط همین را
 * ست می‌کند و محور `variant` تصمیم می‌گیرد رنگ کجا بنشیند. افزودن یک رنگ =
 * یک سطر، نه یک ردیف compound به‌ازای هر واریانت. همان الگوی Button.
 *
 * ردیف‌های compoundVariants فقط برای رنگ پیش‌فرض‌اند تا ظاهر خنثای پایه
 * (border-input و حلقهٔ ring) دقیقاً همانی بماند که بود.
 *
 * ترتیب محورها عمدی است: `variant` آخر می‌آید تا واریانت underlined بتواند
 * padding و گردی گوشهٔ محور `size` را بازنویسی کند.
 */
const inputVariants = cva(
  [
    "relative inline-flex items-center rounded-lg text-muted-foreground",
    "transition-[color,background-color,border-color,box-shadow]",
    // غیرفعال با رنگ، نه opacity (نیمه‌شفاف، رنگ زمینهٔ پشت را نشان می‌دهد).
    "has-[input:disabled]:pointer-events-none has-[input:disabled]:cursor-not-allowed has-[input:disabled]:border-transparent has-[input:disabled]:bg-muted has-[input:disabled]:shadow-none has-[input:disabled]:text-placeholder [&_input:disabled]:text-muted-foreground",
    // انتخابگر خطا ویژگی بیشتری از hover و focus-within دارد، پس بدون
    // وابستگی به ترتیب کلاس‌ها برندهٔ حالت نامعتبر است.
    "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]]:ring-destructive/20",
    "dark:has-[input[aria-invalid=true]]:ring-destructive/40",
    "has-[input[aria-invalid=true]]:focus-within:border-destructive has-[input[aria-invalid=true]]:focus-within:outline-destructive has-[input[aria-invalid=true]]:focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-destructive)_12%,var(--color-background))]",
  ],
  {
    variants: {
      color: {
        default:
          "[--field:var(--color-foreground)] [--field-subtle:var(--color-muted)]",
        primary:
          "[--field:var(--color-primary)] [--field-subtle:var(--color-primary-subtle)] [--field-subtle-foreground:var(--color-primary-subtle-foreground)]",
        success:
          "[--field:var(--color-success)] [--field-subtle:var(--color-success-subtle)] [--field-subtle-foreground:var(--color-success-subtle-foreground)]",
        warning:
          "[--field:var(--color-warning)] [--field-subtle:var(--color-warning-subtle)] [--field-subtle-foreground:var(--color-warning-subtle-foreground)]",
        destructive:
          "[--field:var(--color-destructive)] [--field-subtle:var(--color-destructive-subtle)] [--field-subtle-foreground:var(--color-destructive-subtle-foreground)]",
      },
      size: {
        sm: "h-8 px-2.5 text-sm",
        default: "h-9 px-3 text-base md:text-sm",
        lg: "h-10 px-4 text-base",
        xl: "h-12 px-4 text-base",
        // بدون prop اندازه: از نزدیک‌ترین ControlSizeProvider پیروی می‌کند و
        // اگر نباشد دقیقاً همان default است.
        auto: [
          autoControlHeight,
          "px-[var(--control-field-px,calc(var(--spacing)*3))]",
          "text-[length:var(--control-text,var(--text-base))] md:text-[length:var(--control-text,var(--text-sm))]",
        ],
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
        false: "w-auto",
      },
      variant: {
        default: [
          "border border-(color:--field)/40 bg-background shadow-control",
          "hover:border-(color:--field)/60",
          "focus-within:border-(color:--field) focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-(color:--field) focus-within:ring-0 focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--field)_12%,var(--color-background))]",
        ],
        bordered: [
          "border-2 border-(color:--field)/35 bg-background shadow-none",
          "hover:border-(color:--field)/65",
          "focus-within:border-(color:--field) focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-(color:--field) focus-within:ring-0 focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--field)_12%,var(--color-background))]",
        ],
        // زمینه از جفت توپُر ـsubtle می‌آید (همان چیزی که Badge/Alert
        // استفاده می‌کنند)، نه آلفا روی --field؛ کاملاً مات است و foreground
        // جفتش از قبل روی آن زمینه AA را رد کرده.
        flat: [
          "border border-transparent bg-(color:--field-subtle) text-(color:--field-subtle-foreground) shadow-none",
          "hover:brightness-95 dark:hover:brightness-125",
          "focus-within:border-(color:--field) focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-(color:--field) focus-within:ring-0 focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--field)_12%,var(--color-background))]",
        ],
        faded: [
          "border border-border bg-muted shadow-none",
          "hover:border-(color:--field)/55",
          "focus-within:border-(color:--field) focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-(color:--field) focus-within:ring-0 focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--field)_12%,var(--color-background))]",
        ],
        underlined: [
          "rounded-none border-0 border-b-2 border-(color:--field)/35 bg-transparent px-1 shadow-none",
          "hover:border-(color:--field)/65",
          "focus-within:border-(color:--field) focus-within:outline-1 focus-within:-outline-offset-1 focus-within:outline-(color:--field) focus-within:ring-0 focus-within:shadow-[0_0_0_2px_color-mix(in_oklab,var(--field)_12%,var(--color-background))]",
        ],
      },
    },
    compoundVariants: [
      // رنگ پیش‌فرض = ظاهر خنثای دیگ، نه رنگ ring روی همهٔ حاشیه‌ها.
      {
        variant: "default",
        color: "default",
        // border-input و bg-input در تم تیره یک توکن‌اند؛ پرشدگی باید توپُر
        // بماند (ورودی یک فیلد پُررنگ است، نه شبه‌شیشه‌ای)، پس به‌جای کم‌رنگ
        // کردن پرشدگی، حاشیه را در تم تیره جدا از accent/input نگه می‌داریم.
        class:
          "border-input bg-background hover:border-foreground/35 dark:bg-input dark:border-foreground/25",
      },
      {
        variant: "bordered",
        color: "default",
        class:
          "border-input hover:border-foreground/35",
      },
      {
        variant: "flat",
        color: "default",
        class:
          "bg-muted text-muted-foreground hover:brightness-95 dark:hover:brightness-125",
      },
      {
        variant: "faded",
        color: "default",
        class:
          "hover:border-foreground/35",
      },
      {
        variant: "underlined",
        color: "default",
        class:
          "border-input hover:border-foreground/50",
      },
    ],
    defaultVariants: {
      variant: "default",
      color: "default",
      size: "default",
      fullWidth: true,
    },
  }
)

/**
 * تگ بومی input بی‌رنگ و بی‌حاشیه است؛ اندازهٔ متن را از ظرف ارث می‌برد تا
 * محور size فقط یک جا تعریف شده باشد.
 */
const inputElementClasses = [
  "h-full w-full min-w-0 flex-1 bg-transparent px-0 py-0 font-sans leading-none text-foreground outline-none",
  "selection:bg-primary selection:text-primary-foreground",
  // اندازهٔ راهنما نسبی است (em) نه ثابت، پس در هر سه اندازهٔ فیلد کمی
  // ریزتر از متن واقعی می‌ماند و خودش با محور size بالا و پایین می‌رود.
  "placeholder:text-[0.9em] placeholder:text-placeholder placeholder:transition-opacity placeholder:duration-150",
  "disabled:cursor-not-allowed read-only:cursor-default",
  // دکمهٔ بومی انتخاب فایل متن انگلیسی و ثابت دارد و با CSS ترجمه نمی‌شود،
  // پس پنهانش می‌کنیم و خودمان دکمهٔ فارسی می‌گذاریم.
  "file:hidden [&::file-selector-button]:hidden",
  // پس‌زمینهٔ کادر روی ظرف است، پس پس‌زمینهٔ آبیِ autofill کروم فقط روی خودِ
  // input می‌نشست و شبیه یک بلوک انتخاب‌شده دیده می‌شد. با background-clip:text
  // آن پس‌زمینه به شکل حروف بریده می‌شود، یعنی عملاً دیده نمی‌شود.
  "bg-clip-text autofill:bg-transparent autofill:[-webkit-text-fill-color:var(--color-foreground)]",
]

/** فاصلهٔ محتوای کناری تا لبهٔ فیلد. */
type ContentSpacing = "default" | "tight" | "flush"

type InputProps = Omit<React.ComponentProps<"input">, "size" | "color"> &
  VariantProps<typeof inputVariants> & {
    /** محتوای ابتدای فیلد (آیکون، پیشوند واحد و…). */
    startContent?: React.ReactNode
    /** محتوای انتهای فیلد (واحد پول، دکمهٔ جستجو، دکمهٔ نمایش رمز و…). */
    endContent?: React.ReactNode
    /**
     * فاصلهٔ محتوای ابتدا تا لبهٔ فیلد.
     * `default` همان padding فیلد، `tight` چند پیکسل (مناسب دکمهٔ کوچک داخل
     * فیلد) و `flush` بدون فاصله — دکمه به لبه می‌چسبد و تمام ارتفاع فیلد را
     * می‌گیرد.
     */
    startContentSpacing?: ContentSpacing
    /** مثل startContentSpacing ولی برای انتهای فیلد. */
    endContentSpacing?: ContentSpacing
    /** کلاسِ ظرفِ محتوای ابتدا (مثلاً رنگ یا اندازهٔ آیکون)، بدون انتخاب‌گرِ data-slot. */
    startContentClassName?: string
    /** کلاسِ ظرفِ محتوای انتها. */
    endContentClassName?: string
    /** دکمهٔ پاک‌کردن مقدار در انتهای فیلد. */
    clearable?: boolean
    /** بعد از کلیک روی دکمهٔ پاک‌کردن صدا زده می‌شود. */
    onClear?: () => void
    /** مثل onChange ولی مستقیم مقدار متنی می‌دهد. */
    onValueChange?: (value: string) => void
    /**
     * با فوکوس (کلیک یا Tab) متن placeholder محو می‌شود تا کاربر یک بوم خالی
     * برای تایپ ببیند؛ اگر بدون تایپ بیرون برود دوباره برمی‌گردد. پیش‌فرض
     * روشن است؛ برای فیلدهایی که راهنما باید حین تایپ هم بماند
     * hidePlaceholderOnFocus={false} بدهید.
     */
    hidePlaceholderOnFocus?: boolean
    /** برچسب دسترس‌پذیریِ دکمهٔ پاک‌کردن. */
    clearButtonLabel?: string
    /** کلاس خودِ تگ input؛ className روی کادر بیرونی می‌نشیند. */
    inputClassName?: string
    /**
     * ارقام را فارسی نشان می‌دهد ولی مقدار لاتین بیرون می‌دهد.
     *
     * کاربر با هر کیبوردی (فارسی، عربی یا انگلیسی) تایپ کند روی صفحه ۰۱۲۳
     * می‌بیند و فرم 0123 می‌فرستد؛ پس هیچ‌وقت به‌خاطر شکل رقم خطا نمی‌گیرد.
     * اگر name بدهید، مقدار لاتین در یک input مخفی برای ارسال فرم گذاشته
     * می‌شود.
     */
    faDigits?: boolean
    /**
     * ارقام را سه‌تا سه‌تا با جداکنندهٔ هزارگان (٬) گروه‌بندی می‌کند —
     * بدون توجه به بزرگی عدد. مقداری که بیرون می‌دهد و در فرم می‌رود همچنان
     * بدون جداکننده است.
     *
     * پیش‌فرض برای فیلدهای مبلغ (inputMode="decimal") روشن است؛ برای کد ملی و
     * شمارهٔ کارت و امثال آن خاموش می‌ماند چون آنجا گروه‌بندی هزارگان معنایی
     * ندارد.
     */
    groupDigits?: boolean
    /**
     * ارقام را در گروه‌های ثابت با فاصله نشان می‌دهد، مثل [4, 4, 4, 4] برای
     * شمارهٔ کارت (۶۱۰۴ ۳۳۷۸ ۵۲۱۰ ۹۶۷۵). مقداری که بیرون می‌دهد و در فرم
     * می‌رود بدون فاصله است و بیشتر از مجموعِ گروه‌ها رقم نمی‌پذیرد؛ maxLength
     * لازم نیست.
     */
    digitGroups?: number[]
    /**
     * حروف عربیِ هم‌شکل با فارسی (ي، ى، ك، ة) را حین تایپ به معادل فارسی
     * تبدیل می‌کند تا کیبورد عربی و فارسی مقدار یکسانی بدهند — وگرنه دو
     * ورودی که به چشم یکی‌اند در جستجو و پایگاه‌داده دو مقدار متفاوت
     * می‌شوند. پیش‌فرض روشن است؛ برای فیلدی که باید نویسهٔ خام را حفظ کند
     * (کد، ایمیل و مانند آن) با normalizeArabic={false} خاموشش کنید.
     */
    normalizeArabic?: boolean
    /** متن دکمهٔ انتخاب فایل (فقط type="file"). */
    fileButtonLabel?: string
    /** متن جای‌خالی وقتی هنوز فایلی انتخاب نشده (فقط type="file"). */
    filePlaceholder?: string
  }

/* ------------------------------------------------------------------ *
 * ارقام فارسی و جداکنندهٔ هزارگان
 * ------------------------------------------------------------------ */

const ANY_DIGIT = /[0-9۰-۹٠-٩]/
/** جداکننده‌هایی که خودمان می‌گذاریم یا کاربر ممکن است تایپ کند. */
const GROUP_SEPARATORS = /[٬,]/g
/** جداکنندهٔ هزارگان فارسی (U+066C)، همان چیزی که Intl با locale fa-IR می‌دهد. */
const GROUP_SEPARATOR = "٬"

function countDigits(value: string): number {
  return (value.match(/[0-9۰-۹٠-٩]/g) ?? []).length
}

/** جای مکان‌نما بعد از n اُمین رقم؛ چون گروه‌بندی طول رشته را عوض می‌کند. */
function caretAfterDigits(value: string, digits: number): number {
  if (digits <= 0) return 0
  let seen = 0
  for (let index = 0; index < value.length; index++) {
    if (ANY_DIGIT.test(value[index])) {
      seen++
      if (seen === digits) return index + 1
    }
  }
  return value.length
}

/** ۱۲۳۴۵۶۷.۸۹ → ۱٬۲۳۴٬۵۶۷.۸۹ — فقط بخش صحیح گروه‌بندی می‌شود. */
function groupThousands(latin: string): string {
  const [integer, ...fraction] = latin.split(".")
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR)
  return fraction.length > 0 ? `${grouped}.${fraction.join("")}` : grouped
}

/** 6104337852 با [4,4,4,4] → «6104 3378 52». */
function splitDigitGroups(latin: string, groups: number[]): string {
  const parts: string[] = []
  let index = 0
  for (const size of groups) {
    if (index >= latin.length) break
    parts.push(latin.slice(index, index + size))
    index += size
  }
  return parts.join(" ")
}

/** مقدار را بدون شکستن حالت controlled پاک می‌کند تا onChange ری‌اکت هم شلیک شود. */
function setNativeValue(element: HTMLInputElement, value: string) {
  const descriptor = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )
  descriptor?.set?.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
}

function spacingClasses(spacing: ContentSpacing, side: "start" | "end") {
  if (spacing === "flush") {
    return {
      // گوشه‌های دکمه با overflow-hidden ظرف بریده می‌شوند تا دقیقاً روی
      // گردیِ فیلد بنشیند، هر شعاعی که داشته باشد.
      padding: side === "start" ? "ps-0" : "pe-0",
      content: "h-full self-stretch [&>*]:h-full [&>*]:rounded-none",
      margin: side === "start" ? "me-2" : "ms-2",
    }
  }
  if (spacing === "tight") {
    return {
      // فاصلهٔ دکمه تا لبه از هر سه طرف باید یکی باشد: pe-1 فاصلهٔ افقی را
      // ۴ پیکسل می‌کند و my-1 همان ۴ پیکسل را بالا و پایین می‌گذارد؛
      // self-stretch باعث می‌شود دکمه دقیقاً بقیهٔ ارتفاع را پر کند، پس با
      // هر اندازهٔ فیلد هم‌چنان قرینه می‌ماند.
      padding: side === "start" ? "ps-1" : "pe-1",
      content: "my-1 self-stretch [&>*]:h-full",
      margin: side === "start" ? "me-1.5" : "ms-1.5",
    }
  }
  return {
    padding: "",
    content: "",
    margin: side === "start" ? "me-2" : "ms-2",
  }
}

const adornmentClasses =
  // svg را block می‌کنیم تا روی خط پایهٔ متن ننشیند و دقیقاً وسط ارتفاع فیلد
  // بیفتد؛ دکمهٔ داخلش هم به همین دلیل flex می‌شود.
  "flex shrink-0 items-center leading-none [&_button]:inline-flex [&_button]:items-center [&_svg]:block [&_svg]:size-4 [&_svg]:shrink-0"

function Input({
  className,
  inputClassName,
  type,
  variant = "default",
  color = "default",
  size: sizeProp,
  radius,
  fullWidth = true,
  startContent,
  endContent,
  startContentSpacing = "default",
  endContentSpacing = "default",
  startContentClassName,
  endContentClassName,
  clearable = false,
  onClear,
  onValueChange,
  onChange,
  hidePlaceholderOnFocus = true,
  clearButtonLabel = "پاک‌کردن",
  faDigits,
  groupDigits,
  digitGroups,
  normalizeArabic = true,
  fileButtonLabel = "انتخاب فایل",
  filePlaceholder = "فایلی انتخاب نشده",
  ref,
  ...props
}: InputProps) {
  const innerRef = React.useRef<HTMLInputElement>(null)
  React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement, [])
  const size = sizeProp ?? "auto"

  const isFile = type === "file"
  const useNormalizeArabic = normalizeArabic && !isFile

  /**
   * هر فیلدی که ذاتاً عددی است پیش‌فرض ارقام فارسی می‌گیرد؛ لازم نیست جای
   * جای پروژه یادتان بماند. با faDigits={false} می‌شود خاموشش کرد و با
   * faDigits روی یک فیلد متنی روشن.
   */
  const numericByNature =
    type === "number" ||
    type === "tel" ||
    props.inputMode === "numeric" ||
    props.inputMode === "decimal" ||
    props.inputMode === "tel"
  const useFaDigits = faDigits ?? numericByNature

  // در type=number مرورگر اصلاً اجازهٔ تایپ رقم فارسی نمی‌دهد و مقدار را
  // نامعتبر می‌شمارد، پس به text سوییچ می‌کنیم و کیبورد عددی را با inputMode
  // می‌گیریم. min/max/step دیگر اعمال نمی‌شوند و اعتبارسنجی با شماست.
  const resolvedType =
    useFaDigits && (type === "number" || type === undefined) ? "text" : type
  const resolvedInputMode =
    props.inputMode ??
    (useFaDigits ? (type === "tel" ? "tel" : "numeric") : undefined)

  // گروه‌بندی هزارگان برای مبلغ منطقی است ولی برای کد ملی و شمارهٔ کارت نه،
  // پس پیش‌فرض را به inputMode گره می‌زنیم.
  const useDigitGroups = useFaDigits && digitGroups !== undefined && digitGroups.length > 0
  const groupedLength = useDigitGroups ? digitGroups.reduce((sum, size) => sum + size, 0) : 0
  const useGroupDigits =
    useFaDigits && !useDigitGroups && (groupDigits ?? resolvedInputMode === "decimal")

  /** رشتهٔ تایپ‌شده → مقدار لاتینِ بدون جداکننده (چیزی که به فرم می‌رود). */
  const toBareLatin = (value: string) => {
    const latin = toEnDigits(value).replace(/[٫،]/g, ".")
    if (useDigitGroups) return latin.replace(/\D/g, "").slice(0, groupedLength)
    const bare = useGroupDigits ? latin.replace(GROUP_SEPARATORS, "") : latin
    // فیلدِ عددی حرف نمی‌پذیرد: «صقثص» در موبایل یا کد ملی همان‌جا حذف می‌شود.
    // مبلغ ممیز و شماره تلفن + را نگه می‌دارد.
    if (resolvedInputMode === "numeric") return bare.replace(/\D/g, "")
    if (resolvedInputMode === "decimal") return bare.replace(/[^\d.]/g, "")
    if (resolvedInputMode === "tel") return bare.replace(/[^\d+]/g, "")
    return bare
  }

  /** مقدار لاتین → رشته‌ای که کاربر می‌بیند. */
  const toDisplay = (bare: string) =>
    toFaDigits(
      useDigitGroups
        ? splitDigitGroups(bare, digitGroups)
        : useGroupDigits
          ? groupThousands(bare)
          : bare
    )

  /**
   * فرم‌های دیگ فارسی‌اند، پس مکان‌نما باید از راست شروع کند — و
   * `dir="auto"` این کار را نمی‌کند: تا وقتی فیلد خالی است هیچ نویسهٔ قوی‌ای
   * وجود ندارد و مرورگر به LTR برمی‌گردد، یعنی مکان‌نما می‌پرد سمت چپ و
   * placeholder فارسی هم بد می‌شکند («…جستجو» به‌جای «جستجو…»).
   *
   * پس پیش‌فرض rtl است، مگر محتوایی که ذاتاً لاتین است: عدد، ایمیل، نشانی و
   * شمارهٔ تماس. متن لاتینی که در فیلد rtl تایپ شود همچنان درست و چپ‌به‌راست
   * رندر می‌شود؛ فقط تراز کل خط راست می‌ماند.
   */
  const latinByNature =
    useFaDigits ||
    resolvedType === "number" ||
    resolvedType === "email" ||
    resolvedType === "url" ||
    resolvedType === "tel" ||
    resolvedInputMode === "numeric" ||
    resolvedInputMode === "decimal" ||
    resolvedInputMode === "tel"
  const resolvedDir = props.dir ?? (latinByNature ? "ltr" : "rtl")

  // فقط «خالی یا پر بودن» را نگه می‌داریم، نه خود مقدار را؛ این‌طور تایپ‌کردن
  // در حالت uncontrolled فقط یک بار (لحظهٔ خالی↔پر شدن) رندر دوباره می‌سازد.
  const [filled, setFilled] = React.useState(
    () => String(props.defaultValue ?? props.value ?? "").length > 0
  )
  const [fileNames, setFileNames] = React.useState<string[]>([])
  const isControlled = props.value !== undefined
  const hasValue = isControlled ? String(props.value ?? "").length > 0 : filled

  // مقدار لاتین برای ارسال فرم؛ در حالت controlled از prop می‌آید.
  const [uncontrolledLatin, setUncontrolledLatin] = React.useState(() =>
    toBareLatin(String(props.defaultValue ?? ""))
  )
  const latinValue = isControlled
    ? toBareLatin(String(props.value ?? ""))
    : uncontrolledLatin

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const element = event.currentTarget

    // قبل از منطق ارقام اجرا می‌شود تا toBareLatin/toDisplay روی مقدارِ از
    // قبل یکدست‌شده کار کنند؛ جایگزینی حرف‌به‌حرف است، پس مکان‌نما هم با
    // شمردن طول پیشوندِ نرمال‌شده درست می‌ماند.
    if (useNormalizeArabic) {
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

    // فیلدِ لاتین (ایمیل، نشانی، کد): رقمِ فارسی یا عربی همان‌جا لاتین می‌شود تا
    // هم لاتین دیده شود و هم لاتین به سرور برسد. جایگزینی نویسه‌به‌نویسه است،
    // پس مکان‌نما جابه‌جا نمی‌شود.
    if (!useFaDigits && !isFile && resolvedDir === "ltr" && /[۰-۹٠-٩]/.test(element.value)) {
      const caret = element.selectionStart
      element.value = toEnDigits(element.value)
      if (caret !== null) element.setSelectionRange(caret, caret)
    }

    if (useFaDigits) {
      // مکان‌نما را با «چندمین رقم» می‌شماریم نه با اندیس نویسه، چون
      // گروه‌بندی هزارگان طول رشته را عوض می‌کند و اندیس بی‌معنا می‌شود.
      const caret = element.selectionStart
      const digitsBeforeCaret =
        caret === null ? null : countDigits(element.value.slice(0, caret))

      const bare = toBareLatin(element.value)
      const shown = toDisplay(bare)

      if (shown !== element.value) {
        element.value = shown
        if (digitsBeforeCaret !== null) {
          const position = caretAfterDigits(shown, digitsBeforeCaret)
          element.setSelectionRange(position, position)
        }
      }
      setUncontrolledLatin(bare)
    }

    if (isFile) {
      setFileNames(Array.from(element.files ?? []).map((file) => file.name))
    }

    setFilled(element.value.length > 0)
    onValueChange?.(useFaDigits ? toBareLatin(element.value) : element.value)
    onChange?.(event)
  }

  const handleClear = () => {
    const element = innerRef.current
    if (element) {
      setNativeValue(element, "")
      element.focus()
    }
    setFilled(false)
    setUncontrolledLatin("")
    setFileNames([])
    onValueChange?.("")
    onClear?.()
  }

  const start = spacingClasses(startContentSpacing, "start")
  const end = spacingClasses(endContentSpacing, "end")
  const hasFlush =
    (startContent && startContentSpacing === "flush") ||
    (endContent && endContentSpacing === "flush")

  // در حالت controlled خودِ ری‌اکت value را روی DOM می‌نویسد، پس باید همان‌جا
  // فارسی‌شده تحویلش بدهیم وگرنه با تبدیلِ داخل onChange کشمکش می‌کند.
  const displayValue =
    useFaDigits && props.value !== undefined
      ? toDisplay(toBareLatin(String(props.value)))
      : useNormalizeArabic && typeof props.value === "string"
        ? normalizeArabicChars(props.value)
        : props.value
  const displayDefaultValue =
    useFaDigits && props.defaultValue !== undefined
      ? toDisplay(toBareLatin(String(props.defaultValue)))
      : useNormalizeArabic && typeof props.defaultValue === "string"
        ? normalizeArabicChars(props.defaultValue)
        : props.defaultValue

  return (
    <div
      data-slot="input-root"
      data-variant={variant}
      data-color={color}
      data-size={size}
      data-filled={hasValue ? "true" : "false"}
      // جهت روی کل کادر می‌نشیند تا startContent هم‌جهت متن باشد: در فیلد
      // فارسی سمت راست و در فیلد ایمیل/عدد سمت چپ.
      dir={resolvedDir}
      className={cn(
        inputVariants({ variant, color, size, radius, fullWidth }),
        startContent && start.padding,
        endContent && end.padding,
        // دکمهٔ فارسیِ انتخاب فایل هم مثل دکمهٔ داخل فیلد فاصلهٔ قرینه می‌گیرد.
        isFile && "ps-1",
        hasFlush && "overflow-hidden",
        className
      )}
    >
      {startContent && (
        <span
          data-slot="input-start"
          className={cn(adornmentClasses, start.content, start.margin, startContentClassName)}
        >
          {startContent}
        </span>
      )}

      <input
        ref={innerRef}
        type={resolvedType}
        inputMode={resolvedInputMode}
        data-slot="input"
        dir={resolvedDir}
        onChange={handleChange}
        className={cn(
          inputElementClasses,
          "text-start",
          // فونتِ پیش‌فرض با ss02 رقمِ لاتین را هم فارسی می‌کشد؛ در ایمیل، نشانی
          // و کدِ لاتین «na3ri» نباید «na۳ri» دیده شود.
          resolvedDir === "ltr" && !useFaDigits && "[font-feature-settings:'ss01'_1,'ss02'_0]",
          hidePlaceholderOnFocus && "focus:placeholder:opacity-0",
          clearable && "[&::-webkit-search-cancel-button]:hidden",
          // ورودی فایل روی کل کادر پهن و نامرئی می‌شود تا کلیک در هر نقطهٔ
          // فیلد پنجرهٔ انتخاب فایل را باز کند و دکمهٔ فارسیِ ما زیرش دیده شود.
          isFile && "absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0",
          inputClassName
        )}
        // دیکشنری غلط‌یابِ مرورگر فارسی نیست و زیر متنِ درستِ فارسی خط قرمز
        // می‌کشد؛ پیش‌فرض خاموش است ولی قابل بازنویسی مانده.
        spellCheck={false}
        // name را در حالت faDigits به input مخفی می‌دهیم تا سرور رقم لاتین
        // بگیرد، نه ۰۱۲۳ فارسی.
        {...props}
        name={useFaDigits ? undefined : props.name}
        value={displayValue}
        defaultValue={displayDefaultValue}
        // با digitGroups طولِ رقم‌ها را خودِ toBareLatin محدود می‌کند؛ maxLengthِ
        // رقمی (مثلاً ۱۶) فاصله‌ها را حساب نمی‌کند و تایپ را زودتر می‌بندد.
        maxLength={useDigitGroups ? groupedLength + digitGroups.length - 1 : props.maxLength}
      />

      {useFaDigits && props.name && (
        <input type="hidden" name={props.name} value={latinValue} />
      )}

      {isFile && <FileFace label={fileButtonLabel} names={fileNames} placeholder={filePlaceholder} />}

      {clearable && (
        <button
          type="button"
          data-slot="input-clear"
          aria-label={clearButtonLabel}
          tabIndex={-1}
          // جایش همیشه رزرو است تا ظاهرشدنش عرض متن را جابه‌جا نکند.
          className={cn(
            // آیکون ۱۶ پیکسل، ناحیهٔ لمس ۳۶ (p-2.5)؛ رنگِ ملایم به‌جای opacity.
            "-me-2 ms-0.5 flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2.5 text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/50 [&_svg]:block [&_svg]:size-4",
            !hasValue && "pointer-events-none invisible"
          )}
          onClick={handleClear}
        >
          <X />
        </button>
      )}

      {endContent && (
        <span
          data-slot="input-end"
          className={cn(adornmentClasses, end.content, end.margin, endContentClassName)}
        >
          {endContent}
        </span>
      )}
    </div>
  )
}

/**
 * ظاهر فارسیِ ورودی فایل: دکمهٔ «انتخاب فایل» در ابتدای فیلد (یعنی سمت راست
 * در چیدمان راست‌به‌چپ) و نام فایل کنارش. خودِ input نامرئی روی کل کادر است،
 * پس اینجا فقط نمایش است و pointer-events ندارد.
 */
function FileFace({
  label,
  names,
  placeholder,
}: {
  label: string
  names: string[]
  placeholder: string
}) {
  return (
    <span
      data-slot="input-file"
      className="pointer-events-none flex h-full min-w-0 flex-1 items-center gap-2 leading-none"
    >
      {/* دکمه از سه طرفی که به حاشیهٔ فیلد می‌رسد باید فاصلهٔ یکسان داشته
          باشد: ps-1 روی کادر فاصلهٔ کناری را ۴ پیکسل می‌کند و my-1 همان ۴
          پیکسل را بالا و پایین می‌گذارد؛ self-stretch بقیهٔ ارتفاع را پر
          می‌کند، پس در هر اندازهٔ فیلد قرینه می‌ماند. */}
      <span className="my-1 inline-flex shrink-0 items-center self-stretch rounded-sm bg-secondary px-2.5 text-xs font-medium text-secondary-foreground">
        {label}
      </span>
      <span
        dir="auto"
        className={cn(
          "min-w-0 truncate",
          names.length > 0 ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {names.length === 0
          ? placeholder
          : names.length === 1
            ? names[0]
            : `${toFaDigits(names.length)} فایل انتخاب شد`}
      </span>
    </span>
  )
}

export { Input, inputVariants, setNativeValue, type InputProps }
