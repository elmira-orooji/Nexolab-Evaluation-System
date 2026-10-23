import React, { useId } from 'react';

export default function LatencyChart({ results }) {
  const gradientId = useId();
  const rows = results.filter((row) => typeof row.duration_ms === 'number' && Number.isFinite(row.duration_ms) && row.duration_ms >= 0);
  if (!rows.length) return <div className="dashboard-empty"><p>زمانی ثبت نشده است.</p></div>;
  const values = rows.map((row) => Math.max(0, Number(row.duration_ms)));
  const maximum = Math.max(1, ...values);
  const x = (index) => rows.length === 1 ? 300 : 55 + index / (rows.length - 1) * 490;
  const y = (value) => 205 - value / maximum * 160;
  const points = values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const format = (value) => Math.round(value).toLocaleString('fa-IR');
  return <div className="latency-chart"><svg viewBox="0 0 600 255" role="img" aria-label="زمان پاسخ هر پرسش بر حسب میلی‌ثانیه">
    <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".16"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
    {[0, .5, 1].map((ratio) => <g key={ratio}><line x1="55" x2="545" y1={y(maximum * ratio)} y2={y(maximum * ratio)} className="chart-gridline"/><text x="45" y={y(maximum * ratio) + 4} textAnchor="end">{format(maximum * ratio)}</text></g>)}
    <polygon points={`55,205 ${points} ${x(rows.length - 1)},205`} fill={`url(#${gradientId})`}/><polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
    {rows.map((row, index) => <g key={row.case_id}><circle cx={x(index)} cy={y(values[index])} r="5" className="chart-point"><title>{`${row.case_id}: ${format(values[index])} میلی‌ثانیه${row.error ? ' · خطا' : ''}`}</title></circle>{(rows.length <= 8 || index === 0 || index === rows.length - 1) && <text x={x(index)} y="235" textAnchor="middle">{row.case_id}</text>}</g>)}
  </svg><p className="muted">هر نقطه یک درخواست است؛ جزئیات زمان با نگه‌داشتن نشانگر روی آن نمایش داده می‌شود.</p></div>;
}
