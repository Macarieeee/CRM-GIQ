export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function toDateOnly(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

export function formatDate(value, locale = 'ro-RO') {
  if (!value) return '—';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function isToday(dateString) {
  return dateString === todayISO();
}

export function isPast(dateString) {
  return Boolean(dateString) && dateString < todayISO();
}

export function isThisWeek(dateString) {
  if (!dateString) return false;
  const today = new Date(todayISO());
  const end = new Date(today);
  end.setDate(today.getDate() + 7);
  const date = new Date(dateString);
  return date >= today && date <= end;
}

export function formatMoney(value, currency = 'EUR') {
  const number = Number(value || 0);
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(number);
}
