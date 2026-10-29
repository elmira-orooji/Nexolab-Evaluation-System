import {t, locale} from './i18n.js';
import React from 'react';

const number = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
const colors = ['var(--primary)', 'var(--chart-2)', 'var(--chart-3)'];

export function DonutChart({ segments, centerLabel }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  let position = 0;
  const stops = segments.map((item, index) => {
    const start = position;
    position += total ? item.value / total * 100 : 0;
    return `${colors[index % colors.length]} ${start}% ${position}%`;
  });
  return <div className="space-y-6">
    <div className="relative mx-auto flex size-40 items-center justify-center rounded-full" role="img" aria-label={segments.map((item) => item.label + ': ' + number(item.value)).join(t("، "))} style={{ background: total ? 'conic-gradient(' + stops.join(',') + ')' : 'var(--border)' }}>
      <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-card"><strong className="text-xl font-normal">{total ? number(total) : '—'}</strong><span className="text-caption text-muted-foreground">{total ? centerLabel : t("داده‌ای ثبت نشده")}</span></div>
    </div>
    <ul className="m-0 list-none space-y-3 p-0">{segments.map((item,index) => <li key={item.label} className="flex items-center gap-2 text-label"><span className="size-2 rounded-full" aria-hidden="true" style={{ background: colors[index % colors.length] }}/><span className="flex-1 text-muted-foreground">{item.label}</span><span>{number(item.value)}</span><span className="text-caption text-muted-foreground">{total ? number(item.value / total * 100) + t("٪") : '—'}</span></li>)}</ul>
  </div>;
}

export function ReviewCriteriaChart({ reviews }) {
  const criteria = [['correctness',t("درستی پاسخ")],['relevance',t("ارتباط با پرسش")],['source_adequacy',t("کفایت منبع")],['citation_quality',t("کیفیت استناد")]];
  return <div className="space-y-6">{criteria.map(([key,label]) => {
    const scores = Object.values(reviews || {}).map((review) => Number(review[key])).filter((value) => Number.isInteger(value) && value >= 1 && value <= 4);
    const mean = scores.length ? scores.reduce((sum,value) => sum + value, 0) / scores.length : null;
    return <div className="space-y-2" key={key}><div className="flex justify-between gap-3 text-label"><span className="text-muted-foreground">{label}</span><span>{mean === null ? t("ثبت نشده") : number(mean) + t(" از ۴")}</span></div><div role="img" aria-label={label + ': ' + (mean === null ? t("ثبت نشده") : number(mean) + t(" از ۴"))} className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: mean === null ? '0%' : mean / 4 * 100 + '%' }}/></div></div>;
  })}<p className="text-caption text-muted-foreground">{t("میانگین امتیازهای ثبت‌شده توسط ارزیاب؛ مقیاس ۱ تا ۴.")}</p></div>;
}
