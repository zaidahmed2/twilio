import { CallRecord, CallStatus, CallOutcome } from './types';

const globalForCalls = globalThis as unknown as { callsStore?: CallRecord[] };
if (!globalForCalls.callsStore) {
  globalForCalls.callsStore = [];
}
const callsStore = globalForCalls.callsStore;

export async function getCalls(companyId: string = 'company_default'): Promise<CallRecord[]> {
  return callsStore.filter((c) => c.companyId === companyId);
}

export async function getCallsForAgent(agentId: string, companyId: string = 'company_default'): Promise<CallRecord[]> {
  return callsStore.filter((c) => c.companyId === companyId && c.agentId === agentId);
}

export async function getCallById(callId: string): Promise<CallRecord | null> {
  return callsStore.find((c) => c.id === callId) || null;
}

export async function isContactCallLocked(contactId: string): Promise<boolean> {
  return false; // Disabled lock check to allow instant repeat calling without blocking
}

export async function createCallRecord(data: {
  contactId: string;
  customerName: string;
  customerLocation: string;
  agentId: string;
  agentName: string;
  companyId?: string;
}): Promise<CallRecord> {
  const companyId = data.companyId || 'company_default';

  const newCall: CallRecord = {
    id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    contactId: data.contactId,
    customerName: data.customerName,
    customerLocation: data.customerLocation,
    agentId: data.agentId,
    agentName: data.agentName,
    companyId,
    startTime: new Date().toISOString(),
    durationSeconds: 0,
    status: 'initiated',
  };

  callsStore.unshift(newCall);
  return newCall;
}

export async function updateCallStatus(
  callId: string,
  status: CallStatus,
  twilioCallSid?: string
): Promise<CallRecord | null> {
  const call = callsStore.find((c) => c.id === callId || c.twilioCallSid === twilioCallSid);
  if (!call) return null;

  call.status = status;
  if (twilioCallSid) {
    call.twilioCallSid = twilioCallSid;
  }

  if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(status)) {
    call.endTime = new Date().toISOString();
    if (call.startTime) {
      const durationMs = new Date(call.endTime).getTime() - new Date(call.startTime).getTime();
      call.durationSeconds = Math.max(0, Math.floor(durationMs / 1000));
    }
  }

  return call;
}

export async function saveCallOutcome(
  callId: string,
  outcome: CallOutcome,
  notes?: string
): Promise<CallRecord | null> {
  const call = callsStore.find((c) => c.id === callId);
  if (!call) return null;

  call.outcome = outcome;
  call.notes = notes;
  return call;
}

export function releaseCallLock(contactId: string): void {
  // No-op
}
