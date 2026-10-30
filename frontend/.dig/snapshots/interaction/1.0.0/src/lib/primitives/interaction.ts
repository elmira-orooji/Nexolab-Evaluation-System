/**
 * اینتراکشن‌های مشترک کنترل‌های دیگ.
 *
 * هر کنترل یک پراپ `interaction` می‌گیرد و آن را فقط وقتی قابل‌تغییر است
 * (نه disabled، نه readOnly) روی `data-interaction` می‌گذارد. همهٔ واکنش‌ها
 * با همین ویژگی و کلاس‌های Tailwind ساخته می‌شوند، پس نسخه‌های فریم‌ورک‌های
 * دیگر هم فقط با گذاشتن همان ویژگی و همان کلاس‌ها هم‌رفتار می‌شوند.
 *
 * قاعده‌ها:
 * - هیچ واکنشی opacity یا رنگ نیم‌شفاف ندارد؛ نمایش و پنهان شدن با scale و
 *   جابه‌جایی است و رنگ‌ها همه توکن توپُرند.
 * - با prefers-reduced-motion همه بدون حرکت می‌شوند (motion-reduce).
 * - پیش‌نمایش هاور (peek) با فوکوس کیبورد هم دیده می‌شود.
 */

/** منحنی حرکت لغزش و جابه‌جایی؛ سریع شروع می‌شود و نرم می‌نشیند. */
export const interactionEase = "ease-[cubic-bezier(0.32,0.72,0,1)]"

/** منحنی جهشی برای ظاهر شدن علامت؛ کمی از اندازهٔ نهایی رد می‌شود و برمی‌گردد. */
export const interactionPopEase = "ease-[cubic-bezier(0.34,1.56,0.64,1)]"

/** جهش پررنگ‌تر برای علامت تیک و نقطه تا pop در یک نگاه از none جدا شود. */
export const interactionStrongPopEase = "ease-[cubic-bezier(0.3,2,0.5,1)]"

/**
 * اینتراکشن‌های Switch:
 * - slide: فقط لغزش دسته و تغییر رنگ ریل (پیش‌فرض)
 * - stretch: دسته هنگام فشردن به سمت مقصد کش می‌آید و بعد می‌لغزد
 * - peek: روی هاور دسته کمی جلو می‌رود و باریکه‌ای از رنگ حالت بعدی پیدا می‌شود
 * - morph: علامت داخل دسته از ○ (خاموش) به | (روشن) تغییر شکل می‌دهد، با کش‌آمدن هنگام فشردن
 * - hint: روی هاور یک فلش در ریل، جهت حرکت دسته را نشان می‌دهد
 */
export type SwitchInteraction = "slide" | "stretch" | "peek" | "morph" | "hint"

/**
 * اینتراکشن‌های Tabs (روی خود Tabs داده می‌شود و به همهٔ برگه‌ها می‌رسد):
 * - none: پس‌زمینهٔ برگهٔ فعال بی‌درنگ جابه‌جا می‌شود (پیش‌فرض)
 * - press: برگه هنگام فشردن کمی کوچک می‌شود
 * - slide: press + یک قرص واحد از برگهٔ قبلی تا برگهٔ جدید می‌لغزد
 * - stretch: press + قرص مثل کرم‌ابریشم جابه‌جا می‌شود؛ لبهٔ جلو اول می‌رود و
 *   لبهٔ عقب با کمی تأخیر دنبالش می‌آید، پس مسیر حرکت دیده می‌شود
 */
export type TabsInteraction = "none" | "press" | "slide" | "stretch"

/**
 * اینتراکشن دکمه‌مانندها (Button، Toggle، ToggleGroup):
 * - none: بدون حرکت (پیش‌فرض)
 * - press: هنگام فشردن کمی کوچک می‌شود تا کلیک حس فیزیکی داشته باشد
 */
export type PressInteraction = "none" | "press"

/** کلاس فشردن برای دکمه‌مانندها؛ روی عنصری با data-interaction=press یا هر مقدار شامل press. */
export const pressInteraction =
  "data-[interaction=press]:active:scale-[0.96] data-[interaction=slide]:active:scale-[0.96] data-[interaction=stretch]:active:scale-[0.96]"

/**
 * اینتراکشن‌های کنترل‌های انتخابی (Checkbox و RadioGroupItem):
 * - none: بدون حرکت؛ علامت بی‌درنگ ظاهر می‌شود (پیش‌فرض)
 * - press: کنترل هنگام فشردن کمی کوچک می‌شود
 * - pop: press + علامت با یک جهش کوچک ظاهر و با جمع شدن پنهان می‌شود
 * - peek: pop + روی هاور، علامت کم‌رنگ پیش‌نمایش می‌شود تا معلوم باشد کلیک چه می‌کند
 */
export type SelectionInteraction = "none" | "press" | "pop" | "peek"

/**
 * Checkbox علاوه بر مقدارهای بالا یک حالت مخصوص خودش دارد:
 * - draw: press + تیک مثل نوشتن با قلم، از ابتدا تا انتها کشیده می‌شود
 */
export type CheckboxInteraction = SelectionInteraction | "draw"

/**
 * کلاس‌های ریشهٔ کنترل انتخابی. ریشه باید `group/control` باشد و scale را در
 * فهرست transition خودش داشته باشد.
 *
 * فشردن (همهٔ مقدارها به‌جز none) کنترل را تا ۸۲٪ کوچک می‌کند. در pop و peek
 * وقتی کاربر انتخاب می‌کند، خود جعبه هم یک ضربهٔ کوچک می‌خورد (از ۶۵٪ با
 * جهش به اندازهٔ کامل). این ضربه فقط بعد از کلیک کاربر است (data-touched)،
 * نه هنگام بارگذاری صفحه برای گزینه‌هایی که از قبل انتخاب شده‌اند.
 */
export const selectionRootInteraction = [
  "group/control",
  "data-[interaction=press]:active:scale-[0.82] data-[interaction=pop]:active:scale-[0.82] data-[interaction=peek]:active:scale-[0.82] data-[interaction=draw]:active:scale-[0.82]",
  "duration-150 motion-reduce:transition-none",
  "data-[touched=true]:data-[interaction=pop]:data-[state=checked]:animate-in data-[touched=true]:data-[interaction=pop]:data-[state=checked]:zoom-in-65",
  "data-[touched=true]:data-[interaction=peek]:data-[state=checked]:animate-in data-[touched=true]:data-[interaction=peek]:data-[state=checked]:zoom-in-65",
  "data-[interaction=pop]:ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[interaction=pop]:duration-300 data-[interaction=peek]:ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[interaction=peek]:duration-300 motion-reduce:animate-none",
].join(" ")

/**
 * کلاس‌های علامت داخل کنترل انتخابی (تیک یا نقطه).
 *
 * در none و press علامت فقط در حالت انتخاب‌شده دیده می‌شود. در pop و peek
 * همیشه رندر می‌شود و با scale ظاهر و پنهان می‌شود؛ در peek روی هاور با
 * رنگ placeholder تا اندازهٔ کامل بزرگ می‌شود.
 *
 * `peekColor` کلاس رنگ پیش‌نمایش است (مثلاً text-placeholder برای تیک یا
 * fill-placeholder برای نقطه)، چون هر علامت رنگش را از ویژگی متفاوتی می‌گیرد.
 */
export function selectionIndicatorInteraction(
  interaction: SelectionInteraction,
  selected: boolean,
  interactive: boolean,
  peekColor: string
): string {
  if (interaction === "none" || interaction === "press") {
    return selected ? "" : "invisible"
  }

  return [
    `transition-[scale,rotate] duration-300 ${interactionStrongPopEase} motion-reduce:transition-none`,
    selected ? "scale-100 rotate-0" : "scale-0 -rotate-45",
    interaction === "peek" &&
      interactive &&
      !selected &&
      `group-hover/control:scale-100 group-focus-visible/control:scale-100 ${peekColor}`,
  ]
    .filter(Boolean)
    .join(" ")
}

/** آیا کنترل باید علامتش را حتی در حالت انتخاب‌نشده رندر کند (برای pop و peek). */
export function rendersIdleIndicator(interaction: SelectionInteraction): boolean {
  return interaction === "pop" || interaction === "peek"
}
