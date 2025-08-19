// lib/phone.ts

export type PhoneCheckOk = {
  ok: true;
  /** E.164 with +1, e.g. +15095551234 */
  e164: string;
  /** Nice display, e.g. (509) 555-1234 */
  display: string;
};

export type PhoneCheckErr = {
  ok: false;
  e164: null;
  display: null;
  /** Human-friendly reason */
  reason: string;
};

export type PhoneCheck = PhoneCheckOk | PhoneCheckErr;

/** Keep only digits. */
function digitsOnly(s: string): string {
  return (s || '').replace(/\D+/g, '');
}

/** Basic NANP rules: 10 digits, area & exchange cannot start with 0/1. */
export function normalizeUSPhone(input: string): PhoneCheck {
  let d = digitsOnly(input);

  // Allow leading country code 1
  if (d.length === 11 && d.startsWith('1')) d = d.slice(1);

  if (d.length !== 10) {
    return {
      ok: false,
      e164: null,
      display: null,
      reason: 'Must contain exactly 10 digits',
    };
  }

  const area = d.slice(0, 3);
  const exch = d.slice(3, 6);
  const line = d.slice(6);

  if (!/[2-9]/.test(area[0])) {
    return {
      ok: false,
      e164: null,
      display: null,
      reason: 'Area code cannot start with 0 or 1',
    };
  }
  if (!/[2-9]/.test(exch[0])) {
    return {
      ok: false,
      e164: null,
      display: null,
      reason: 'Exchange cannot start with 0 or 1',
    };
  }

  const e164 = `+1${d}`;
  const display = `(${area}) ${exch}-${line}`;
  return { ok: true, e164, display };
}

/** Boolean convenience. */
export function isLikelyUSPhone(input: string): boolean {
  return normalizeUSPhone(input).ok;
}

/** Return display format or throw when invalid. */
export function formatUSPhone(input: string): string {
  const n = normalizeUSPhone(input);
  if (!n.ok) throw new Error('Invalid US phone number');
  return n.display;
}

/**
 * Return display format when valid; otherwise return the original input.
 * Use this for read-only lists so you don’t crash on legacy data.
 */
export function formatUSPhoneDisplay(input: string): string {
  const n = normalizeUSPhone(input);
  return n.ok ? n.display : input;
}
