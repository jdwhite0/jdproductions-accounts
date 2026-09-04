const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

export function isValidEmail(value) {
  const email = normalizeEmail(value);
  return email.length > 2 && email.length <= 254 && EMAIL_RE.test(email);
}

export function requireValidEmail(value) {
  const email = normalizeEmail(value);
  if (!isValidEmail(email)) {
    const err = new Error('A valid email is required');
    err.status = 400;
    err.code = 'invalid_email';
    throw err;
  }
  return email;
}
