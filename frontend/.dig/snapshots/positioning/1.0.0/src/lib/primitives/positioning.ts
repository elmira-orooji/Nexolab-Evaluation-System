export type Side = "top" | "right" | "bottom" | "left"
export type Align = "start" | "center" | "end"

interface Rect {
  x: number
  y: number
  width: number
  height: number
}

interface ComputePositionArgs {
  trigger: Rect
  floating: { width: number; height: number }
  side: Side
  align: Align
  sideOffset: number
  collisionPadding: number
  viewport: { width: number; height: number }
  isRtl: boolean
}

export interface PositionResult {
  x: number
  y: number
  side: Side
  align: Align
}

const OPPOSITE: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
}

function resolvePhysicalSide(side: Side, isRtl: boolean): Side {
  if (!isRtl || (side !== "left" && side !== "right")) return side
  return side === "left" ? "right" : "left"
}

/**
 * موقعیت یک عنصر شناور را نسبت به دکمهٔ بازکننده حساب می‌کند: طرف
 * ترجیحی را امتحان می‌کند، اگر جا نبود طرف مقابل را (flip)، و در نهایت
 * محور عرضی را داخل viewport نگه می‌دارد (shift)، بدون کتابخانهٔ جداگانه.
 */
export function computePosition({
  trigger,
  floating,
  side,
  align,
  sideOffset,
  collisionPadding,
  viewport,
  isRtl,
}: ComputePositionArgs): PositionResult {
  const preferredSide = resolvePhysicalSide(side, isRtl)

  function mainAxisPosition(s: Side): { x: number; y: number } {
    switch (s) {
      case "top":
        return { x: trigger.x, y: trigger.y - floating.height - sideOffset }
      case "bottom":
        return { x: trigger.x, y: trigger.y + trigger.height + sideOffset }
      case "left":
        return { x: trigger.x - floating.width - sideOffset, y: trigger.y }
      case "right":
        return { x: trigger.x + trigger.width + sideOffset, y: trigger.y }
    }
  }

  function fitsOnSide(s: Side): boolean {
    const pos = mainAxisPosition(s)
    if (s === "top") return pos.y >= collisionPadding
    if (s === "bottom")
      return pos.y + floating.height <= viewport.height - collisionPadding
    if (s === "left") return pos.x >= collisionPadding
    return pos.x + floating.width <= viewport.width - collisionPadding
  }

  const finalSide =
    !fitsOnSide(preferredSide) && fitsOnSide(OPPOSITE[preferredSide])
      ? OPPOSITE[preferredSide]
      : preferredSide

  const isVertical = finalSide === "top" || finalSide === "bottom"
  const base = mainAxisPosition(finalSide)

  function crossAxisStart(): number {
    if (isVertical) {
      const startX = isRtl
        ? trigger.x + trigger.width - floating.width
        : trigger.x
      const endX = isRtl
        ? trigger.x
        : trigger.x + trigger.width - floating.width
      if (align === "start") return startX
      if (align === "end") return endX
      return trigger.x + trigger.width / 2 - floating.width / 2
    }
    if (align === "start") return trigger.y
    if (align === "end") return trigger.y + trigger.height - floating.height
    return trigger.y + trigger.height / 2 - floating.height / 2
  }

  let x = isVertical ? crossAxisStart() : base.x
  let y = isVertical ? base.y : crossAxisStart()

  // shift: محور عرضی از لبهٔ viewport بیرون نزند.
  if (isVertical) {
    x = Math.min(
      Math.max(x, collisionPadding),
      Math.max(collisionPadding, viewport.width - floating.width - collisionPadding)
    )
  } else {
    y = Math.min(
      Math.max(y, collisionPadding),
      Math.max(collisionPadding, viewport.height - floating.height - collisionPadding)
    )
  }

  return { x, y, side: finalSide, align }
}

/** origin مناسب برای انیمیشن scale، بر اساس طرف و ترازِ نهایی. */
export function transformOriginFor(side: Side, align: Align): string {
  const cross = align === "start" ? "0%" : align === "end" ? "100%" : "50%"
  switch (side) {
    case "top":
      return `${cross} 100%`
    case "bottom":
      return `${cross} 0%`
    case "left":
      return `100% ${cross}`
    case "right":
      return `0% ${cross}`
  }
}
