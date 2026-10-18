const metrics = [
  { label: 'مجموع پرسش‌ها', valueId: 'stat-cases', detailId: 'stat-suite', icon: 'Q', tone: 'violet' },
  { label: 'اجراهای ثبت‌شده', valueId: 'stat-runs', detail: 'در این فضای کاری', icon: '↗', tone: 'blue' },
  { label: 'بازبینی دستی', valueId: 'stat-reviewed', detailId: 'stat-reviewed-caption', icon: '✓', tone: 'green' },
  { label: 'وضعیت آخرین اجرا', valueId: 'stat-status', detailId: 'stat-last-run', icon: '◷', tone: 'amber', status: true },
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountDashboardMetrics(container) {
  if (!container || container.childElementCount) return;

  for (const metric of metrics) {
    const card = element('article', `stat-card stat-card--${metric.tone}`);
    const heading = element('div', 'stat-card__heading');
    const label = element('span', 'stat-card__label', metric.label);
    const icon = element('span', 'stat-card__icon', metric.icon);
    icon.setAttribute('aria-hidden', 'true');
    heading.append(label, icon);

    const value = element('strong', `stat-card__value${metric.status ? ' status-value' : ''}`, '—');
    value.id = metric.valueId;
    const detail = element('small', 'stat-card__detail', ' ');
    if (metric.detailId) detail.id = metric.detailId;
    if (metric.detail) detail.textContent = metric.detail;
    card.append(heading, value, detail);
    container.append(card);
  }
}
