import * as React from "react"

import { Slot } from "@/lib/primitives/slot"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-card",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // عنوان و توضیح یک واحدند: فاصلهٔ ۶ پیکسل، نه ۸؛ توضیح با ارتفاعِ خطِ بازتر.
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  )
}

/** asChild برای عنوانِ معنایی: <CardTitle asChild><h1>…</h1></CardTitle> وقتی عنوانِ کارت عنوانِ اصلیِ صفحه است. */
function CardTitle({ className, asChild = false, ...props }: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="card-title"
      className={cn("text-lg leading-snug font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm leading-6 text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      // سلسله‌مراتبِ فاصله: فیلدها با gap-4 (۱۶) کنارِ هم‌اند، پس دکمهٔ پایانی
      // باید دست‌کم دو برابر (۳۲) جدا بیفتد. مستقیم در Card (یا ظرفِ contents
      // مثل ControlSizeProvider)، gap-6 + mt-2؛ وقتی فرم دورشان است، خودِ mt-8.
      className={cn(
        "flex items-center px-6 [.border-t]:pt-6 [form>[data-slot=card-content]+&]:mt-8 [[data-slot=card]>[data-slot=card-content]+&]:mt-2 [[data-slot=card]>.contents>[data-slot=card-content]+&]:mt-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
