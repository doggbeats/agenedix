/**
 * E-mails autorizados a acessar a administração da plataforma.
 *
 * O controle por e-mail evita que qualquer usuário marcado acidentalmente como
 * `isPlatformAdmin` tenha acesso ao /admin. Para trocar os responsáveis, defina
 * `PLATFORM_ADMIN_EMAILS` no ambiente (lista separada por vírgula).
 */
const DEFAULT_PLATFORM_ADMIN_EMAILS = [
  "admin.1973@agendix.app",
  "admin@agendix.app",
];

function parseEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

const configuredEmails = parseEmails(
  process.env.PLATFORM_ADMIN_EMAILS ?? process.env.PLATFORM_ADMIN_EMAIL,
);

export const PLATFORM_ADMIN_EMAILS =
  configuredEmails.length > 0 ? configuredEmails : DEFAULT_PLATFORM_ADMIN_EMAILS;

export const PLATFORM_ADMIN_EMAIL = PLATFORM_ADMIN_EMAILS[0];

export function isPlatformAdminUser(user: {
  email: string;
  isPlatformAdmin: boolean;
}): boolean {
  return (
    user.isPlatformAdmin &&
    PLATFORM_ADMIN_EMAILS.includes(user.email.trim().toLowerCase())
  );
}
