// Validation utilities for Pakistan-specific formats

/**
 * Format B-Form/CRC number (#####-#######-#)
 */
export function formatBForm(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format: #####-#######-#
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
}

/**
 * Validate B-Form/CRC format (#####-#######-#)
 */
export function validateBForm(bForm: string): boolean {
  const cleaned = bForm.replace(/\D/g, '');
  return cleaned.length === 13;
}

/**
 * Format CNIC number (#####-#######-#)
 */
export function formatCNIC(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Format: #####-#######-#
  if (digits.length <= 5) {
    return digits;
  } else if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  } else {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`;
  }
}

/**
 * Validate CNIC format (#####-#######-#)
 */
export function validateCNIC(cnic: string): boolean {
  const cleaned = cnic.replace(/\D/g, '');
  return cleaned.length === 13;
}

/**
 * Format Pakistan mobile number (+92 / 03xxxxxxxxx)
 * Accepts: +92xxxxxxxxxxx, 03xxxxxxxxx, 03xx-xxxxxxx, etc.
 */
export function formatMobileNumber(value: string): string {
  // If empty, return as is
  if (!value) return value;

  // Check if starts with + to preserve it
  const hasLeadingPlus = value.startsWith('+');

  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // If user typed just "+", return it
  if (hasLeadingPlus && digits.length === 0) {
    return '+';
  }
  
  // If originally had +, preserve it with the digits
  if (hasLeadingPlus) {
    return '+' + digits;
  }
  
  // If starts with 92 and has 12 digits total, convert to +92 format
  if (digits.startsWith('92') && digits.length === 12) {
    return `+92${digits.slice(2)}`;
  }
  
  // If starts with 0 and has 11 digits, keep as is
  if (digits.startsWith('0') && digits.length === 11) {
    return digits;
  }
  
  // If 10 digits and DOES NOT start with 0, assume it's missing the leading 0
  if (digits.length === 10 && !digits.startsWith('0')) {
    return `0${digits}`;
  }
  
  // If 11 digits and doesn't start with 0, assume it's with country code (convert to local)
  if (digits.length === 11 && !digits.startsWith('0')) {
    return `0${digits}`;
  }
  
  // For any other case, return the digits as is to allow typing
  return digits;
}

/**
 * Validate Pakistan mobile number format
 * Accepts: +92xxxxxxxxxxx or 03xxxxxxxxx
 */
export function validateMobileNumber(mobile: string): boolean {
  if (!mobile || !mobile.trim()) {
    return false;
  }
  
  // Remove all non-digits except +
  const cleaned = mobile.replace(/[^\d+]/g, '');
  
  // Format: +92xxxxxxxxxxx (10 digits after +92)
  if (cleaned.startsWith('+92')) {
    const digits = cleaned.slice(3);
    return digits.length === 10 && /^[0-9]{10}$/.test(digits);
  }
  
  // Format: 03xxxxxxxxx (11 digits starting with 0)
  if (cleaned.startsWith('0')) {
    return cleaned.length === 11 && /^0[3-9][0-9]{9}$/.test(cleaned);
  }
  
  // Also accept format starting with 92 (without +)
  if (cleaned.startsWith('92') && cleaned.length === 12) {
    const digits = cleaned.slice(2);
    return /^[0-9]{10}$/.test(digits);
  }
  
  return false;
}

/**
 * Get current academic session (e.g., "2025-26")
 */
export function getCurrentAcademicSession(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const nextYear = currentYear + 1;
  
  // If after June, it's the new session
  if (now.getMonth() >= 6) {
    return `${currentYear}-${nextYear.toString().slice(2)}`;
  } else {
    return `${currentYear - 1}-${currentYear.toString().slice(2)}`;
  }
}
