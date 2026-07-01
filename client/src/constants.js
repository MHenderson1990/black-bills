export let CATEGORIES = ['Misc.', 'Housing', 'Food', 'Utilities', 'Subscriptions', 'Shopping', 'Entertainment', 'Travel'];
export let MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

export let YEARS = ['2025', '2026', '2027'];

export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { timeZone: 'UTC' });
}