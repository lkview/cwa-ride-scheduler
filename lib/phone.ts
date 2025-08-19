// lib/phone.ts
// Tiny US phone helpers: normalize → validate → format

const N11 = new Set(['211', '311', '411', '511', '611', '711', '811', '911']);

function stripExtension(input: string): string {
  // keep everything before common extension markers
  const m = input.split(/\s*(?:ext\.?|x)\s*/i)[0];
  return m ?? input;
}

/** Return only digits, drop leading country code "1", else '' if not 10 digits or fails NANP rules */
export function normalizeUSPhone(input: string): string {
  const digitsOnly = stripExtension(String(input ?? '')).replace(/\D+/g, '');
  const d = digitsOnly.length === 11 && digitsOnly.startsWith('1')
    ? digitsOnly.slice(1)
    : digitsOnly;

  if (d.length !== 10) return '';

  const area = d.slice(0, 3);
  const exch = d.slice(3, 6);

  // NANP: area & exchange cannot start with 0/1; N11 disallowed
  if (area[0] === '0' || area[0] === '1') return '';
  if (exch[0] === '0' || exch[0] === '1') return '';
  if (N11.has(area) || N11.has(exch)) return '';

  return d;
}

/** True if the input can be normalized to a valid 10-digit NANP number */
export function isValidUSPhone(input: string): boolean {
  return normalizeUSPhone(input) !== '';
}

/** Return "(XXX) XXX-XXXX" or throw Error('Invalid US phone number') */
export function formatUSPhone(input: string): string {
  const d = normalizeUSPhone(input);
  if (!d) throw new Error('Invalid US phone number');
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
