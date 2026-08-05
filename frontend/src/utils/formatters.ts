export const formatCurrency = (val: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: val < 1 && val > 0 ? 6 : 2, // Show more precision for small numbers (e.g. cents)
  }).format(val);
};

export const formatPercentage = (val: number): string => {
  if (val === undefined || isNaN(val)) return '0.00%';
  const prefix = val >= 0 ? '+' : '';
  return `${prefix}${val.toFixed(2)}%`;
};

export const formatNumber = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatDate = (val: string): string => {
  if (!val) return '';
  const d = new Date(val);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
