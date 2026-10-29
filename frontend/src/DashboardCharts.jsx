import {t, locale} from './i18n.js';
import React from 'react';

const number = (value) => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(value);
import './dashboard-charts.css';
const colors = ['var(--primary)', 'var(--chart-2, var(--muted-foreground))', 'var(--chart-3, var(--border))'];

export function DonutChart({ segments, centerLabel }) {
  const total = segments.reduce((sum,item)=>sum+Math.max(0,item.value),0);
  const circumference=2*Math.PI*64;
  let offset=0;
  return <div className="analytics-donut">
    <div className="analytics-donut__visual"><svg viewBox="0 0 160 160" role="img" aria-label={segments.map(item=>item.label+': '+number(item.value)).join(t("، "))}>
      <circle cx="80" cy="80" r="64" fill="none" stroke="var(--muted)" strokeWidth="13"/>
      {segments.map((item,index)=>{const fraction=total?Math.max(0,item.value)/total:0;const length=fraction*circumference;const current=offset;offset+=length;if(!fraction)return null;return <circle key={item.label} className="analytics-donut__arc" style={{"--arc-length":Math.max(0,length-(fraction<1?4:0)),"--arc-circumference":circumference,"--chart-delay":`${index*60}ms`}} cx="80" cy="80" r="64" fill="none" stroke={item.color||colors[index%colors.length]} strokeWidth="13" strokeDasharray={`${Math.max(0,length-(fraction<1?4:0))} ${circumference}`} strokeDashoffset={-current} transform="rotate(-90 80 80)"><title>{item.label+': '+number(item.value)+' · '+number(fraction*100)+t("٪")}</title></circle>;})}
    </svg><div className="analytics-donut__center"><strong>{total?number(total):'—'}</strong><span>{total?centerLabel:t("داده‌ای ثبت نشده")}</span></div></div>
    <ul className="analytics-legend">{segments.map((item,index)=><li key={item.label}><span className="analytics-legend__dot" style={{background:item.color||colors[index%colors.length]}}/><span className="analytics-legend__label">{item.label}</span><strong>{number(item.value)}</strong><span className="analytics-legend__percent">{total?number(item.value/total*100)+t("٪"):'—'}</span></li>)}</ul>
  </div>;
}

export function ReviewCriteriaChart({ reviews }) {
  const criteria = [['correctness',t("درستی پاسخ")],['relevance',t("ارتباط با پرسش")],['source_adequacy',t("کفایت منبع")],['citation_quality',t("کیفیت استناد")]];
  return <div className="analytics-criteria space-y-6">{criteria.map(([key,label],index) => {
    const scores = Object.values(reviews || {}).map((review) => Number(review[key])).filter((value) => Number.isInteger(value) && value >= 1 && value <= 4);
    const mean = scores.length ? scores.reduce((sum,value) => sum + value, 0) / scores.length : null;
    return <div className="space-y-2" key={key}><div className="flex justify-between gap-3 text-label"><span className="text-muted-foreground">{label}</span><span>{mean === null ? t("ثبت نشده") : number(mean) + t(" از ۴")}</span></div><div role="img" aria-label={label + ': ' + (mean === null ? t("ثبت نشده") : number(mean) + t(" از ۴"))} className="analytics-criteria__track"><div className="analytics-criteria__fill" style={{ width: mean === null ? '0%' : mean / 4 * 100 + '%', '--chart-delay': `${index*50}ms` }}/></div></div>;
  })}<p className="text-caption text-muted-foreground">{t("میانگین امتیازهای ثبت‌شده توسط ارزیاب؛ مقیاس ۱ تا ۴.")}</p></div>;
}
