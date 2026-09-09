const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/]/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isMinPasswordLength(password: string, minLength = 8): boolean {
  return password.length >= minLength;
}

export function hasSpecialCharacter(password: string): boolean {
  return SPECIAL_CHAR_REGEX.test(password);
}

export function doPasswordsMatch(p1: string, p2: string): boolean {
  return p1 === p2;
}

export function getRegistrationValidationError(
  email: string,
  pass: string,
  confirmPass: string
): string | null {
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address.';
  }
  if (!isMinPasswordLength(pass, 8)) {
    return 'Password must be at least 8 characters long.';
  }
  if (!hasSpecialCharacter(pass)) {
    return 'Password must include at least one special character.';
  }
  if (!doPasswordsMatch(pass, confirmPass)) {
    return 'Passwords do not match.';
  }
  return null;
}
