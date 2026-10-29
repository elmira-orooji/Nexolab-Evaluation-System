import React from 'react';
import {BookOpen, CheckCheck, Target, Files, Link2, Info} from 'lucide-react';
import {t, getLanguage, locale} from './i18n.js';
import './guide-page.css';
const icons = {correctness:CheckCheck,relevance:Target,source_adequacy:Files,citation_quality:Link2};
export default function GuidePage({criteria}) {
 const fa=getLanguage()==='fa';
 const steps=fa?['پرسش و پاسخ مرجع را بخوانید','اسناد و ارجاع‌ها را بررسی کنید','هر معیار را جداگانه امتیاز دهید']:['Read the question and reference','Inspect sources and citations','Score each criterion independently'];
 const ratings=fa?['ضعیف','تاحدی','عمدتاً','کامل']:['Poor','Partial','Mostly met','Fully met'];
 const count=n=>n.toLocaleString(locale());
 return <div className="evaluation-guide">
  <header className="evaluation-guide__header"><span className="evaluation-guide__eyebrow"><BookOpen size={16} aria-hidden="true"/>{fa?'راهنمای بازبینی انسانی':'Human review handbook'}</span><h1>{t('راهنمای ارزیابی')}</h1><p>{t('مبنای مشترک برای بازبینی پاسخ‌ها و منابع')}</p></header>
  <section className="evaluation-guide__steps" aria-label={fa?'مراحل بازبینی':'Review workflow'}>{steps.map((step,i)=><div key={step}><span>{count(i+1)}</span><p>{step}</p></div>)}</section>
  <div className="evaluation-guide__section-heading"><h2>{fa?'معیارها و مقیاس امتیازدهی':'Criteria and scoring scale'}</h2><span>{fa?'۴ معیار · امتیاز ۱ تا ۴':'4 criteria · Score 1–4'}</span></div>
  <div className="evaluation-guide__grid">{criteria.map((item,index)=>{const Icon=icons[item.key]||BookOpen;const descriptions=item.guide.split(/[;؛]/).map(text=>text.trim().replace(/^[0-9۰-۹]+\s*[:：]\s*/,''));return <section className="evaluation-guide__criterion" key={item.key} aria-labelledby={'guide-'+item.key}><header><span className="evaluation-guide__icon"><Icon size={19} aria-hidden="true"/></span><h3 id={'guide-'+item.key}>{item.title}</h3><span className="evaluation-guide__index">{count(index+1).padStart(2,fa?'۰':'0')}</span></header><ol>{descriptions.map((description,i)=><li key={i}><span className="evaluation-guide__score">{count(i+1)}</span><div><strong>{ratings[i]||''}</strong><p>{description}</p></div></li>)}</ol></section>;})}</div>
  <aside className="evaluation-guide__note"><Info size={18} aria-hidden="true"/><p>{t('نام ارزیاب را ثبت کنید و برای امتیازهای پایین، دلیل و شاهد بنویسید. هر ثبت یا حذف ارزیابی در تاریخچهٔ همان پرسش باقی می‌ماند.')}</p></aside>
 </div>;
}
