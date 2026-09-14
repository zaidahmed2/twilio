import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import twilio from 'twilio';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getLeadById } from '@/lib/data/leads';
import { createCallRecord } from '@/lib/data/calls';
import { logAuditEvent } from '@/lib/data/audit';

const startCallSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  targetPhone: z.string().optional(),
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

    const { contactId, targetPhone } = parsed.data;

    // 1. Verify lead existence or support direct manual dialing
    const lead = await getLeadById(contactId, session.companyId);
    const isDirectNumber = contactId.startsWith('+') || /^\d{6,15}$/.test(contactId.replace(/\D/g, ''));
    
    if (!lead && !isDirectNumber) {
      console.error(`[CALL START ERROR] Lead ID ${contactId} not found in GHL CRM / local dataset.`);
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const customerName = lead ? lead.name : `Direct Call (${contactId})`;
    const customerLocation = lead ? `${lead.city}, ${lead.state}` : 'Direct Dial';

    // 2. Create call record
    const callRecord = await createCallRecord({
      contactId,
      customerName,
      customerLocation,
      agentId: session.id,
      agentName: session.name,
      companyId: session.companyId,
    });

    const conferenceRoom = `room_${callRecord.id.replace(/[^a-zA-Z0-9_]/g, '')}`;

    await logAuditEvent(session.id, session.role, 'CALL_STARTED', {
      callId: callRecord.id,
      contactId,
      customerName,
    });

    console.log(`[CALL START SUCCESS] Call ${callRecord.id} initiated by Agent ${session.name} for Lead "${customerName}" (${contactId})`);

    return NextResponse.json({
      success: true,
      call: callRecord,
    });
  } catch (error: any) {
    console.error('[CALL START EXCEPTION]:', error);
    return NextResponse.json({ error: 'Unable to start call' }, { status: 500 });
  }
}
