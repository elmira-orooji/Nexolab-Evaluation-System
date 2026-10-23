"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { autoControlHeight, autoControlText } from "@/components/ui/control-size"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Portal } from "@/lib/primitives/portal"
import { usePresence } from "@/lib/primitives/use-presence"
import { useControllableState } from "@/lib/primitives/use-controllable-state"
import { useDismissableLayer } from "@/lib/primitives/use-dismissable-layer"
import { useFloatingPosition } from "@/lib/primitives/use-floating-position"
import { transformOriginFor, type Align, type Side } from "@/lib/primitives/positioning"
import { useMenuTypeahead } from "@/lib/primitives/menu"
import { CheckIcon, ChevronDownIcon } from "@/components/icons"

/** گزینه‌های فعال داخل نزدیک‌ترین listbox، به ترتیب DOM. */
function getSelectOptions(container: HTMLElement | null): HTMLElement[] {
  if (!container) return []
  return Array.from(
    container.querySelectorAll<HTMLElement>('[role="option"]:not([data-disabled])')
  ).filter((el) => el.closest('[role="listbox"]') === container)
}

/**
 * فوکوس روی اولین گزینهٔ انتخاب‌شده (یا اولین گزینه)، با تلاش دوباره تا وقتی
 * container واقعاً متصل و visible شود — همان الگوی focusFirstItemOnceReady
 * در منوها، اینجا با اولویت گزینهٔ از پیش‌انتخاب‌شده. در حالت چندانتخابی هم
 * همین کافی است چون فقط جای شروع پیمایش کیبورد را تعیین می‌کند.
 */
function focusSelectedOptionOnceReady(
  getContainer: () => HTMLElement | null,
  getSelectedValues: () => string[],
  maxAttempts = 10
): () => void {
  let cancelled = false
  let attempts = 0

  function attempt() {
    if (cancelled) return
    const container = getContainer()
    const options = getSelectOptions(container)
    const isVisible =
      container && getComputedStyle(container).visibility !== "hidden"
    if (options.length > 0 && isVisible) {
      const selectedValues = getSelectedValues()
      const target =
        options.find((el) =>
          selectedValues.includes(el.getAttribute("data-value") ?? "")
        ) ?? options[0]
      target.focus()
      // خودِ focus() گاهی بی‌صدا جواب نمی‌دهد (لایه‌بندی/layout هنوز کامل
      // نشده)؛ اگر واقعاً نگرفت، به‌جای رها کردن دوباره تلاش می‌کنیم.
      if (document.activeElement === target) return
    }
    attempts++
    if (attempts < maxAttempts) requestAnimationFrame(attempt)
  }

  attempt()
  return () => {
    cancelled = true
  }
}

function handleListboxKeyDown(
  event: React.KeyboardEvent,
  container: HTMLElement | null,
  typeahead: ReturnType<typeof useMenuTypeahead>
) {
  const options = getSelectOptions(container)
  if (options.length === 0) return

  const currentIndex = options.indexOf(document.activeElement as HTMLElement)

  if (event.key === "ArrowDown") {
    event.preventDefault()
    options[(currentIndex + 1 + options.length) % options.length]?.focus()
  } else if (event.key === "ArrowUp") {
    event.preventDefault()
    options[(currentIndex - 1 + options.length) % options.length]?.focus()
  } else if (event.key === "Home") {
    event.preventDefault()
    options[0]?.focus()
  } else if (event.key === "End") {
    event.preventDefault()
    options[options.length - 1]?.focus()
  } else if (typeahead(event.key, options)) {
    event.preventDefault()
  }
}

const REACT_LAZY_TYPE = Symbol.for("react.lazy")

/**
 * وقتی عنصری از میان مرز سرور-به-کلاینت به‌عنوان children رد می‌شود،
 * ترنسپایلر گاهی نوع آن را به‌جای خودِ کامپوننت، یک ارجاع react.lazy
 * از‌پیش‌برطرف‌نشده می‌فرستد — همان مشکلی که در Slot با unwrapLazyChildren
 * حل شد، اینجا برای type به‌جای children.
 */
function resolveElementType(type: unknown): unknown {
  const lazy = type as {
    $$typeof?: symbol
    _payload?: { status?: string; value?: unknown }
    _init?: (payload: unknown) => unknown
  } | null
  if (lazy && typeof lazy === "object" && lazy.$$typeof === REACT_LAZY_TYPE) {
    if (lazy._payload?.status !== "fulfilled" && lazy._init) {
      lazy._init(lazy._payload)
    }
    if (lazy._payload?.status === "fulfilled") {
      return resolveElementType(lazy._payload.value)
    }
  }
  return type
}

/**
 * SelectItemDescription زیرمتنی است که فقط داخل فهرست باز نمایش داده
 * می‌شود؛ در برچسبِ Trigger (SelectValue) نباید تکرار شود، پس هنگام جمع‌
 * کردن برچسب‌ها از درخت فرزندان حذفش می‌کنیم — حتی اگر داخل یک بستهٔ
 * میانی (مثل یک div ستونی برای چیدن برچسب/توضیح زیر هم) پیچیده شده باشد.
 */
function stripItemDescription(node: React.ReactNode): React.ReactNode {
  return React.Children.map(node, (child) => {
    if (!React.isValidElement(child)) return child
    if (resolveElementType(child.type) === SelectItemDescription) return null
    const props = child.props as { children?: React.ReactNode } | undefined
    if (!props?.children) return child
    return React.cloneElement(
      child as React.ReactElement<{ children?: React.ReactNode }>,
      undefined,
      stripItemDescription(props.children)
    )
  })
}

/**
 * برچسب هر SelectItem را با پیمایش خودِ درخت React جمع می‌کند — نه از
 * طریق ثبت‌نام حین mount — چون children در همان درخت منطقی Select زیر
 * دست است (فقط جای DOM آن با Portal عوض می‌شود، نه ساختار React).
 */
function collectItemLabels(
  children: React.ReactNode,
  map: Map<string, React.ReactNode>
) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    const type = resolveElementType(child.type)
    if (type === SelectItem) {
      const props = child.props as { value: string; children?: React.ReactNode }
      map.set(props.value, stripItemDescription(props.children))
      return
    }
    const props = child.props as { children?: React.ReactNode } | undefined
    if (props?.children) collectItemLabels(props.children, map)
  })
}

type SelectContextValue = {
  /** همیشه آرایه است؛ در حالت تک‌انتخابی صفر یا یک عضو دارد. */
  value: string[]
  toggleValue: (value: string) => void
  multiple: boolean
  open: boolean
  setOpen: (open: boolean) => void
  disabled: boolean
  dir: "rtl" | "ltr"
  triggerRef: React.RefObject<HTMLElement | null>
  setTrigger: (node: HTMLElement | null) => void
  labelMap: Map<string, React.ReactNode>
  contentId: string
}
const SelectContext = React.createContext<SelectContextValue | null>(null)

type SelectSingleProps = {
  multiple?: false
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

type SelectMultipleProps = {
  multiple: true
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
}

type SelectProps = (SelectSingleProps | SelectMultipleProps) & {
  disabled?: boolean
  /** حالت باز/بسته کنترل‌شده؛ اگر ندهید، مدیریتش کاملاً داخلی است. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  dir?: "rtl" | "ltr"
  /**
   * نامِ فیلد در فرم. Select بر پایهٔ دکمه و فهرست ساخته شده نه تگِ select،
   * پس بدونِ این مقدار با submitِ بومی یا FormData ارسال نمی‌شد؛ با name یک
   * input مخفی هم‌نام (در حالت multiple یکی به ازای هر گزینه) مقدار را می‌فرستد.
   */
  name?: string
  /** شناسهٔ فرمی که inputهای مخفی به آن تعلق دارند، وقتی Select بیرون از تگ form است. */
  form?: string
  children?: React.ReactNode
}

function Select(props: SelectProps) {
  const {
    disabled = false,
    dir = "rtl",
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    name,
    form,
    children,
  } = props
  const multiple = props.multiple === true
  // دو کست عمدی: props واقعاً یکی از این دو شکل است، multiple همین الان
  // بین آن‌ها تصمیم گرفته — TS خودش این تبعیض را از میان یک متغیر میانی
  // دنبال نمی‌کند، پس دستی مشخص می‌کنیم.
  const singleProps = props as SelectSingleProps
  const multipleProps = props as SelectMultipleProps

  const normalizedValue = multiple
    ? multipleProps.value
    : singleProps.value !== undefined
      ? singleProps.value
        ? [singleProps.value]
        : []
      : undefined
  const normalizedDefault = multiple
    ? (multipleProps.defaultValue ?? [])
    : singleProps.defaultValue
      ? [singleProps.defaultValue]
      : []

  const [values, setValues] = useControllableState<string[]>({
    value: normalizedValue,
    defaultValue: normalizedDefault,
    onChange: (next) => {
      if (multiple) multipleProps.onValueChange?.(next)
      else singleProps.onValueChange?.(next[0] ?? "")
    },
  })

  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })

  const toggleValue = React.useCallback(
    (value: string) => {
      if (multiple) {
        setValues(
          values.includes(value)
            ? values.filter((v) => v !== value)
            : [...values, value]
        )
      } else {
        setValues([value])
        setOpen(false)
      }
    },
    [multiple, values, setValues, setOpen]
  )

  const triggerRef = React.useRef<HTMLElement | null>(null)
  const setTrigger = React.useCallback((node: HTMLElement | null) => {
    triggerRef.current = node
  }, [])
  const contentId = React.useId()

  const labelMap = React.useMemo(() => {
    const map = new Map<string, React.ReactNode>()
    collectItemLabels(children, map)
    return map
  }, [children])

  const context = React.useMemo<SelectContextValue>(
    () => ({
      value: values,
      toggleValue,
      multiple,
      open,
      setOpen,
      disabled,
      dir,
      triggerRef,
      setTrigger,
      labelMap,
      contentId,
    }),
    [
      values,
      toggleValue,
      multiple,
      open,
      setOpen,
      disabled,
      dir,
      setTrigger,
      labelMap,
      contentId,
    ]
  )

  return (
    <SelectContext.Provider value={context}>
      {children}
      {name &&
        (multiple ? (
          values.map((value) => (
            <input key={value} type="hidden" name={name} form={form} value={value} disabled={disabled} />
          ))
        ) : (
          <input type="hidden" name={name} form={form} value={values[0] ?? ""} disabled={disabled} />
        ))}
    </SelectContext.Provider>
  )
}

function SelectGroup({ ...props }: React.ComponentProps<"div">) {
  return <div role="group" data-slot="select-group" {...props} />
}

function SelectValue({
  placeholder,
  className,
  /** فقط در حالت چندانتخابی معنا دارد: هر گزینهٔ انتخاب‌شده را به‌جای متنِ به‌هم‌چسبیده، به‌شکل چیپ نشان می‌دهد. Trigger باید ارتفاعش را با className (مثلاً h-auto) آزاد بگذارد تا چیپ‌ها بتوانند به سطر بعد بروند. */
  chips = false,
  ...props
}: React.ComponentProps<"span"> & {
  placeholder?: React.ReactNode
  chips?: boolean
}) {
  const context = React.useContext(SelectContext)
  const selectedValues = context?.value ?? []
  const hasSelection = selectedValues.length > 0

  if (chips && hasSelection) {
    return (
      <span
        data-slot="select-value"
        className={cn("flex flex-wrap items-center gap-1", className)}
        {...props}
      >
        {selectedValues.map((value) => (
          <Badge key={value} variant="outline" className="pointer-events-none">
            {context?.labelMap.get(value)}
          </Badge>
        ))}
      </span>
    )
  }

  // برچسبِ گزینه‌ها ReactNode است، نه رشته؛ join روی آن‌ها برچسبِ چندتکه‌ای
  // («حساب جاری · موجودی …») را با کاما به یک رشته تبدیل می‌کرد. جداکنندهٔ
  // «، » فقط بینِ گزینه‌های انتخاب‌شده می‌نشیند.
  const label = hasSelection
    ? selectedValues.map((value, index) => (
        <React.Fragment key={value}>
          {index > 0 && "، "}
          {context?.labelMap.get(value) ?? ""}
        </React.Fragment>
      ))
    : undefined

  return (
    <span
      data-slot="select-value"
      data-placeholder={hasSelection ? undefined : ""}
      className={cn("line-clamp-1 flex items-center gap-2", className)}
      {...props}
    >
      {label ?? placeholder}
    </span>
  )
}

type SelectTriggerSize = "sm" | "default" | "lg" | "xl"

/** هم‌پلهٔ Input و Button تا یک ردیف فرم هم‌ارتفاع بماند. */
const SELECT_TRIGGER_SIZE: Record<SelectTriggerSize | "auto", string> = {
  sm: "h-8 px-2.5",
  default: "h-9",
  lg: "h-10 px-4 text-base",
  xl: "h-12 px-4 text-base",
  // بدون prop اندازه، از نزدیک‌ترین ControlSizeProvider پیروی می‌کند.
  auto: cn(autoControlHeight, autoControlText, "px-[var(--control-field-px,calc(var(--spacing)*3))]"),
}

function SelectTrigger({
  className,
  size: sizeProp,
  children,
  onClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"button"> & { size?: SelectTriggerSize }) {
  const context = React.useContext(SelectContext)
  const size = sizeProp ?? "auto"

  const setRef = React.useCallback(
    (node: HTMLButtonElement | null) => context?.setTrigger(node),
    [context]
  )

  return (
    <button
      ref={setRef}
      type="button"
      data-slot="select-trigger"
      data-size={size}
      data-placeholder={context?.value.length ? undefined : ""}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={context?.open}
      aria-controls={context?.contentId}
      disabled={context?.disabled}
      onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented || context?.disabled) return
        context?.setOpen(!context.open)
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || context?.disabled) return
        if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
          event.preventDefault()
          context?.setOpen(true)
        }
      }}
      className={cn(
        // border-input و bg-input در تم تیره یک توکن‌اند؛ پرشدگی باید توپُر
        // بماند، پس به‌جای کم‌رنگ کردن آن، حاشیه را در تم تیره جدا از
        // accent/input نگه می‌داریم.
        "flex w-fit items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm whitespace-nowrap shadow-control transition-[color,box-shadow,border-color] outline-none hover:border-foreground/35 hover:brightness-95 focus-visible:border-foreground focus-visible:outline-1 focus-visible:-outline-offset-1 focus-visible:outline-foreground focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-foreground)_12%,var(--color-background))] disabled:cursor-not-allowed disabled:border-transparent disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:hover:brightness-100 aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:focus-visible:outline-destructive aria-invalid:focus-visible:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-destructive)_12%,var(--color-background))] data-[placeholder]:text-placeholder *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input dark:border-foreground/25 dark:hover:brightness-125 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        SELECT_TRIGGER_SIZE[size],
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4" />
    </button>
  )
}

function SelectContent({
  className,
  children,
  side = "bottom",
  align = "start",
  sideOffset = 4,
  ...props
}: React.ComponentProps<"div"> & {
  side?: Side
  align?: Align
  sideOffset?: number
}) {
  const context = React.useContext(SelectContext)
  const { shouldRender, ref: presenceRef } = usePresence(Boolean(context?.open))
  const contentRef = React.useRef<HTMLDivElement>(null)
  const typeahead = useMenuTypeahead()

  const position = useFloatingPosition(
    context?.triggerRef ?? contentRef,
    contentRef,
    Boolean(context?.open),
    { side, align, sideOffset }
  )

  useDismissableLayer({
    ref: contentRef,
    ignoreRef: context?.triggerRef,
    enabled: Boolean(context?.open),
    onDismiss: (reason) => {
      context?.setOpen(false)
      if (reason === "escape") context?.triggerRef.current?.focus()
    },
  })

  React.useEffect(() => {
    if (!context?.open) return
    return focusSelectedOptionOnceReady(
      () => contentRef.current,
      () => context.value
    )
    // context عمداً در وابستگی نیست: در حالت چندانتخابی هر بار که یک گزینه
    // تیک/برداشته می‌شود context (شیء جدید از useMemo) عوض می‌شود، ولی
    // فهرست باز می‌ماند — اگر context اینجا بود، این افکت با هر انتخاب
    // دوباره اجرا و فوکوس را به گزینهٔ منتخب/اول برمی‌گرداند، یعنی فوکوس
    // (و اسکرول صفحه به دنبالش) با هر کلیک می‌پرید. این افکت فقط باید یک‌
    // بار در لحظهٔ باز شدن اجرا شود، نه با هر تغییرِ مقدار.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context?.open])

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node
      presenceRef(node)
    },
    [presenceRef]
  )

  if (!shouldRender) return null

  const finalSide = position?.side ?? side
  const finalAlign = position?.align ?? align
  // اولویت با اندازه‌گیریِ همان چرخه‌ای است که x/y هم از آن آمده (تا
  // minWidth هیچ‌وقت از موقعیت عقب نیفتد)؛ در همان تک‌فریمِ اول که هنوز
  // position چیزی برنگردانده (پیش از اولین useLayoutEffect)، یک اندازه‌گیری
  // مستقیم جایگزینش می‌شود تا محتوا از قاب اول هم عرض درست داشته باشد.
  const triggerWidth =
    position?.triggerWidth ??
    context?.triggerRef.current?.getBoundingClientRect().width

  return (
    <Portal>
      <div
        ref={setRefs}
        id={context?.contentId}
        role="listbox"
        aria-multiselectable={context?.multiple || undefined}
        tabIndex={-1}
        dir={context?.dir ?? "rtl"}
        data-slot="select-content"
        data-state={context?.open ? "open" : "closed"}
        data-side={finalSide}
        onKeyDown={(event) => {
          if (event.key === "Escape") return
          handleListboxKeyDown(event, contentRef.current, typeahead)
        }}
        style={
          {
            position: "fixed",
            top: position ? position.y : 0,
            left: position ? position.x : 0,
            width: triggerWidth,
            visibility: position ? "visible" : "hidden",
            "--select-content-transform-origin": transformOriginFor(
              finalSide,
              finalAlign
            ),
          } as React.CSSProperties
        }
        className={cn(
          // Tailwind utilities are important in this app: relative would override
          // the inline fixed position and detach the portal from its trigger.
          "fixed z-(--z-overlay) max-h-96 min-w-[8rem] origin-(--select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-panel data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </Portal>
  )
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-2 py-1.5 text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  value,
  disabled,
  onClick,
  onKeyDown,
  ...props
}: React.ComponentProps<"div"> & { value: string; disabled?: boolean }) {
  const context = React.useContext(SelectContext)
  const multiple = context?.multiple ?? false
  const selected = context?.value.includes(value) ?? false

  function select() {
    if (disabled) return
    context?.toggleValue(value)
    if (!multiple) context?.triggerRef.current?.focus()
  }

  return (
    <div
      role="option"
      aria-selected={selected}
      tabIndex={-1}
      data-slot="select-item"
      data-value={value}
      data-disabled={disabled ? "" : undefined}
      onClick={(event: React.MouseEvent<HTMLDivElement>) => {
        if (disabled) return
        onClick?.(event)
        if (event.defaultPrevented) return
        select()
      }}
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        onKeyDown?.(event)
        if (event.defaultPrevented || disabled) return
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          select()
        }
      }}
      className={cn(
        "relative flex w-full cursor-default items-center gap-2 rounded-md py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:text-placeholder [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
        // آیتم‌های داخل یک SelectGroup چند پیکسل بیشتر از ابتدا فرورفتگی
        // می‌گیرند تا زیرمجموعهٔ برچسبِ گروه بودنشان دیده شود؛ چون این فقط
        // padding داخلی است نه margin/width، ناحیهٔ هایلایت هنگام
        // فوکوس/انتخاب (که همان کادر تمام‌عرضِ خودِ آیتم است) دست‌نخورده
        // می‌ماند.
        multiple
          ? "ps-8 pe-2 [[data-slot=select-group]_&]:ps-10"
          : "ps-2 pe-8 [[data-slot=select-group]_&]:ps-4",
        className
      )}
      {...props}
    >
      {multiple ? (
        <Checkbox
          aria-hidden="true"
          tabIndex={-1}
          checked={selected}
          className="pointer-events-none absolute start-2 cursor-default"
        />
      ) : (
        <span
          data-slot="select-item-indicator"
          className="absolute end-2 flex size-3.5 items-center justify-center"
        >
          {selected && <CheckIcon className="size-4" />}
        </span>
      )}
      {children}
    </div>
  )
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="select-separator"
      className={cn("pointer-events-none -mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  )
}

/**
 * زیرمتن اختیاری زیر برچسب یک SelectItem. برای هم‌ردیف نبودن با برچسب،
 * آن را داخل یک بستهٔ ستونی (مثلاً <div className="flex flex-col">) کنار
 * برچسب بگذارید؛ خودش فقط ظاهر را می‌سازد، نه چیدمان اطراف را.
 */
function SelectItemDescription({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="select-item-description"
      className={cn("block text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectItemDescription,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
