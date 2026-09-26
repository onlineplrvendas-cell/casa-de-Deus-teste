/**
 * Phone formatting, normalization, and validation for Brazilian phones
 */

/**
 * Extracts only digits from string
 */
export function getOnlyDigits(value: string = ''): string {
  return value.replace(/\D/g, '');
}

/**
 * Masks a phone number to (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export function maskPhoneBR(value: string): string {
  const digits = getOnlyDigits(value).slice(0, 11);

  if (!digits) return '';
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Mobile: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Normalizes phone to standard 55XXXXXXXXXXX format for WhatsApp/persistence
 */
export function normalizePhone(value: string): string {
  let digits = getOnlyDigits(value);
  if (!digits) return '';

  // If already starts with 55 and has 12 or 13 digits
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Prepend Brazil country code 55
  return `55${digits}`;
}

/**
 * Validates whether string is a valid Brazilian phone (10 or 11 digits without country code, or with 55)
 */
export function isValidPhoneBR(value: string): boolean {
  const digits = getOnlyDigits(value);
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return true;
  }
  return digits.length === 10 || digits.length === 11;
}

/**
 * Generates direct WhatsApp URL
 */
export function getWhatsAppUrl(phone: string): string {
  const normalized = normalizePhone(phone);
  return `https://wa.me/${normalized}`;
}
