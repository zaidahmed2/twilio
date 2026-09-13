import { AuditLog, UserRole } from './types';

let auditStore: AuditLog[] = [];

export async function logAuditEvent(
  userId: string,
  userRole: UserRole,
  action: string,
  details: Record<string, any> = {}
): Promise<AuditLog> {
  // Sanitize details to guarantee zero phone leakage in audit logs
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.phone;
  delete sanitizedDetails.phoneNumber;
  delete sanitizedDetails.to;
  delete sanitizedDetails.from;

  const log: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId,
    userRole,
    action,
    details: sanitizedDetails,
  };

  auditStore.unshift(log);
  return log;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return [...auditStore];
}
