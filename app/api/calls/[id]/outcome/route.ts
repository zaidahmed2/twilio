import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getCallById, saveCallOutcome } from '@/lib/data/calls';
import { updateLeadStatus } from '@/lib/data/leads';
import { logAuditEvent } from '@/lib/data/audit';
import { logGHLCallActivity } from '@/lib/integrations/ghl/contacts';
import { CallOutcome, LeadStatus } from '@/lib/data/types';

const outcomeSchema = z.object({
  outcome: z.enum([
    'Interested',
    'Not Interested',
    'Callback Requested',
    'Qualified',
    'Not Eligible',
    'No Answer',
    'Wrong Number',
    'Other',
  ]),
  notes: z.string().optional(),
});

const outcomeToLeadStatusMap: Record<CallOutcome, LeadStatus> = {
  Interested: 'Interested',
  'Not Interested': 'Not Interested',
  'Callback Requested': 'Callback',
  Qualified: 'Qualified',
  'Not Eligible': 'Not Interested',
  'No Answer': 'No Answer',
  'Wrong Number': 'Not Interested',
  Other: 'Contacted',
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = outcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid call outcome structure' }, { status: 400 });
    }

    const { outcome, notes } = parsed.data;

    const call = await getCallById(params.id);
    if (!call) {
      console.warn(`[CALL OUTCOME WARNING] Call ${params.id} not found in memory store. Outcome recorded as orphaned.`);
      return NextResponse.json({ success: true, warning: 'Call record not found' });
    }

    if (session.role === 'AGENT' && call.agentId !== session.id) {
      console.warn(`[CALL OUTCOME FORBIDDEN] Agent ${session.id} attempted to record outcome on call ${params.id}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Save outcome on call record
    const updatedCall = await saveCallOutcome(params.id, outcome, notes);

    // 2. Map outcome to Lead Status
    const newLeadStatus = outcomeToLeadStatusMap[outcome];
    if (newLeadStatus && call.contactId) {
      await updateLeadStatus(call.contactId, newLeadStatus);
    }

    // 3. Sync to HighLevel if configured
    await logGHLCallActivity(call.contactId, {
      durationSeconds: call.durationSeconds,
      outcome,
      notes,
      agentName: session.name,
    });

    // 4. Audit Log
    await logAuditEvent(session.id, session.role, 'CALL_OUTCOME_UPDATED', {
      callId: params.id,
      contactId: call.contactId,
      outcome,
    });

    console.log(`[CALL OUTCOME SUCCESS] Call ${params.id} outcome saved: "${outcome}" (Notes: "${notes || 'None'}")`);

    return NextResponse.json({ success: true, call: updatedCall });
  } catch (error: any) {
    console.error(`[CALL OUTCOME ERROR] Failed to save outcome for call ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to save call outcome' }, { status: 500 });
  }
}
