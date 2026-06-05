export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

export const formatDate = (value: string | null | undefined) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

export const compactNumber = (value: number | null | undefined) =>
  new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(
    Number(value ?? 0),
  );

export const scoreLabel = (value: number | null | undefined) =>
  Number(value ?? 0).toLocaleString('id-ID');
