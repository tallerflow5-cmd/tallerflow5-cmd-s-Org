export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor || 0);
}

export function formatearFecha(fechaStr?: string): string {
  if (!fechaStr) return '—';
  try {
    const d = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: fechaStr.includes(':') ? '2-digit' : undefined,
      minute: fechaStr.includes(':') ? '2-digit' : undefined,
    });
  } catch {
    return fechaStr;
  }
}

export function formatearFechaCorta(fechaStr?: string): string {
  if (!fechaStr) return '—';
  try {
    const d = new Date(fechaStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return fechaStr;
    return d.toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return fechaStr;
  }
}
