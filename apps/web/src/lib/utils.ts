import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function maskIdentifier(identifier: string, type: 'PASSPORT' | 'AADHAAR' | 'GENERIC' = 'GENERIC'): string {
  if (!identifier) return '';
  const clean = identifier.trim();
  if (type === 'AADHAAR') {
    return `XXXX-XXXX-${clean.slice(-4)}`;
  }
  if (clean.length <= 4) {
    return '***' + clean.slice(-1);
  }
  return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
}
