// lib/phone.ts
export type PhoneCheck = {
  ok: boolean;
  e164?: string;
  readable?: string;
  reason?: string;
};

/**
 * Normalize and validate a US/NANP phone number.
 * - Allows optional leading '1'
 * - Requires 10 digits after normalization
 * - Enforces NANP NXX rules for area and exchange, and disallows N11 exchange
 */
export function normalizeUSPhone(raw: string): PhoneCheck {
  const digits = (raw || '').replace(/\D+/g, '');
  let d = digits;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);

  if (d.length !== 10) {
    return { ok: false, reason: 'Phone must have 10 digits (US/NANP).' };
  }

  const areaA = d[0], exchA = d[3], exchB = d[4], exchC = d[5];

  if (!/[2-9]/.test(areaA)) {
    return { ok: false, reason: 'Area code must start with 2-9.' };
  }
  if (!/[2-9]/.test(exchA)) {
    return { ok: false, reason: 'Exchange must start with 2-9.' };
  }
  if (exchB === '1' && exchC === '1') {
    return { ok: false, reason: 'Exchange cannot be N11 (e.g., 211, 311, 911).' };
  }

  const e164 = `+1${d}`;
  const readable = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return { ok: true, e164, readable };
}

/** Best-effort display formatter. */
export function formatUSPhoneDisplay(input: string | null | undefined): string {
  if (!input) return '';
  const digits = String(input).replace(/\D+/g, '');
  let d = digits;
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);
  if (d.length !== 10) return String(input);
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
