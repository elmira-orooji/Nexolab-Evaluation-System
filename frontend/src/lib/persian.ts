const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"

/**
 * حروف عربی که با معادل فارسی‌شان روی صفحه یکسان دیده می‌شوند ولی نویسهٔ
 * یونیکد متفاوتی‌اند — کیبورد عربی این شکل را می‌فرستد، کیبورد فارسی آن
 * شکل را؛ بدون یکدست‌کردن، دو ورودیِ «به چشم یکسان» در جستجو و پایگاه‌داده
 * دو مقدار متفاوت می‌شوند.
 */
const ARABIC_TO_PERSIAN: Record<string, string> = {
  "ي": "ی", // ي (yeh عربی) → ی
  "ى": "ی", // ى (الف مقصوره) → ی
  "ك": "ک", // ك (kaf عربی) → ک
  "ة": "ه", // ة (teh marbuta) → ه
}
const ARABIC_CHARS_PATTERN = new RegExp(
  `[${Object.keys(ARABIC_TO_PERSIAN).join("")}]`,
  "g"
)

/**
 * اعراب (فتحتان، ضمتان، کسرتان، فتحه، ضمه، کسره، تشدید، سکون)، الف بالای
 * کوچک و کشیدهٔ عربی؛ در فارسیِ نوشتاری کاربردی ندارند. با کدپوینت به‌جای
 * نویسهٔ نامرئی خام ساخته شده تا در ویرایشگر و دیف قابل‌خواندن بماند.
 */
const ARABIC_DIACRITIC_CODEPOINTS = [
  0x064b, 0x064c, 0x064d, 0x064e, 0x064f, 0x0650, 0x0651, 0x0652, 0x0670,
  0x0640,
]
const ARABIC_DIACRITICS = new RegExp(
  `[${ARABIC_DIACRITIC_CODEPOINTS.map((cp) => String.fromCodePoint(cp)).join("")}]`,
  "g"
)

/**
 * نویسه‌های ظاهراً نامرئی که کپی‌پیست از منابع عربی/وب معمولاً با خودش
 * می‌آورد: فاصلهٔ صفر-عرض و نشانه‌های جهت چپ‌به‌راست/راست‌به‌چپ. نیم‌فاصلهٔ
 * فارسی ZWNJ (U+200C) عمداً اینجا نیست چون در «می‌روم» معنادار است.
 */
const INVISIBLE_CODEPOINTS = [0x200b, 0x200e, 0x200f]
const INVISIBLE_MARKS = new RegExp(
  `[${INVISIBLE_CODEPOINTS.map((cp) => String.fromCodePoint(cp)).join("")}]`,
  "g"
)

/**
 * حروف عربیِ هم‌شکل با فارسی (ي، ى، ك، ة) را به معادل فارسی تبدیل می‌کند و
 * اعراب/کشیدهٔ عربی را حذف می‌کند؛ مقدار همان طول کاراکتری را حفظ می‌کند
 * مگر جایی که اعراب حذف شود.
 *
 * برای Input/Textarea طراحی شده تا کاربر با هر کیبوردی (عربی یا فارسی)
 * تایپ کند، هم روی صفحه و هم در دیتای ذخیره‌شده یک شکل ببیند.
 */
export function normalizeArabicChars(value: string): string {
  return value
    .replace(ARABIC_CHARS_PATTERN, (ch) => ARABIC_TO_PERSIAN[ch])
    .replace(ARABIC_DIACRITICS, "")
}

/**
 * نرمال‌سازی کامل یک رشته برای مقایسه، ذخیره یا کلید جستجو: حروف عربی،
 * ارقام (لاتین/عربی/فارسی همه به فارسی) و فاصله‌های اضافه را یکدست
 * می‌کند. چون ارقام را هم تغییر می‌دهد، برای نمایش مستقیم به کاربر مناسب
 * نیست — برای آن از normalizeArabicChars به‌تنهایی استفاده کنید.
 */
export function normalizePersianText(value: string): string {
  return toFaDigits(normalizeArabicChars(value))
    .replace(INVISIBLE_MARKS, "")
    .replace(/[ \t]+/g, " ")
    .trim()
}

/**
 * کلید مقایسه برای جست‌وجوی فازی: برخلاف normalizePersianText، اینجا نیم‌فاصله
 * (ZWNJ) و همهٔ فاصله‌ها هم حذف می‌شوند. برای نمایش یا ذخیره غلط است («می‌روم»
 * را به «میروم» می‌چسباند)، ولی برای «آیا این عبارت با آن یکی یک چیز است؟»
 * درست است — چون کاربر گاهی «رادیو باتن»، گاهی «رادیوباتن» و گاهی «رادیو‌باتن»
 * تایپ می‌کند و هر سه باید یک نتیجه بدهند. خط تیره و زیرخط هم به همین
 * دلیل حذف می‌شوند: «date picker» و «datepicker» باید با نامِ date-picker
 * جور شوند.
 */
export function toSearchKey(value: string): string {
  return normalizeArabicChars(value)
    .toLowerCase()
    .replace(INVISIBLE_MARKS, "")
    .replace(/[\s‌_-]+/g, "")
}

/** تبدیل ارقام لاتین (و عربی) یک رشته به ارقام فارسی. */
export function toFaDigits(value: string | number): string {
  return String(value).replace(/[0-9٠-٩]/g, (d) => {
    const en = d.charCodeAt(0) - 48
    return FA_DIGITS[en >= 0 && en <= 9 ? en : AR_DIGITS.indexOf(d)]
  })
}

/** تبدیل ارقام فارسی و عربی یک رشته به ارقام لاتین؛ برای پردازش ورودی کاربر. */
export function toEnDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
}

/** قالب‌بندی عدد با جداکنندهٔ هزارگان و ارقام فارسی: ۱۲٬۳۴۵٬۶۷۸ */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("fa-IR", options).format(value)
}

/** قالب‌بندی درصد با ارقام فارسی: ٪۱۲٫۵ */
export function formatPercent(value: number, fractionDigits = 0): string {
  return new Intl.NumberFormat("fa-IR", {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(value)
}

/** قالب‌بندی مبلغ به تومان یا ریال: ۱۲٬۵۰۰ تومان */
export function formatCurrency(
  value: number,
  unit: "toman" | "rial" = "toman"
): string {
  const label = unit === "toman" ? "تومان" : "ریال"
  return `${formatNumber(value)} ${label}`
}

export type JalaliFormat = "full" | "long" | "medium" | "short"

/** قالب‌بندی تاریخ در تقویم جلالی (شمسی): ۵ مرداد ۱۴۰۵ */
export function formatJalali(
  date: Date | number | string,
  format: JalaliFormat = "medium"
): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: format,
  }).format(new Date(date))
}

/** تاریخ و ساعت جلالی: ۵ مرداد ۱۴۰۵، ۱۸:۳۰ */
export function formatJalaliDateTime(date: Date | number | string): string {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["week", 1000 * 60 * 60 * 24 * 7],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
]

/** زمان نسبی فارسی: «۳ روز پیش»، «۲ ساعت بعد»، «هم‌اکنون» */
export function formatRelativeTime(
  date: Date | number | string,
  base: Date = new Date()
): string {
  const diff = new Date(date).getTime() - base.getTime()
  const rtf = new Intl.RelativeTimeFormat("fa", { numeric: "auto" })
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms) {
      return rtf.format(Math.round(diff / ms), unit)
    }
  }
  return "هم‌اکنون"
}

/* ------------------------------------------------------------------ *
 * اعتبارسنجی فیلدهای رایج؛ ارقامِ فارسی و عربی را هم می‌پذیرند.
 * برای پراپ validateِ TextField: پیامِ خطا یا undefined برگردانید.
 * ------------------------------------------------------------------ */

/** کد ملی: ۱۰ رقم با رقمِ کنترلِ درست (۱۱۱۱۱۱۱۱۱۱ و امثالش رد می‌شوند). */
export function isValidNationalId(value: string): boolean {
  const digits = toEnDigits(value).trim()
  if (!/^\d{10}$/.test(digits) || /^(\d)\1{9}$/.test(digits)) return false
  const sum = digits
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0)
  const remainder = sum % 11
  const check = Number(digits[9])
  return remainder < 2 ? check === remainder : check === 11 - remainder
}

/** موبایلِ ایران: ۰۹ و ۹ رقمِ دیگر؛ +۹۸ و ۰۰۹۸ هم پذیرفته می‌شود. */
export function isValidMobile(value: string): boolean {
  const digits = toEnDigits(value).replace(/[\s-]/g, "")
  return /^(?:\+98|0098|0)?9\d{9}$/.test(digits)
}

/** شکلِ کلیِ ایمیل؛ وجودِ صندوق را نمی‌سنجد. */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}
