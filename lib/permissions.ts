export type MembershipRole = "OWNER" | "ADMIN" | "PROFESSIONAL";

export type AppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "NO_SHOW", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function isManagerRole(role: MembershipRole): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function canViewAllAppointments(role: MembershipRole): boolean {
  return isManagerRole(role);
}

export function canManageServices(role: MembershipRole): boolean {
  return isManagerRole(role);
}

export function canManageProfessionals(role: MembershipRole): boolean {
  return isManagerRole(role);
}

export function canManageSettings(role: MembershipRole): boolean {
  return isManagerRole(role);
}

export function canManageBranding(role: MembershipRole): boolean {
  return isManagerRole(role);
}

export function canManageTeam(role: MembershipRole): boolean {
  return role === "OWNER";
}

export function canManageSubscription(role: MembershipRole): boolean {
  return role === "OWNER";
}

export function canAccessAppointment(
  role: MembershipRole,
  userProfessionalId: string | null | undefined,
  appointmentProfessionalId: string,
): boolean {
  if (isManagerRole(role)) return true;
  return Boolean(userProfessionalId) && userProfessionalId === appointmentProfessionalId;
}

export function canTransitionStatus(
  current: AppointmentStatus,
  next: AppointmentStatus,
): boolean {
  return transitions[current]?.includes(next) ?? false;
}

export function canMoveStatus(
  role: MembershipRole,
  current: AppointmentStatus,
  next: AppointmentStatus,
): boolean {
  if (isManagerRole(role)) return canTransitionStatus(current, next);
  return next !== "CONFIRMED" && canTransitionStatus(current, next);
}

export function isTerminalStatus(status: AppointmentStatus): boolean {
  return status === "COMPLETED" || status === "CANCELLED" || status === "NO_SHOW";
}
