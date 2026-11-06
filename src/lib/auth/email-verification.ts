export interface EmailVerificationUser {
  emailVerifiedAt: Date | null;
  emailVerificationExempt: boolean;
}

/**
 * Contas novas só liberam o painel depois de confirmar o e-mail.
 * Contas antigas (marcadas como isentas) continuam entrando com aviso.
 */
export function requiresEmailVerification(user: EmailVerificationUser): boolean {
  return !user.emailVerifiedAt && !user.emailVerificationExempt;
}

export function isEmailVerified(user: EmailVerificationUser): boolean {
  return Boolean(user.emailVerifiedAt);
}
