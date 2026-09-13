import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getLeadById } from '@/lib/data/leads';
import { createCallRecord } from '@/lib/data/calls';
import { logAuditEvent } from '@/lib/data/audit';

const startCallSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = startCallSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid contactId parameter' }, { status: 400 });
    }

    const { contactId } = parsed.data;

    // 1. Verify lead existence
    const lead = await getLeadById(contactId, session.companyId);
    if (!lead) {
      console.error(`[CALL START ERROR] Lead ID ${contactId} not found in GHL CRM / local dataset.`);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 2. Create call record
    const callRecord = await createCallRecord({
      contactId,
      customerName: lead.name,
      customerLocation: `${lead.city}, ${lead.state}`,
      agentId: session.id,
      agentName: session.name,
      companyId: session.companyId,
    });

    await logAuditEvent(session.id, session.role, 'CALL_STARTED', {
      callId: callRecord.id,
      contactId,
      customerName: lead.name,
    });

    console.log(`[CALL START SUCCESS] Call ${callRecord.id} initiated by Agent ${session.name} for Lead "${lead.name}" (${contactId})`);

    return NextResponse.json({
      success: true,
      call: callRecord,
    });
  } catch (error: any) {
    console.error('[CALL START EXCEPTION]:', error);
    return NextResponse.json({ error: 'Unable to start call' }, { status: 500 });
  }
}
