import type { SVGProps } from "react"

import { cn } from "@/lib/utils"

/**
 * آیکون‌های خطی وندورشده — بدون وابستگی به هیچ بستهٔ npm بیرونی. فقط
 * آیکون‌هایی که واقعاً داخل کامپوننت‌های ui استفاده می‌شوند اینجا اضافه
 * می‌شوند، هر موج به‌اندازهٔ نیاز خودش.
 *
 * آن‌هایی که دیگچه (کاتالوگ آیکونِ خودِ دیگ) معادلِ هم‌شکل داشت از دیگچه
 * گرفته شده‌اند (فقط attributeهای تکراری stroke/stroke-width حذف شده تا از
 * strokeWidth مشترکِ LineIcon تبعیت کنند)؛ بقیه هندسهٔ سادهٔ خودِ دیگ روی
 * شبکهٔ ۲۴ هستند.
 */
function LineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

/** مسیر از دیگچه (اسلاگ tick). */
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M5 12 9.99 17 20 7" />
    </LineIcon>
  )
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m6 9 6 6 6-6" />
    </LineIcon>
  )
}

export function ChevronUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m6 15 6-6 6 6" />
    </LineIcon>
  )
}

/** دو فلش رو به هم، برای ستونی که قابل‌مرتب‌سازی است ولی هنوز فعال نیست؛ فرمش با ChevronUp/ChevronDownِ حالتِ فعال قاطی نمی‌شود. */
export function ChevronsUpDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </LineIcon>
  )
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m15 18-6-6 6-6" />
    </LineIcon>
  )
}

export function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M5 12h14" />
    </LineIcon>
  )
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ search). */
export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M21 11.5C21 16.7467 16.7467 21 11.5 21C6.2533 21 2 16.7467 2 11.5C2 6.2533 6.2533 2 11.5 2C16.7467 2 21 6.2533 21 11.5Z" />
      <path d="M22 22 20 20" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ close). */
export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M7 17 17 7" />
      <path d="M17 17 7 7" />
    </LineIcon>
  )
}

export function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </LineIcon>
  )
}

export function AlertTriangleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </LineIcon>
  )
}

export function CircleXIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </LineIcon>
  )
}

/**
 * پخش: مثلثِ توپر. در RTL هم به راست اشاره می‌کند، چون جهتِ «جلو رفتنِ
 * زمان» در همهٔ پخش‌کننده‌ها قراردادِ جهانی است، نه جهتِ متن.
 */
export function PlayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon fill="currentColor" {...props}>
      <path d="M7 4.8v14.4a1 1 0 0 0 1.5.86l11.4-7.2a1 1 0 0 0 0-1.72L8.5 3.94A1 1 0 0 0 7 4.8z" />
    </LineIcon>
  )
}

export function PauseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon fill="currentColor" {...props}>
      <rect x="6" y="4.5" width="4" height="15" rx="1" />
      <rect x="14" y="4.5" width="4" height="15" rx="1" />
    </LineIcon>
  )
}

/** دانلود یا خروجی گرفتن: فلشِ رو به پایین روی سینی. */
export function DownloadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 17v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
    </LineIcon>
  )
}

/** جای خالیِ تصویر (اسلاگ image-placeholder در دیگچه)؛ برای تصویرِ محصول یا آواتاری که هنوز نیامده. */
export function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M16.2172 3H7.77957C4.8422 3 3 5.08113 3 8.0263V15.9705C3 18.9157 4.8344 20.9968 7.77957 20.9968H16.2123C19.1624 20.9968 20.9958 18.9157 20.9958 15.9705V8.0263C20.9997 5.08113 19.1653 3 16.2172 3Z" />
      <path d="M10.7563 8.88522C10.7563 9.87995 9.95075 10.6855 8.95602 10.6855C7.96227 10.6855 7.15576 9.87995 7.15576 8.88522C7.15576 7.8905 7.96227 7.08496 8.95602 7.08496C9.94978 7.08594 10.7553 7.89147 10.7563 8.88522Z" />
      <path d="M21.0001 14.8985C20.0999 13.972 18.3689 12.1006 16.4867 12.1006C14.6036 12.1006 13.5182 16.2287 11.7072 16.2287C9.89617 16.2287 8.25097 14.3621 6.79983 15.5587C5.3487 16.7544 3.97559 19.1992 3.97559 19.1992" />
    </LineIcon>
  )
}

/* آیکون‌های پرداخت و قبض؛ مسیرها از دیگچه (Linear)، جز برق، گاز و پیک که
   دیگچه ندارد و با همان ضخامتِ خط کشیده شده‌اند. */
function StrokeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

/** اسلاگ truck. */
export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M4.17 18A2.17 2.17 0 0 1 2 15.83V8a3 3 0 0 1 3-3h7a3 3 0 0 1 3 3v7.83" />
      <circle cx="15.41" cy="18.08" r="1.91" />
      <circle cx="6.47" cy="18.08" r="1.91" />
      <path d="M13.49 18.08H8.38M15.5 12.98h6.07" />
      <path d="M15.19 9.57h3.85c.77 0 1.47.44 1.8 1.14l.88 1.84c.18.37.24.79.17 1.2l-.46 2.67a2 2 0 0 1-1.97 1.66h-2.14" />
    </StrokeIcon>
  )
}

/** پیکِ سریع: بسته با خط‌های سرعت. */
export function ExpressIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 7.5 14.5 5l6 2.5v8L14.5 18 9 15.5z" />
      <path d="M9 7.5 14.5 10l6-2.5M14.5 10v8" />
      <path d="M2.5 9H6M2 12.5h4M3 16h3" />
    </StrokeIcon>
  )
}

/** اسلاگ credit-card. */
export function CreditCardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 9h18M12 17h5" />
      <rect x="2.75" y="3.75" width="18.5" height="16.5" rx="3.25" />
    </StrokeIcon>
  )
}

/** اسلاگ wallet. */
export function WalletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M21.4 14.2h-3.86a2.57 2.57 0 0 1 0-5.14h3.86M17.96 11.6h-.3" />
      <path d="M7.95 3.4h8.25a5 5 0 0 1 5 5v6.85a5 5 0 0 1-5 5H7.95a5 5 0 0 1-5-5V8.4a5 5 0 0 1 5-5zM7.27 7.73h5.15" />
    </StrokeIcon>
  )
}

/** آب؛ اسلاگ droplet. */
export function DropletIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12.7 2.21a1 1 0 0 0-1.22 0C9.58 3.66 3.97 8.39 4 13.9 4 18.36 7.63 22 12.1 22s8.1-3.63 8.1-8.09c.01-5.43-5.61-10.24-7.5-11.7z" />
    </StrokeIcon>
  )
}

/** برق. */
export function BoltIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M13.2 2.75 5.5 13.25h5.7l-.9 8 7.7-10.5h-5.7z" />
    </StrokeIcon>
  )
}

/** گاز: شعله. */
export function FlameIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 21.25c-3.73 0-6.5-2.66-6.5-6.2 0-3.9 3.26-6.37 4.6-10.3.5 1.9 1.6 3.3 2.9 4.1.4-1.2.4-2.3.15-3.35 2.6 1.9 5.35 5.3 5.35 9.55 0 3.54-2.77 6.2-6.5 6.2z" />
      <path d="M12 21.25c-1.66 0-2.75-1.1-2.75-2.6 0-1.9 1.6-2.85 2.75-4.4 1.15 1.55 2.75 2.5 2.75 4.4 0 1.5-1.09 2.6-2.75 2.6z" />
    </StrokeIcon>
  )
}

/** تلفن ثابت؛ اسلاگ call. */
export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <path d="M11.5 12.5c4.18 4.18 5.13-.66 7.79 2 2.57 2.57 4.04 3.08.79 6.33-.41.33-2.99 4.26-12.08-4.83C-1.09 6.91 2.84 4.32 3.17 3.91 6.43.65 6.94 2.13 9.5 4.7c2.66 2.66-2.17 3.61 2 7.8z" />
    </StrokeIcon>
  )
}

/** موبایل؛ اسلاگ mobile. */
export function MobileIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <StrokeIcon {...props}>
      <rect x="6" y="2" width="12" height="20" rx="3" />
      <circle cx="12" cy="5" r="0.5" fill="currentColor" />
    </StrokeIcon>
  )
}

export function MicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </LineIcon>
  )
}

/** توقفِ ضبط: مربعِ توپر. */
export function StopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon fill="currentColor" {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </LineIcon>
  )
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M9 7V4h6v3" />
    </LineIcon>
  )
}

/** تلاشِ دوباره / بارگذاریِ مجدد: فلشِ دایره‌ای. */
export function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </LineIcon>
  )
}

export function LoaderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </LineIcon>
  )
}

export function CircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="10" />
    </LineIcon>
  )
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m9 18 6-6-6-6" />
    </LineIcon>
  )
}

export function MoreHorizontalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ location): نشانی، موقعیت، انتخاب از نقشه. */
export function LocationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M21 10.8889C21 15.7981 15.375 22 12 22C8.625 22 3 15.7981 3 10.8889C3 5.97969 7.02944 2 12 2C16.9706 2 21 5.97969 21 10.8889Z" />
      <path d="M15 11C15 12.6569 13.6569 14 12 14C10.3431 14 9 12.6569 9 11C9 9.34315 10.3431 8 12 8C13.6569 8 15 9.34315 15 11Z" />
    </LineIcon>
  )
}

/**
 * جابه‌جاییِ دو مقدار (مبدأ و مقصد، ارزِ مبدأ و مقصد). در دیگچه نیست (DIGCHE-ISSUES.md)؛ با همان
 * قلم‌وزنِ ۱٫۵ و سرِ گردِ آیکون‌های دیگچه کشیده شده تا کنارشان یکدست بماند.
 */
export function SwapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M7 7h12l-3.5-3.5M17 17H5l3.5 3.5" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ eye). */
export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M15.1614 12.0531C15.1614 13.7991 13.7454 15.2141 11.9994 15.2141C10.2534 15.2141 8.8384 13.7991 8.8384 12.0531C8.8384 10.3061 10.2534 8.8911 11.9994 8.8911C13.7454 8.8911 15.1614 10.3061 15.1614 12.0531Z" />
      <path d="M11.998 19.355C15.806 19.355 19.289 16.617 21.25 12.053C19.289 7.489 15.806 4.751 11.998 4.751H12.002C8.194 4.751 4.711 7.489 2.75 12.053C4.711 16.617 8.194 19.355 12.002 19.355H11.998Z" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ eye-off). */
export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M9.7605 14.3667C9.1855 13.7927 8.8355 13.0127 8.8355 12.1377C8.8355 10.3847 10.2474 8.9717 11.9994 8.9717C12.8664 8.9717 13.6644 9.3227 14.2294 9.8967" />
      <path d="M15.1049 12.6987C14.8729 13.9887 13.8569 15.0067 12.5679 15.2407" />
      <path d="M6.6545 17.472C5.0675 16.226 3.7235 14.406 2.7495 12.137C3.7335 9.858 5.0865 8.028 6.6835 6.772C8.2705 5.516 10.1015 4.834 11.9995 4.834C13.9085 4.834 15.7385 5.526 17.3355 6.791" />
      <path d="M19.4473 8.9907C20.1353 9.9047 20.7403 10.9597 21.2493 12.1367C19.2823 16.6937 15.8063 19.4387 11.9993 19.4387C11.1363 19.4387 10.2853 19.2987 9.4673 19.0257" />
      <path d="M19.8868 4.2495 4.1128 20.0235" />
    </LineIcon>
  )
}

export function PanelLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M9 3v18" />
    </LineIcon>
  )
}

export function GripVerticalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="19" r="1" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ user). */
export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M17 7C17 9.7614 14.7614 12 12 12C9.2386 12 7 9.7614 7 7C7 4.2386 9.2386 2 12 2C14.7614 2 17 4.2386 17 7Z" />
      <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22H20.59Z" />
    </LineIcon>
  )
}

/** سیلوئتِ توپُرِ پیش‌فرضِ آواتار (مرد/خنثی)؛ برخلافِ UserIcon (خطی، برای آیکون‌های عمومی)، این یکی مخصوصِ حالتِ بدونِ عکس/بدونِ نامِ Avatar است. */
export function AvatarMaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 500.458" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M187.095 304.534c-7.873-8.107-17.767-21.504-19.131-36.46l-1.513.029c-3.485-.047-6.854-.847-10.006-2.645-5.042-2.873-8.592-7.795-10.989-13.352-5.073-11.655-9.096-42.333 3.675-51.102l-2.391-1.59-.269-3.395c-.492-6.174-.617-13.644-.743-21.486-.46-28.843-1.045-63.782-24.233-70.789l-9.95-3.009 6.55-8.111c18.744-23.145 38.319-43.397 58.061-58.941 22.335-17.581 45.033-29.285 67.245-32.67 22.832-3.461 44.958 1.782 65.393 18.299 6.03 4.878 11.888 10.733 17.536 17.599 21.805 2.112 39.623 13.853 52.355 30.608 7.596 10.008 13.359 21.838 17.034 34.411 3.662 12.53 5.256 25.861 4.579 38.987-1.236 23.512-9.833 46.474-27.162 63.218 3.047.112 5.923.813 8.461 2.17 9.665 5.178 9.979 16.404 7.436 25.829-2.509 7.873-5.701 17.008-8.715 24.677-3.651 10.364-9.002 12.296-19.337 11.18-.337 16.435-11.73 30.04-21.566 39.16-3.704 3.434-7.954 6.495-12.617 9.188C363.564 396.773 512 324.404 512 493.877c0 3.625-2.959 6.581-6.592 6.581H6.592c-3.636 0-6.592-2.956-6.592-6.581 0-179.418 172.327-76.379 201.907-177.944-5.601-3.267-10.607-7.068-14.812-11.399z" />
    </svg>
  )
}

/** سیلوئتِ توپُرِ پیش‌فرضِ آواتار (زن)؛ برای دادن به عنوانِ icon به Avatar وقتی جنسیت مشخص است ولی عکسی نیست. */
export function AvatarFemaleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 501.451" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M90.396 260.923c38.16-40.465 18.438-130.599 36.706-183.524 25.655-74.227 120.495-99.594 173.333-56.158 41.432-4.412 83.182 16.956 92.184 80.835 7.36 52.248 2.867 123.098 28.979 163.408-27.902 26.737-71.407 29.008-107.856 30.963l1.118 8.425c1.82 13.68 1.801 16.655 12.249 28.273C376.651 388.21 512 338.219 512 494.87c0 3.625-2.959 6.581-6.592 6.581H6.592c-3.636 0-6.592-2.956-6.592-6.581 0-168.597 143.337-87.788 185.168-161.699 6.943-12.261 6.676-15.628 6.075-28.89l-.327-7.199c-39.105-1.85-73.255-3.68-100.52-36.159z" />
    </svg>
  )
}

/**
 * میان‌بر برای دادنِ سیلوئتِ آماده (با اندازه/جایگیری/رنگِ کم‌رنگِ تاییدشده)
 * به‌عنوانِ icon به Avatar، به‌جای تکرارِ همان کلاس‌ها هرجا لازم شد.
 */
function AvatarGenderIcon({
  gender,
  className,
  ...props
}: SVGProps<SVGSVGElement> & { gender: "male" | "female" }) {
  const Icon = gender === "female" ? AvatarFemaleIcon : AvatarMaleIcon
  return (
    <Icon
      className={cn(
        "size-[95%] translate-y-1 text-[color-mix(in_oklab,var(--muted-foreground)_55%,var(--muted))]",
        className
      )}
      {...props}
    />
  )
}

export { AvatarGenderIcon }

export function TrendingUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m22 7-8.5 8.5-5-5L2 17" />
      <path d="M16 7h6v6" />
    </LineIcon>
  )
}

export function TrendingDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="m22 17-8.5-8.5-5 5L2 7" />
      <path d="M16 17h6v-6" />
    </LineIcon>
  )
}

export function QuoteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M9.5 4C6 5.2 4 8 4 11.5c0 2.3 1.3 4 3.2 4 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1-2.5-2.4-2.6.4-1.7 1.7-3.2 3.4-3.9L9.5 4Z" />
      <path d="M18.5 4C15 5.2 13 8 13 11.5c0 2.3 1.3 4 3.2 4 1.6 0 2.8-1.2 2.8-2.8 0-1.5-1-2.5-2.4-2.6.4-1.7 1.7-3.2 3.4-3.9L18.5 4Z" />
    </svg>
  )
}

/** مسیر از دیگچه (اسلاگ copy)، با همان translate اصلیِ خودش برای مختصات. */
export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <g transform="translate(2, 2)">
        <path d="M0,10 C0,7.79086113 1.79086113,6 4,6 L6,6 L10,6 C12.2091389,6 14,7.79086113 14,10 L14,14 L14,16 C14,18.2091389 12.2091389,20 10,20 L4,20 C1.79086089,20 0,18.2091389 0,16 L0,10 Z" />
        <path d="M6,6 L6,4 C6,1.79086113 7.79086113,0 10,0 L16,0 C18.2091389,0 20,1.79086113 20,4 L20,10 C20,12.2091389 18.2091389,14 16,14 L14,14" />
      </g>
    </LineIcon>
  )
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
    </svg>
  )
}

/** مسیر از دیگچه (اسلاگ success). */
export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M12,22 C17.5,22 22,17.5 22,12 C22,6.5 17.5,2 12,2 C6.5,2 2,6.5 2,12 C2,17.5 6.5,22 12,22 Z" />
      <path d="M7.75 12 10.58 14.83 16.25 9.17" />
    </LineIcon>
  )
}

export function ExternalLinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </LineIcon>
  )
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4" />
      <path d="M16 3v4" />
    </LineIcon>
  )
}

export function FileTextIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h4" />
    </LineIcon>
  )
}

/** جدول/صفحه‌گسترده؛ برای منبعِ CSV. */
export function TableIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M3 15h18" />
      <path d="M10 10v10" />
    </LineIcon>
  )
}

export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </LineIcon>
  )
}

/** مسیر از دیگچه (اسلاگ arrow-up). */
export function ArrowUpIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M18.07 9.57 12 3.5 5.93 9.57" />
      <path d="M12 20.5V3.67" />
    </LineIcon>
  )
}

/** گیرهٔ پیوست. */
export function PaperclipIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M16 7v9a4 4 0 0 1-8 0V6a2.5 2.5 0 0 1 5 0v9.5a1 1 0 0 1-2 0V8" />
    </LineIcon>
  )
}

/** مربعِ توقف؛ با fill-current توپر می‌شود. */
export function SquareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </LineIcon>
  )
}

/** ستارهٔ چهارپر برای نشانِ هوش مصنوعی. */
export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon {...props}>
      <path d="M10 3.5 11.8 8.2 16.5 10 11.8 11.8 10 16.5 8.2 11.8 3.5 10 8.2 8.2Z" />
      <path d="M18 14.5v5" />
      <path d="M15.5 17h5" />
    </LineIcon>
  )
}

export function GitHubLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.17c-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.04-.72.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.75 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.53-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18a10.9 10.9 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.08.78 2.17v3.22c0 .3.2.66.79.55A10.98 10.98 0 0 0 23.5 12c0-6.27-5.23-11.5-11.5-11.5Z" />
    </svg>
  )
}

export function TwitterLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2h3.3l-7.2 8.2L23.4 22h-6.6l-5.2-6.8L5.6 22H2.3l7.7-8.8L1.6 2h6.8l4.7 6.2L18.9 2Zm-1.2 18h1.8L7.4 4h-2l12.3 16Z" />
    </svg>
  )
}

export function LinkedInLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.64h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V21h-4V9Z" />
    </svg>
  )
}

export function InstagramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
    </svg>
  )
}

export function TelegramLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

/** آیکونِ رسمیِ پیام‌رسان بله (svgrepo.com/svg/329557/bale) — fill آن به currentColor تبدیل شده تا با رنگ متن فوتر هماهنگ باشد. */
export function BaleLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.425 23.987a12.218 12.218 0 0 1-2.95-.514 6.578 6.578 0 0 0-.336-.116C4.936 22.303 2.22 19.763.913 16.599a11.92 11.92 0 0 1-.9-4.063C.005 12.377.001 10.246 0 6.74 0 .71-.005 1.137.07.903.23.394.673.05 1.224.005c.421-.034.7.088 1.603.699.562.38 1.119.78 1.796 1.289.315.237.353.261.376.247l.35-.23c.58-.381 1.11-.677 1.7-.945A11.913 11.913 0 0 1 9.766.21a11.19 11.19 0 0 1 2.041-.2c1.14-.016 2.077.091 3.152.36 3.55.888 6.538 3.411 8.028 6.78.492 1.113.845 2.43.945 3.522.033.366.039.43.053.611.008.105.015.406.015.669 0 .783-.065 1.57-.169 2.064a5.474 5.474 0 0 0-.046.26c-.056.378-.214.987-.399 1.535-.205.613-.367.999-.684 1.633a11.95 11.95 0 0 1-2.623 3.436c-.44.396-.829.705-1.26 1.003-.647.445-1.307.812-2.039 1.134-.6.265-1.44.539-2.101.686a11.165 11.165 0 0 1-1.178.202 12.28 12.28 0 0 1-2.076.082zm-.61-5.92c.294-.06.678-.209.864-.337.144-.099.428-.376 2.064-2.013a161.8 161.8 0 0 1 1.764-1.753c.017 0 1.687-1.67 1.687-1.689 0-.02 1.64-1.648 1.661-1.648.01 0 .063-.047.118-.106.467-.495.682-.957.716-1.547.026-.433-.06-.909-.217-1.196a2.552 2.552 0 0 0-.983-1.024c-.281-.163-.512-.233-.888-.27-.306-.031-.688 0-.948.075-.243.07-.603.274-.853.481-.042.035-1.279 1.265-2.748 2.733l-2.671 2.67-1.093-1.09c-.6-.6-1.12-1.114-1.155-1.142a2.419 2.419 0 0 0-1.338-.51c-.404-.013-.91.09-1.224.25a2.89 2.89 0 0 0-.659.526c-.108.12-.287.357-.29.385-.003.03-.009.044-.065.16a2.312 2.312 0 0 0-.224.91c-.011.229-.01.265.019.491.045.353.24.781.51 1.115.05.063.97.992 2.044 2.064 1.507 1.505 1.98 1.97 2.074 2.039.327.24.683.388 1.101.456.182.03.5.016.734-.03z" />
    </svg>
  )
}

/** نشانِ دیگ — همان مسیر فایل Dig.svg، فقط fill آن currentColor شده تا با رنگ برند/متن هماهنگ بماند. */
export function DigLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 120 110" fill="currentColor" aria-hidden="true" {...props}>
      <path d="m110,50C110,22.43,87.57,0,60,0S10,22.43,10,50H0c0,33.08,26.92,60,60,60s60-26.92,60-60h-10Zm-50,40c-22.06,0-40-17.94-40-40h10c0-16.54,13.46-30,30-30,12.27,0,22.84,7.41,27.48,17.98l-57.33,12.02h61s8.85,0,8.85,0c0,22.06-17.94,40-40,40Z" />
    </svg>
  )
}

/* -------------------------------------------------------------------- *
 * لوگوهای رسمی فریم‌ورک‌ها (Simple Icons) — برای زینتِ دورِ هیروِ صفحهٔ
 * اول. برخلاف بقیهٔ آیکون‌ها fill رنگِ ثابتِ برند خودشان است، نه
 * currentColor، چون این‌جا هدف نشان‌دادنِ رنگ واقعی هر برند است.
 * -------------------------------------------------------------------- */
export function ReactLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#149ECA" aria-hidden="true" {...props}>
      <path d="M14.23 12.004a2.236 2.236 0 0 1-2.235 2.236 2.236 2.236 0 0 1-2.236-2.236 2.236 2.236 0 0 1 2.235-2.236 2.236 2.236 0 0 1 2.236 2.236zm2.648-10.69c-1.346 0-3.107.96-4.888 2.622-1.78-1.653-3.542-2.602-4.887-2.602-.41 0-.783.093-1.106.278-1.375.793-1.683 3.264-.973 6.365C1.98 8.917 0 10.42 0 12.004c0 1.59 1.99 3.097 5.043 4.03-.704 3.113-.39 5.588.988 6.38.32.187.69.275 1.102.275 1.345 0 3.107-.96 4.888-2.624 1.78 1.654 3.542 2.603 4.887 2.603.41 0 .783-.09 1.106-.275 1.374-.792 1.683-3.263.973-6.365C22.02 15.096 24 13.59 24 12.004c0-1.59-1.99-3.097-5.043-4.032.704-3.11.39-5.587-.988-6.38-.318-.184-.688-.277-1.092-.278zm-.005 1.09v.006c.225 0 .406.044.558.127.666.382.955 1.835.73 3.704-.054.46-.142.945-.25 1.44-.96-.236-2.006-.417-3.107-.534-.66-.905-1.345-1.727-2.035-2.447 1.592-1.48 3.087-2.292 4.105-2.295zm-9.77.02c1.012 0 2.514.808 4.11 2.28-.686.72-1.37 1.537-2.02 2.442-1.107.117-2.154.298-3.113.538-.112-.49-.195-.964-.254-1.42-.23-1.868.054-3.32.714-3.707.19-.09.4-.127.563-.132zm4.882 3.05c.455.468.91.992 1.36 1.564-.44-.02-.89-.034-1.345-.034-.46 0-.915.01-1.36.034.44-.572.895-1.096 1.345-1.565zM12 8.1c.74 0 1.477.034 2.202.093.406.582.802 1.203 1.183 1.86.372.64.71 1.29 1.018 1.946-.308.655-.646 1.31-1.013 1.95-.38.66-.773 1.288-1.18 1.87-.728.063-1.466.098-2.21.098-.74 0-1.477-.035-2.202-.093-.406-.582-.802-1.204-1.183-1.86-.372-.64-.71-1.29-1.018-1.946.303-.657.646-1.313 1.013-1.954.38-.66.773-1.286 1.18-1.868.728-.064 1.466-.098 2.21-.098zm-3.635.254c-.24.377-.48.763-.704 1.16-.225.39-.435.782-.635 1.174-.265-.656-.49-1.31-.676-1.947.64-.15 1.315-.283 2.015-.386zm7.26 0c.695.103 1.365.23 2.006.387-.18.632-.405 1.282-.66 1.933-.2-.39-.41-.783-.64-1.174-.225-.392-.465-.774-.705-1.146zm3.063.675c.484.15.944.317 1.375.498 1.732.74 2.852 1.708 2.852 2.476-.005.768-1.125 1.74-2.857 2.475-.42.18-.88.342-1.355.493-.28-.958-.646-1.956-1.1-2.98.45-1.017.81-2.01 1.085-2.964zm-13.395.004c.278.96.645 1.957 1.1 2.98-.45 1.017-.812 2.01-1.086 2.964-.484-.15-.944-.318-1.37-.5-1.732-.737-2.852-1.706-2.852-2.474 0-.768 1.12-1.742 2.852-2.476.42-.18.88-.342 1.356-.494zm11.678 4.28c.265.657.49 1.312.676 1.948-.64.157-1.316.29-2.016.39.24-.375.48-.762.705-1.158.225-.39.435-.788.636-1.18zm-9.945.02c.2.392.41.783.64 1.175.23.39.465.772.705 1.143-.695-.102-1.365-.23-2.006-.386.18-.63.406-1.282.66-1.933zM17.92 16.32c.112.493.2.968.254 1.423.23 1.868-.054 3.32-.714 3.708-.147.09-.338.128-.563.128-1.012 0-2.514-.807-4.11-2.28.686-.72 1.37-1.536 2.02-2.44 1.107-.118 2.154-.3 3.113-.54zm-11.83.01c.96.234 2.006.415 3.107.532.66.905 1.345 1.727 2.035 2.446-1.595 1.483-3.092 2.295-4.11 2.295-.22-.005-.406-.05-.553-.132-.666-.38-.955-1.834-.73-3.703.054-.46.142-.944.25-1.438zm4.56.64c.44.02.89.034 1.345.034.46 0 .915-.01 1.36-.034-.44.572-.895 1.095-1.345 1.565-.455-.47-.91-.993-1.36-1.565z" />
    </svg>
  )
}

export function VueLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#4FC08D" aria-hidden="true" {...props}>
      <path d="M24,1.61H14.06L12,5.16,9.94,1.61H0L12,22.39ZM12,14.08,5.16,2.23H9.59L12,6.41l2.41-4.18h4.43Z" />
    </svg>
  )
}

export function SvelteLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#FF3E00" aria-hidden="true" {...props}>
      <path d="M10.354 21.125a4.44 4.44 0 0 1-4.765-1.767 4.109 4.109 0 0 1-.703-3.107 3.898 3.898 0 0 1 .134-.522l.105-.321.287.21a7.21 7.21 0 0 0 2.186 1.092l.208.063-.02.208a1.253 1.253 0 0 0 .226.83 1.337 1.337 0 0 0 1.435.533 1.231 1.231 0 0 0 .343-.15l5.59-3.562a1.164 1.164 0 0 0 .524-.778 1.242 1.242 0 0 0-.211-.937 1.338 1.338 0 0 0-1.435-.533 1.23 1.23 0 0 0-.343.15l-2.133 1.36a4.078 4.078 0 0 1-1.135.499 4.44 4.44 0 0 1-4.765-1.766 4.108 4.108 0 0 1-.702-3.108 3.855 3.855 0 0 1 1.742-2.582l5.589-3.563a4.072 4.072 0 0 1 1.135-.499 4.44 4.44 0 0 1 4.765 1.767 4.109 4.109 0 0 1 .703 3.107 3.943 3.943 0 0 1-.134.522l-.105.321-.286-.21a7.204 7.204 0 0 0-2.187-1.093l-.208-.063.02-.207a1.255 1.255 0 0 0-.226-.831 1.337 1.337 0 0 0-1.435-.532 1.231 1.231 0 0 0-.343.15L8.62 9.368a1.162 1.162 0 0 0-.524.778 1.24 1.24 0 0 0 .211.937 1.338 1.338 0 0 0 1.435.533 1.235 1.235 0 0 0 .344-.151l2.132-1.36a4.067 4.067 0 0 1 1.135-.498 4.44 4.44 0 0 1 4.765 1.766 4.108 4.108 0 0 1 .702 3.108 3.857 3.857 0 0 1-1.742 2.583l-5.589 3.562a4.072 4.072 0 0 1-1.135.499m10.358-17.95C18.484-.015 14.082-.96 10.9 1.068L5.31 4.63a6.412 6.412 0 0 0-2.896 4.295 6.753 6.753 0 0 0 .666 4.336 6.43 6.43 0 0 0-.96 2.396 6.833 6.833 0 0 0 1.168 5.167c2.229 3.19 6.63 4.135 9.812 2.108l5.59-3.562a6.41 6.41 0 0 0 2.896-4.295 6.756 6.756 0 0 0-.665-4.336 6.429 6.429 0 0 0 .958-2.396 6.831 6.831 0 0 0-1.167-5.168Z" />
    </svg>
  )
}

export function AngularLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="#DD0031" aria-hidden="true" {...props}>
      <path d="M16.712 17.711H7.288l-1.204 2.916L12 24l5.916-3.373-1.204-2.916ZM14.692 0l7.832 16.855.814-12.856L14.692 0ZM9.308 0 .662 3.999l.814 12.856L9.308 0Zm-.405 13.93h6.198L12 6.396 8.903 13.93Z" />
    </svg>
  )
}

/* آیکون‌های پیشخوان و ناوبری؛ مسیرها از دیگچه (Linear)، از public/icons. */
/** پیشخوان؛ اسلاگ DashboardSquareSetting. */
export function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M18 9.357V10.5m0-1.143a2.93 2.93 0 0 1-2.427-1.272m4.854-3.17a2.8 2.8 0 0 1 0 3.17A2.93 2.93 0 0 1 18 9.357m0-5.714a2.93 2.93 0 0 1 2.427 1.272M18 3.643a2.93 2.93 0 0 0-2.427 1.272M18 3.643V2.5m3.5 1.714-1.073.701M14.5 8.785l1.073-.7M14.5 4.215l1.073.7m5.927 3.87-1.073-.7m-4.854-3.17a2.8 2.8 0 0 0 0 3.17"/><path stroke="currentColor" strokeWidth="1.5" d="M2 6c0-1.4 0-2.1.272-2.635a2.5 2.5 0 0 1 1.093-1.093C3.9 2 4.6 2 6 2s2.1 0 2.635.272a2.5 2.5 0 0 1 1.093 1.093C10 3.9 10 4.6 10 6s0 2.1-.272 2.635a2.5 2.5 0 0 1-1.093 1.093C8.1 10 7.4 10 6 10s-2.1 0-2.635-.272a2.5 2.5 0 0 1-1.093-1.093C2 8.1 2 7.4 2 6Zm0 12c0-1.4 0-2.1.272-2.635a2.5 2.5 0 0 1 1.093-1.092C3.9 14 4.6 14 6 14s2.1 0 2.635.273a2.5 2.5 0 0 1 1.093 1.092C10 15.9 10 16.6 10 18s0 2.1-.272 2.635a2.5 2.5 0 0 1-1.093 1.092C8.1 22 7.4 22 6 22s-2.1 0-2.635-.273a2.5 2.5 0 0 1-1.093-1.092C2 20.1 2 19.4 2 18Zm12 0c0-1.4 0-2.1.273-2.635a2.5 2.5 0 0 1 1.092-1.092C15.9 14 16.6 14 18 14s2.1 0 2.635.273a2.5 2.5 0 0 1 1.092 1.092C22 15.9 22 16.6 22 18s0 2.1-.273 2.635a2.5 2.5 0 0 1-1.092 1.092C20.1 22 19.4 22 18 22s-2.1 0-2.635-.273a2.5 2.5 0 0 1-1.092-1.092C14 20.1 14 19.4 14 18Z"/>
    </svg>
  )
}

/** سبد و سفارش؛ اسلاگ ShoppingCart. */
export function ShoppingCartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.563" d="M1.58 1.58h1.813c1.125 0 2.011.97 1.917 2.084l-.865 10.378A2.913 2.913 0 0 0 7.353 17.2H18.45c1.5 0 2.813-1.23 2.928-2.72l.563-7.815c.125-1.73-1.188-3.136-2.928-3.136H5.56m12.171 17.588a1.302 1.302 0 1 1-2.605 0 1.302 1.302 0 0 1 2.605 0m-8.336 0a1.302 1.302 0 1 1-2.605 0 1.302 1.302 0 0 1 2.605 0M8.874 7.832h12.504" data-optical-balance="1.042"/>
    </svg>
  )
}

/** فروشگاه و محصولات؛ اسلاگ Shop. */
export function ShopIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M2.713 11.22v4.49c0 4.49 1.865 6.29 6.516 6.29h5.584c4.65 0 6.516-1.8 6.516-6.29v-4.49"/><path d="M12.026 12c1.896 0 3.294-1.49 3.108-3.32L14.45 2H9.612l-.694 6.68C8.732 10.51 10.13 12 12.026 12"/><path d="M18.563 12c2.092 0 3.625-1.64 3.418-3.65l-.29-2.75C21.318 2 20.282 2 17.568 2h-3.16l.726 7.01c.176 1.65 1.72 2.99 3.429 2.99M5.437 12c1.71 0 3.253-1.34 3.419-2.99l.228-2.21L9.58 2H6.42C3.706 2 2.67 2 2.297 5.6l-.28 2.75C1.813 10.36 3.346 12 5.439 12m6.587 5c-1.73 0-2.59.83-2.59 2.5V22h5.18v-2.5c0-1.67-.86-2.5-2.59-2.5"/></g>
    </svg>
  )
}

/** مشتریان و کاربران؛ اسلاگ GroupUsers. */
export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M18 7.16a.6.6 0 0 0-.19 0 2.573 2.573 0 0 1-2.48-2.58c0-1.43 1.15-2.58 2.58-2.58a2.58 2.58 0 0 1 2.58 2.58A2.59 2.59 0 0 1 18 7.16m-1.03 7.28c1.37.23 2.88-.01 3.94-.72 1.41-.94 1.41-2.48 0-3.42-1.07-.71-2.6-.95-3.97-.71M5.97 7.16c.06-.01.13-.01.19 0a2.573 2.573 0 0 0 2.48-2.58C8.64 3.15 7.49 2 6.06 2a2.58 2.58 0 0 0-2.58 2.58c.01 1.4 1.11 2.53 2.49 2.58M7 14.44c-1.37.23-2.88-.01-3.94-.72-1.41-.94-1.41-2.48 0-3.42 1.07-.71 2.6-.95 3.97-.71M12 14.63a.6.6 0 0 0-.19 0 2.573 2.573 0 0 1-2.48-2.58c0-1.43 1.15-2.58 2.58-2.58a2.58 2.58 0 0 1 2.58 2.58c-.01 1.4-1.11 2.54-2.49 2.58m-2.91 3.15c-1.41.94-1.41 2.48 0 3.42 1.6 1.07 4.22 1.07 5.82 0 1.41-.94 1.41-2.48 0-3.42-1.59-1.06-4.22-1.06-5.82 0"/>
    </svg>
  )
}

/** گزارش و تحلیل؛ اسلاگ BarChart. */
export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 19v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m13 .5H3m7-.5v-9a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9m2 0V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v14"/>
    </svg>
  )
}

/** پشتیبانی و تیکت؛ اسلاگ Ticket. */
export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.563" data-optical-balance="1.042"><path strokeLinejoin="round" d="M1.58 17.21a4.17 4.17 0 0 0 4.168 4.168h12.504a4.17 4.17 0 0 0 4.168-4.168v-1.042c0-.575-.48-1.025-1.023-1.213a3.127 3.127 0 0 1 0-5.91c.544-.188 1.023-.638 1.023-1.213V6.79a4.17 4.17 0 0 0-4.168-4.168H5.748A4.17 4.17 0 0 0 1.58 6.79v1.042c0 .575.48 1.025 1.023 1.213a3.127 3.127 0 0 1 0 5.91c-.544.188-1.023.638-1.023 1.213z"/><path d="M9.916 8.874a1.042 1.042 0 1 1-2.084 0 1.042 1.042 0 0 1 2.084 0Zm6.252 6.252a1.042 1.042 0 1 1-2.084 0 1.042 1.042 0 0 1 2.084 0Zm-1.042-6.252-6.252 6.252"/></g>
    </svg>
  )
}

/** اعلان؛ اسلاگ NotificationBell. */
export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"><path d="M21 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path d="M18.687 12.915c.08.71.38 1.387.865 1.957C20.65 16.161 19.606 18 17.777 18H6.223c-1.829 0-2.872-1.84-1.775-3.128.485-.57.785-1.247.865-1.957l.447-3.94c.242-2.124 1.828-3.868 3.97-4.601V4.27a2.27 2.27 0 0 1 3.993-1.478M15 20c-.437 1.165-1.615 2-3 2s-2.563-.835-3-2"/></g>
    </svg>
  )
}

/** پیام و ایمیل؛ پاکت با لبهٔ گرد، هم‌وزنِ بقیهٔ آیکون‌های خطی. */
export function EnvelopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><rect x="2.5" y="4.5" width="19" height="15" rx="3.5"/><path d="m6.5 9 4.3 3.1a2 2 0 0 0 2.4 0L17.5 9"/></g>
    </svg>
  )
}

/** نقش و دسترسی؛ اسلاگ shield-check. */
export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M10.375 2.722 5.378 4.943c-1.446.643-2.4 2.082-2.308 3.66.36 6.175 2.168 8.893 6.866 12.074a3.685 3.685 0 0 0 4.129 0c4.712-3.197 6.456-5.954 6.847-12.052.102-1.59-.854-3.044-2.31-3.69l-4.977-2.213a4 4 0 0 0-3.25 0"/><path d="m9 12 1.753 1.402a1 1 0 0 0 1.377-.122L15 10"/></g>
    </svg>
  )
}

/** راهنما؛ اسلاگ Guide. */
export function GuideIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeLinejoin="round" strokeWidth="1.644" data-optical-balance="1.096"><path strokeLinecap="round" d="M6.063 4.04c3.295.582 5.26 1.797 5.937 2.495.678-.698 2.642-1.913 5.938-2.494 1.67-.295 2.504-.442 3.215.122s.711 1.48.711 3.312v6.584c0 1.676 0 2.513-.456 3.036s-1.46.7-3.47 1.054c-1.791.316-3.19.82-4.2 1.325-.996.497-1.494.746-1.738.746-.243 0-.741-.249-1.737-.746-1.011-.506-2.41-1.009-4.2-1.325-2.01-.354-3.014-.53-3.47-1.054-.457-.523-.457-1.36-.457-3.036V7.475c0-1.832 0-2.748.711-3.312s1.546-.417 3.216-.122"/><path d="M12 5.972V20.22"/></g>
    </svg>
  )
}

/** تنظیمات؛ اسلاگ AccountSettings. */
export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeWidth="1.438" data-optical-balance=".959"><path strokeLinecap="round" strokeLinejoin="round" d="M16.795 7.205a4.795 4.795 0 1 1-9.59 0 4.795 4.795 0 0 1 9.59 0M3.762 21.59c0-3.711 3.692-6.713 8.238-6.713q.851.001 1.66.137"/><g fillRule="evenodd"><path strokeLinejoin="round" d="M18.237 13.199h-.966c-.534 0-.966.408-.966.91a.76.76 0 0 1-1.122.667l-.052-.028c-.462-.251-1.053-.102-1.32.334l-.483.789c-.266.436-.108.993.354 1.244a.727.727 0 0 1 0 1.278c-.462.251-.62.808-.354 1.244l.484.79c.266.435.857.584 1.32.333l.05-.028a.76.76 0 0 1 1.123.666c0 .503.432.911.966.911h.966c.534 0 .966-.408.966-.91a.76.76 0 0 1 1.122-.667l.052.028c.462.251 1.053.102 1.32-.334l.483-.789c.266-.436.108-.993-.354-1.244a.727.727 0 0 1 0-1.278c.462-.251.62-.808.354-1.244l-.484-.79c-.266-.435-.857-.584-1.32-.333l-.05.028a.76.76 0 0 1-1.123-.666c0-.503-.432-.911-.966-.911Z"/><path d="M19.272 17.754a1.518 1.518 0 1 1-3.036 0 1.518 1.518 0 0 1 3.036 0Z"/></g></g>
    </svg>
  )
}

/** خروج؛ اسلاگ Logout. */
export function LogoutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.579" d="M8.736 7.325c.327-3.791 2.275-5.339 6.54-5.339h.136c4.707 0 6.592 1.885 6.592 6.592v6.865c0 4.707-1.885 6.592-6.592 6.592h-.137c-4.233 0-6.18-1.527-6.528-5.254M15.159 12H3.176m2.348-3.528L1.996 12l3.528 3.528" data-optical-balance="1.053"/>
    </svg>
  )
}

/** فاکتور و سفارش؛ اسلاگ Receipt-text. */
export function ReceiptIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M22 6v2.42C22 10 21 11 19.42 11H16V4.01C16 2.9 16.91 2 18.02 2c1.09.01 2.09.45 2.81 1.17C21.55 3.9 22 4.9 22 6"/><path d="M2 7v14c0 .83.94 1.3 1.6.8l1.71-1.28c.4-.3.96-.26 1.32.1l1.66 1.67c.39.39 1.03.39 1.42 0l1.68-1.68c.35-.35.91-.39 1.3-.09l1.71 1.28c.66.49 1.6.02 1.6-.8V4c0-1.1.9-2 2-2H6C3 2 2 3.79 2 6zm4 2h6m-5.25 4h4.5"/></g>
    </svg>
  )
}

/** امتیاز و نظر؛ اسلاگ BadgeStar. */
export function BadgeStarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5"><path strokeLinecap="round" d="M10.75 2.45c.69-.59 1.82-.59 2.52 0l1.58 1.36c.3.26.86.47 1.26.47h1.7c1.06 0 1.93.87 1.93 1.93v1.7c0 .39.21.96.47 1.26l1.36 1.58c.59.69.59 1.82 0 2.52l-1.36 1.58c-.26.3-.47.86-.47 1.26v1.7c0 1.06-.87 1.93-1.93 1.93h-1.7c-.39 0-.96.21-1.26.47l-1.58 1.36c-.69.59-1.82.59-2.52 0l-1.58-1.36c-.3-.26-.86-.47-1.26-.47H6.18c-1.06 0-1.93-.87-1.93-1.93V16.1c0-.39-.21-.95-.46-1.25l-1.35-1.59c-.58-.69-.58-1.81 0-2.5l1.35-1.59c.25-.3.46-.86.46-1.25V6.21c0-1.06.87-1.93 1.93-1.93h1.73c.39 0 .96-.21 1.26-.47z"/><path d="M11.213 8.509a.863.863 0 0 1 1.574 0l.556 1.171a.88.88 0 0 0 .66.5l1.245.187c.72.11 1.007 1.029.486 1.557l-.9.912a.94.94 0 0 0-.252.807l.212 1.288c.123.746-.63 1.314-1.273.962l-1.113-.608a.85.85 0 0 0-.816 0l-1.113.608c-.644.352-1.396-.216-1.273-.962l.212-1.288a.94.94 0 0 0-.252-.807l-.9-.912c-.52-.528-.233-1.448.486-1.557l1.244-.187a.88.88 0 0 0 .66-.5z"/></g>
    </svg>
  )
}

/** ویژه و ارتقا؛ اسلاگ Flash-circle. */
export function FlashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"><path d="M8.68 12.72h1.74v4.05c0 .6.74.88 1.14.43l4.26-4.84a.65.65 0 0 0-.49-1.08h-1.74V7.23c0-.6-.74-.88-1.14-.43l-4.26 4.84a.65.65 0 0 0 .49 1.08"/><path d="M21.97 12c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10 10 4.477 10 10"/></g>
    </svg>
  )
}

/** تخفیف و برچسب؛ اسلاگ Tag. */
export function TagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"><path strokeLinejoin="round" d="m4.405 15.526 4.53 4.53a4.78 4.78 0 0 0 6.75 0l4.39-4.39a4.78 4.78 0 0 0 0-6.75l-4.54-4.52a4.75 4.75 0 0 0-3.6-1.39l-5 .24c-2 .09-3.59 1.68-3.69 3.67l-.24 5c-.06 1.35.45 2.66 1.4 3.61"/><path d="M12.235 9.726a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"/><path strokeLinejoin="round" d="m13.235 17.226 4-4"/></g>
    </svg>
  )
}

/** فیلتر؛ اسلاگ Filter. */
export function FilterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.645" d="M5.253 2.127h13.479c1.12 0 2.044.902 2.044 1.997v2.189c0 .799-.515 1.79-1.015 2.292l-4.391 3.787c-.606.503-1.015 1.494-1.015 2.292v4.29c0 .592-.409 1.39-.924 1.7l-1.423.903c-1.333.799-3.165-.103-3.165-1.7v-5.281c0-.695-.41-1.598-.818-2.1L4.148 8.502c-.515-.503-.924-1.39-.924-1.997V4.213c-.015-1.184.909-2.086 2.03-2.086m4.552 3.291h4.388" data-optical-balance="1.097"/>
    </svg>
  )
}

/* آیکون‌های اپ موبایل؛ مسیرها از دیگچه (Linear)، از public/icons. */
/** فعالیت؛ اسلاگ Activity. */
export function ActivityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" transform="translate(.504 .504)scale(.958)"><path d="m7.245 14.782 2.993-3.89 3.414 2.681 2.929-3.78"/><circle cx="19.995" cy="4.201" r="1.922"/><path d="M14.924 3.12H7.657c-3.012 0-4.88 2.133-4.88 5.144v8.083c0 3.011 1.832 5.135 4.88 5.135h8.604c3.011 0 4.878-2.124 4.878-5.135v-7.04"/></g>
    </svg>
  )
}

/** علاقه‌مندی و سلامت؛ اسلاگ Heart. */
/** پسندیدن؛ filled برای حالتِ انتخاب‌شده. */
export function ThumbsUpIcon({ filled = false, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 10v10H4.5A1.5 1.5 0 0 1 3 18.5v-7A1.5 1.5 0 0 1 4.5 10H7Zm0 0 3.6-6.3a1.6 1.6 0 0 1 2.9 1.2L12.8 9h5.6a2 2 0 0 1 2 2.4l-1.3 6.5A2.6 2.6 0 0 1 16.6 20H7"/>
    </svg>
  )
}

/** نپسندیدن؛ قرینهٔ عمودیِ ThumbsUpIcon. */
export function ThumbsDownIcon({ filled = false, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 14V4h2.5A1.5 1.5 0 0 1 21 5.5v7a1.5 1.5 0 0 1-1.5 1.5H17Zm0 0-3.6 6.3a1.6 1.6 0 0 1-2.9-1.2l.7-4.1H5.6a2 2 0 0 1-2-2.4l1.3-6.5A2.6 2.6 0 0 1 7.4 4H17"/>
    </svg>
  )
}

/** قلب؛ filled برای حالتِ «پسندیده‌شده» (تو‌پر با رنگِ متن). */
export function HeartIcon({ filled = false, ...props }: SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 20S3 15.227 3 9.602c0-1.22.492-2.39 1.369-3.254A4.7 4.7 0 0 1 7.673 5C9.628 5 11.303 6.05 12 7.727 12.697 6.05 14.372 5 16.327 5a4.7 4.7 0 0 1 3.304 1.348A4.57 4.57 0 0 1 21 9.602C21 15.227 12 20 12 20"/>
    </svg>
  )
}

/** خواب و حالت شب؛ اسلاگ Moon. */
/** پوستهٔ روشن؛ هم‌وزنِ MoonIcon. */
export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></g>
    </svg>
  )
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.027 12.425c.36 5.15 4.73 9.34 9.96 9.57 3.69.16 6.99-1.56 8.97-4.27.82-1.11.38-1.85-.99-1.6-.67.12-1.36.17-2.08.14-4.89-.2-8.89-4.29-8.91-9.12-.01-1.3.26-2.53.75-3.65.54-1.24-.11-1.83-1.36-1.3-3.96 1.67-6.67 5.66-6.34 10.23"/>
    </svg>
  )
}

/** منو؛ اسلاگ Mnue. */
export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" d="M3 7h18M3 12h18M3 17h18"/>
    </svg>
  )
}

/** زمان؛ اسلاگ ClockCircle. */
export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v5l3 2m7-8.636A12.05 12.05 0 0 0 16.803 2M7.197 2A12.05 12.05 0 0 0 2 6.364M18.757 19 21 22M3 22l2.243-3"/>
    </svg>
  )
}

/** اشتراک‌گذاری؛ اسلاگ Share. */
export function ShareIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.437" d="M16.752 6.415a8.27 8.27 0 0 1 3.506 5.892m-16.411.047a8.24 8.24 0 0 1 3.45-5.891M8.35 20.565a8.2 8.2 0 0 0 3.708.88 8.1 8.1 0 0 0 3.573-.813m-.91-15.415a2.663 2.663 0 1 1-5.326 0 2.663 2.663 0 0 1 5.326 0M7.794 16.924a2.663 2.663 0 1 1-5.326 0 2.663 2.663 0 0 1 5.326 0m13.738 0a2.663 2.663 0 1 1-5.327 0 2.663 2.663 0 0 1 5.327 0"/>
    </svg>
  )
}

/** گفت‌وگو و چت؛ اسلاگ chat-circle-dots. */
export function ChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path d="M12 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM7 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM17 12.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 20.7c2.1 1.2 4.6 1.6 7 1.2 2.4-.5 4.5-1.8 6-3.7s2.2-4.3 2-6.7-1.2-4.7-2.9-6.4S15.1 2.4 12.7 2.2 7.9 2.8 6 4.2C4.1 5.7 2.8 7.8 2.3 10.2s0 4.9 1.2 7l-1.3 3.9v.5c0 .2.1.3.2.4s.2.2.4.2h.5l3.9-1.3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** نمای شبکه‌ای؛ اسلاگ Gridview. */
export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.35" d="M21 8.868V4.782C21 3.513 20.424 3 18.993 3h-3.636c-1.431 0-2.007.513-2.007 1.782v4.077c0 1.278.576 1.782 2.007 1.782h3.636C20.424 10.65 21 10.137 21 8.868m0 10.125v-3.636c0-1.431-.576-2.007-2.007-2.007h-3.636c-1.431 0-2.007.576-2.007 2.007v3.636c0 1.431.576 2.007 2.007 2.007h3.636C20.424 21 21 20.424 21 18.993M10.65 8.868V4.782C10.65 3.513 10.074 3 8.643 3H5.007C3.576 3 3 3.513 3 4.782v4.077c0 1.278.576 1.782 2.007 1.782h3.636c1.431.009 2.007-.504 2.007-1.773m0 10.125v-3.636c0-1.431-.576-2.007-2.007-2.007H5.007C3.576 13.35 3 13.926 3 15.357v3.636C3 20.424 3.576 21 5.007 21h3.636c1.431 0 2.007-.576 2.007-2.007"/>
    </svg>
  )
}

/** نمای فهرستی؛ اسلاگ ListView. */
export function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.431" d="M4.368 10.092a1.908 1.908 0 1 1 0-3.816 1.908 1.908 0 0 1 0 3.816Zm0 7.632a1.908 1.908 0 1 1 0-3.816 1.908 1.908 0 0 1 0 3.816ZM15.816 6.276h-5.724m5.724 7.632h-5.724m11.448-3.816H10.092m0 7.632H21.54"/>
    </svg>
  )
}

/** قالب‌بندیِ متن (درشت، کج، زیرخط، پیوند)؛ در دیگچه نبودند، با همان خطِ ۱٫۵ رسم شده‌اند. */
export function BoldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.75} {...props}>
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z" />
    </LineIcon>
  )
}

export function ItalicIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M10 5h8M6 19h8M14.5 5l-5 14" />
    </LineIcon>
  )
}

export function UnderlineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M7 4v7a5 5 0 0 0 10 0V4M5 20h14" />
    </LineIcon>
  )
}

export function LinkIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
    </LineIcon>
  )
}

/** ویرایش؛ اسلاگ Edit. */
export function EditIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeWidth="1.583"><path d="M14.552 3.22a2.44 2.44 0 0 1 3.45 0l1.724 1.724a2.44 2.44 0 0 1 0 3.449l-8.718 8.717a2.44 2.44 0 0 1-1.38.69l-3.62.517a1.22 1.22 0 0 1-1.38-1.38l.517-3.62a2.44 2.44 0 0 1 .69-1.38z"/><path d="M20.44 21.495H9.629m3.199-16.551q0 1.725 1.724 3.449 1.725 1.725 3.45 1.724"/></g>
    </svg>
  )
}

/** برگرداندن؛ مسیر از دیگچه (اسلاگ Undo). */
export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.65} {...props}>
      <path d="M6.8 19.1h8.8a5.5 5.5 0 0 0 0-11H3.5M6.3 10.9 3.5 8.1l2.8-2.8" />
    </LineIcon>
  )
}

/** دوباره‌انجام؛ مسیر از دیگچه (اسلاگ Redo). */
export function RedoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.65} {...props}>
      <path d="M17.2 19.1H8.4a5.5 5.5 0 0 1 0-11h12.1M17.7 10.9l2.8-2.8-2.8-2.8" />
    </LineIcon>
  )
}

export function StrikethroughIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 12h16M16.5 7.5C16 5.6 14.2 4.5 12 4.5c-2.6 0-4.5 1.4-4.5 3.5 0 1.2.6 2.2 1.8 2.9M8 16.5c.5 1.9 2.2 3 4.2 3 2.6 0 4.5-1.4 4.5-3.5 0-.7-.2-1.4-.6-1.9" />
    </LineIcon>
  )
}

/** چینش به راست؛ در متنِ فارسی همان «چینش به ابتدا». */
export function AlignRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M9 10h11M4 15h16M11 20h9" />
    </LineIcon>
  )
}

export function AlignCenterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M7 10h10M4 15h16M8 20h8" />
    </LineIcon>
  )
}

export function AlignLeftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M4 10h11M4 15h16M4 20h9" />
    </LineIcon>
  )
}

export function AlignJustifyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M4 10h16M4 15h16M4 20h16" />
    </LineIcon>
  )
}

/** فهرستِ شماره‌دار؛ خط‌ها سمتِ راست ننشسته‌اند چون آیکون آینه نمی‌شود. */
export function ListOrderedIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M10 6h10M10 12h10M10 18h10M4 5l1.5-1v5M3.8 13.2a1.4 1.4 0 0 1 2.6.6c0 1.1-2.6 2-2.6 3.2h2.7" />
    </LineIcon>
  )
}

/** افزایشِ تورفتگی. */
export function IndentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M11 10h9M11 14h9M4 19h16M4 9.5 7 12l-3 2.5" />
    </LineIcon>
  )
}

/** کاهشِ تورفتگی. */
export function OutdentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 5h16M11 10h9M11 14h9M4 19h16M7 9.5 4 12l3 2.5" />
    </LineIcon>
  )
}

/** رنگِ متن: حرف A روی نوارِ رنگ؛ نوار با currentColor یا رنگِ انتخاب‌شده پر می‌شود. */
export function TextColorIcon({ barColor, ...props }: SVGProps<SVGSVGElement> & { barColor?: string }) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="m7 15 5-11 5 11M8.8 11h6.4" />
      <rect x="4" y="18" width="16" height="3" rx="1" fill={barColor ?? "currentColor"} stroke="none" />
    </LineIcon>
  )
}

/** هایلایت (ماژیک). */
export function HighlighterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="m9 11-5 5v3h5l5-5M9 11l6.5-6.5a2.1 2.1 0 0 1 3 3L12 14M9 11l3 3M4 21h16" />
    </LineIcon>
  )
}

export function QuoteBlockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M20 6H9M20 12H9M20 18H9M4 5v14" />
    </LineIcon>
  )
}

/** پاک‌کردنِ قالب‌بندی. */
export function ClearFormatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M6 5h12M12 5l-3 14M15 15l5 5M20 15l-5 5" />
    </LineIcon>
  )
}

/** بارگذاری روی ابر؛ مسیر از دیگچه (اسلاگ cloud-upload). */
export function CloudUploadIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M8 17H7a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 17.8 9 4 4 0 0 1 17 17h-1M12 12v8M9.5 14.5 12 12l2.5 2.5" />
    </LineIcon>
  )
}

/* آیکون‌های پزشکی و داروخانه؛ مسیرها از دیگچه (دستهٔ Medical، Linear). */

/** دارو، قرص (اسلاگ pill). */
export function PillIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M13.9607 3.33613L3.34617 13.9507C1.49813 15.7987 1.49813 18.795 3.34617 20.643L3.34691 20.6438C5.19495 22.4918 8.19121 22.4918 10.0393 20.6438L20.6538 10.0292C22.5019 8.18117 22.5019 5.18491 20.6538 3.33687L20.6531 3.33613C18.805 1.48809 15.8088 1.48809 13.9607 3.33613Z" />
      <path d="M8.65234 8.64258L15.3454 15.3356" />
      <path d="M15.3467 10.3156L17.8566 7.80566" />
    </LineIcon>
  )
}

/** کیتِ کمک‌های اولیه، داروخانه (اسلاگ first-aid-kit). */
export function FirstAidKitIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M18 8H6C3.79086 8 2 9.79086 2 12V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V12C22 9.79086 20.2091 8 18 8Z" />
      <path d="M16 8V6.5C16 5.67157 15.3284 5 14.5 5H9.5C8.67157 5 8 5.67157 8 6.5V8" />
      <path d="M15 15H9" />
      <path d="M12 12V18" />
    </LineIcon>
  )
}

/** ماسک، بهداشتی (اسلاگ face-mask). */
export function FaceMaskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4.667 7.434c0-.152.042-.3.12-.425a.75.75 0 0 1 .319-.271l6.667-2.694a.6.6 0 0 1 .455 0l6.667 2.694c.129.052.24.147.318.271.079.125.121.273.121.425v5.455c0 2.549-1.772 4.203-3.574 5.226a7.74 7.74 0 0 1-7.519 0c-1.802-1.023-3.574-2.677-3.574-5.226V7.434Z" />
      <path d="M8.667 9.926h6.667" />
      <path d="M8.667 12.889h6.667" />
      <path d="M19.117 14.371H20c.53 0 1.039-.234 1.414-.651.375-.417.586-.982.586-1.571V9.926c0-.589-.211-1.154-.586-1.571A1.89 1.89 0 0 0 20 7.704h-.667" />
      <path d="M4.883 14.371H4c-.53 0-1.039-.234-1.414-.651A2.4 2.4 0 0 1 2 12.149V9.926c0-.589.211-1.154.586-1.571A1.89 1.89 0 0 1 4 7.704h.667" />
    </LineIcon>
  )
}

/** صابون و شوینده، آرایشی و بهداشتی (اسلاگ hand-soap). */
export function HandSoapIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M3 14C3 11.7909 4.79086 10 7 10H17C19.2091 10 21 11.7909 21 14V18C21 20.2091 19.2091 22 17 22H7C4.79086 22 3 20.2091 3 18V14Z" />
      <path d="M17 10C17 7.79086 15.2091 6 13 6H11C8.79086 6 7 7.79086 7 10" />
      <path d="M18 3C18 2.73478 17.8104 2.48043 17.4728 2.29289C17.1352 2.10536 16.6774 2 16.2 2H9" />
      <path d="M12 2V6" />
    </LineIcon>
  )
}

/** پزشک، مشاوره (اسلاگ stethoscope). */
export function StethoscopeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M18.667 15.541a1.042 1.042 0 1 0 0-2.083 1.042 1.042 0 0 0 0 2.083Z" fill="currentColor" stroke="none" />
      <path d="M18.666 17.834a3.333 3.333 0 1 0 0-6.667 3.333 3.333 0 0 0 0 6.667Z" />
      <path d="M7.833 12.833v5c0 1.105.439 2.165 1.22 2.946A4.17 4.17 0 0 0 12 22h2.5a4.17 4.17 0 0 0 4.167-4.167" />
      <path d="M11.167 2h1.5a1 1 0 0 1 1 1v3.914c0 3.205-2.55 5.878-5.757 5.92A5.91 5.91 0 0 1 2 7V3a1 1 0 0 1 1-1h1.5" />
    </LineIcon>
  )
}

/** آزمایش (اسلاگ test-tube). */
export function TestTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M8.29 20.161a3.685 3.685 0 0 1-5.211-5.211L16.029 2l6.013 6.013-2.405.801L8.29 20.161Z" />
      <path d="M6.09 11.939c.939-.366 2.583-.638 4.728.483 2.144 1.12 3.789.849 4.728.483" />
    </LineIcon>
  )
}

/** چسب زخم (اسلاگ bandage). */
export function BandageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M3.065 8.208a3.637 3.637 0 0 1 5.143-5.143l12.727 12.727a3.637 3.637 0 0 1-5.143 5.143L3.065 8.208Z" />
      <path d="M15.792 3.065a3.637 3.637 0 0 1 5.143 5.143L8.208 20.935a3.637 3.637 0 0 1-5.143-5.143L15.792 3.065Z" />
      <path d="M12 13.136a1.136 1.136 0 1 0 0-2.273 1.136 1.136 0 0 0 0 2.273Z" fill="currentColor" stroke="none" />
    </LineIcon>
  )
}

/** تزریق، واکسن (اسلاگ syringe). */
export function SyringeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M17.384 2l4.615 4.615" />
      <path d="M12 4.308l7.692 7.692" />
      <path d="M6.442 13.111l1.923 1.923" />
      <path d="M8.923 10.461l1.923 1.923" />
      <path d="M15.846 8.154l3.846-3.846" />
      <path d="M4.308 19.692L2 22" />
      <path d="M5.429 13.436l7.943-7.944 5.103 5.104-7.943 7.943a3.55 3.55 0 0 1-2.919 1.022l-2.755-.275-.275-2.755a3.55 3.55 0 0 1 1.022-2.919Z" />
    </LineIcon>
  )
}

/** قفل، محتوای قفل‌شده یا نیاز به دسترسی (اسلاگ lock-square در دیگچه؛ مسیرِ fill). */
export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.45492 21.7553L6.68668 21.042L6.45492 21.7553ZM3.24472 18.5451L3.95801 18.3133L3.24472 18.5451ZM20.7553 18.5451L20.042 18.3133L20.7553 18.5451ZM17.5451 21.7553L17.3133 21.042L17.5451 21.7553ZM17.5451 8.24472L17.3133 8.95801L17.5451 8.24472ZM20.7553 11.4549L20.042 11.6867L20.7553 11.4549ZM6.45492 8.24472L6.68668 8.95801L6.45492 8.24472ZM3.24472 11.4549L3.95801 11.6867L3.24472 11.4549ZM12.75 13C12.75 12.5858 12.4142 12.25 12 12.25C11.5858 12.25 11.25 12.5858 11.25 13H12H12.75ZM11.25 17C11.25 17.4142 11.5858 17.75 12 17.75C12.4142 17.75 12.75 17.4142 12.75 17H12H11.25ZM10 8V8.75H14V8V7.25H10V8ZM14 22V21.25H10V22V22.75H14V22ZM10 22V21.25C8.08034 21.25 7.29839 21.2407 6.68668 21.042L6.45492 21.7553L6.22315 22.4686C7.11777 22.7593 8.19709 22.75 10 22.75V22ZM3 15H2.25C2.25 16.8029 2.24075 17.8822 2.53142 18.7768L3.24472 18.5451L3.95801 18.3133C3.75925 17.7016 3.75 16.9197 3.75 15H3ZM6.45492 21.7553L6.68668 21.042C5.39282 20.6216 4.37841 19.6072 3.95801 18.3133L3.24472 18.5451L2.53142 18.7768C3.1002 20.5274 4.47263 21.8998 6.22315 22.4686L6.45492 21.7553ZM21 15H20.25C20.25 16.9197 20.2407 17.7016 20.042 18.3133L20.7553 18.5451L21.4686 18.7768C21.7593 17.8822 21.75 16.8029 21.75 15H21ZM14 22V22.75C15.8029 22.75 16.8822 22.7593 17.7768 22.4686L17.5451 21.7553L17.3133 21.042C16.7016 21.2407 15.9197 21.25 14 21.25V22ZM20.7553 18.5451L20.042 18.3133C19.6216 19.6072 18.6072 20.6216 17.3133 21.042L17.5451 21.7553L17.7768 22.4686C19.5274 21.8998 20.8998 20.5274 21.4686 18.7768L20.7553 18.5451ZM21 15H21.75C21.75 13.1971 21.7593 12.1178 21.4686 11.2232L20.7553 11.4549L20.042 11.6867C20.2407 12.2984 20.25 13.0803 20.25 15H21ZM17.5451 8.24472L17.3133 8.95801C18.6072 9.37841 19.6216 10.3928 20.042 11.6867L20.7553 11.4549L21.4686 11.2232C20.8998 9.47263 19.5274 8.1002 17.7768 7.53142L17.5451 8.24472ZM3 15H3.75C3.75 13.0803 3.75925 12.2984 3.95801 11.6867L3.24472 11.4549L2.53142 11.2232C2.24075 12.1178 2.25 13.1971 2.25 15H3ZM6.45492 8.24472L6.22315 7.53142C4.47263 8.1002 3.1002 9.47263 2.53142 11.2232L3.24472 11.4549L3.95801 11.6867C4.37841 10.3928 5.39282 9.37841 6.68668 8.95801L6.45492 8.24472ZM17 7H16.25V8H17H17.75V7H17ZM7 8H7.75V7H7H6.25V8H7ZM12 2V2.75C14.3472 2.75 16.25 4.65279 16.25 7H17H17.75C17.75 3.82436 15.1756 1.25 12 1.25V2ZM12 2V1.25C8.82436 1.25 6.25 3.82436 6.25 7H7H7.75C7.75 4.65279 9.65279 2.75 12 2.75V2ZM12 13H11.25V17H12H12.75V13H12ZM10 8V7.25C8.58853 7.25 7.6278 7.24738 6.8754 7.37414L7 8.11372L7.1246 8.85329C7.7222 8.75262 8.52815 8.75 10 8.75V8ZM7 8.11372L6.8754 7.37414C6.64772 7.4125 6.43257 7.46338 6.22315 7.53142L6.45492 8.24472L6.68668 8.95801C6.81685 8.91571 6.95935 8.88113 7.1246 8.85329L7 8.11372ZM7 8H6.25V8.11372H7H7.75V8H7ZM14 8V8.75C15.4719 8.75 16.2778 8.75262 16.8754 8.85329L17 8.11372L17.1246 7.37414C16.3722 7.24738 15.4115 7.25 14 7.25V8ZM17 8.11372L16.8754 8.85329C17.0407 8.88113 17.1831 8.91571 17.3133 8.95801L17.5451 8.24472L17.7768 7.53142C17.5674 7.46338 17.3523 7.4125 17.1246 7.37414L17 8.11372ZM17 8H16.25V8.11372H17H17.75V8H17Z" />
    </svg>
  )
}

/** هواپیما از دیگچه (airplane-in-flight)؛ دماغه رو به جلوی RTL (چپ). */
export function PlaneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <g transform="matrix(-1 0 0 1 24 0)">
        <path d="M7 19.1H19.9" />
        <path d="M19.1 9.1H13.4L9.814 5.598a2 2 0 0 0-1.701-.546L7.8 5.1l1 3.9H5.5L4.48 7.98a2 2 0 0 0-2.406-.322L2 7.7l1.3 4.2c.1.6.5 1.1 1 1.5s1.1.6 1.7.6h15.9v-2.1c0-.7-.3-1.5-.8-2s-1.2-.8-2-.8Z" />
      </g>
    </LineIcon>
  )
}

/** اتوبوس از دیگچه (bus). */
export function BusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M5 7h14" />
      <path d="M4.857 10.429h14.286" />
      <path d="M4.855 8a4 4 0 0 1 4-4h6.29a4 4 0 0 1 4 4v8.86H4.855Z" />
      <path d="M15.572 16.857h3.572v1.072a1.786 1.786 0 0 1-3.572 0Z" />
      <path d="M4.857 16.857h3.572v1.072a1.786 1.786 0 0 1-3.572 0Z" />
      <circle cx="8.785" cy="13.643" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15.215" cy="13.643" r=".9" fill="currentColor" stroke="none" />
      <path d="M22 7.571v3M2 7.571v3" />
    </LineIcon>
  )
}

/** قطار؛ در دیگچه نبود (DIGCHE-ISSUES.md)، هم‌سبکِ Linear کشیده شد. */
export function TrainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M6 7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M6 10.5h12" />
      <path d="M10 6.5h4" />
      <circle cx="9" cy="13.75" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="13.75" r=".9" fill="currentColor" stroke="none" />
      <path d="M9 17l-2.5 4M15 17l2.5 4M7.7 19h8.6" />
    </LineIcon>
  )
}

/** ساختمانِ هتل؛ در دیگچه نبود، هم‌سبکِ Linear. */
export function HotelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M2.5 21h19" />
      <path d="M8 7h4M8 11h4M8 15h4" />
      <path d="M10 21v-3" />
    </LineIcon>
  )
}

/** خانه / ویلا؛ در دیگچه نبود، هم‌سبکِ Linear. */
export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9" />
      <path d="M10 21v-5a2 2 0 0 1 4 0v5" />
    </LineIcon>
  )
}

/** چمدان برای تور و سفر؛ در دیگچه نبود، هم‌سبکِ Linear. */
export function SuitcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <rect x="4" y="7" width="16" height="12" rx="2.5" />
      <path d="M9 7v12M15 7v12" />
      <path d="M8 19v2M16 19v2" />
    </LineIcon>
  )
}

/** پوشه از دیگچه (folder)؛ درختِ فایل و مدیریتِ فایل. */
export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <LineIcon strokeWidth={1.5} {...props}>
      <path d="M22 11v6c0 4-1 5-5 5H7c-4 0-5-1-5-5V7c0-4 1-5 5-5h1.5c1.5 0 1.83.44 2.4 1.2l1.5 2c.38.5.6.8 1.6.8h3c4 0 5 1 5 5Z" />
    </LineIcon>
  )
}
