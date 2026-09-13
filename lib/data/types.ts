export type UserRole = 'ADMIN' | 'AGENT';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Callback'
  | 'Not Interested'
  | 'No Answer'
  | 'Qualified';

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'answered'
  | 'completed'
  | 'busy'
  | 'no-answer'
  | 'failed'
  | 'canceled';

export type CallOutcome =
  | 'Interested'
  | 'Not Interested'
  | 'Callback Requested'
  | 'Qualified'
  | 'Not Eligible'
  | 'No Answer'
  | 'Wrong Number'
  | 'Other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  status: 'active' | 'disabled';
  assignedLeadsCount?: number;
  callsToday?: number;
  connectedCalls?: number;
  interestedLeads?: number;
}

// Safe Lead interface (Phone is present ONLY for ADMIN role, strictly stripped for AGENT)
export interface SafeLead {
  id: string;
  name: string;
  city: string;
  state: string;
  status: LeadStatus;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  companyId: string;
  lastContact: string | null;
  createdAt: string;
  tags?: string[];
  phone?: string; // Visible ONLY to ADMIN
}

export interface CallRecord {
  id: string;
  contactId: string;
  customerName: string;
  customerLocation: string;
  agentId: string;
  agentName: string;
  companyId: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  status: CallStatus;
  outcome?: CallOutcome;
  notes?: string;
  recordingUrl?: string;
  twilioCallSid?: string;
}

export interface Assignment {
  id: string;
  contactId: string;
  agentId: string;
  companyId: string;
  assignedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userRole: UserRole;
  action: string;
  details: Record<string, any>;
}
