// lib/phone.ts
// US phone helpers: normalize → validate → format

const N11 = new Set(['211','311','411','511','611','711','811','911']);

function stripExtension(input: string): string {
  return String(input ?? '').split(/\s*(?:ext\.?|x)\s*/i)[0] ?? '';
}

/** Digits only, drop leading country code 1, return '' if not valid 10-digit NANP */
export function normalizeUSPhone(input: string): string {
  const digits = stripExtension(input).replace(/\D+/g, '');
  const d = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (d.length !== 10) return '';

  const area = d.slice(0, 3);
  const exch = d.slice(3, 6);
  // NANP: area/exchange cannot start with 0/1; N11 disallowed
  if (area[0] === '0' || area[0] === '1') return '';
  if (exch[0] === '0' || exch[0] === '1') return '';
  if (N11.has(area) || N11.has(exch)) return '';
  return d;
}

/** True if input can be normalized to a valid NANP 10-digit number */
export function isValidUSPhone(input: string): boolean {
  return normalizeUSPhone(input) !== '';
}

/** Strict formatter: throws on invalid */
export function formatUSPhone(input: string): string {
  const d = normalizeUSPhone(input);
  if (!d) throw new Error('Invalid US phone number');
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

/** Lenient formatter for display in tables: if invalid, returns original */
export function formatUSPhoneDisplay(input: string | null | undefined): string {
  if (!input) return '';
  const d = normalizeUSPhone(String(input));
  return d ? `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}` : String(input);
}
