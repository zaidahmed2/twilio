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

    // 3. Initiate the call on Twilio directly via proven REST API
    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const fromPhone = (process.env.TWILIO_PHONE_NUMBER || '+17372212163').trim();

    let twilioCallSid: string | null = null;
    let twilioCallStatus: string = 'ringing';

    if (accountSid && authToken) {
      try {
        const client = twilio(accountSid, authToken);
        const destinationPhone = targetPhone || (lead?.phone && lead.phone !== 'N/A' ? lead.phone : contactId);
        const formattedDestination = destinationPhone.startsWith('+') ? destinationPhone : `+${destinationPhone.replace(/\D/g, '')}`;

        console.log(`[CALL START TWILIO] Ringing ${formattedDestination} from ${fromPhone}...`);

        const twilioCall = await client.calls.create({
          from: fromPhone,
          to: formattedDestination,
          url: 'https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition',
        });

        twilioCallSid = twilioCall.sid;
        twilioCallStatus = twilioCall.status;
        console.log(`[CALL START TWILIO SUCCESS] Call SID: ${twilioCall.sid} status: ${twilioCall.status}`);
      } catch (err: any) {
        console.error('[CALL START TWILIO ERROR]:', err);
        return NextResponse.json({ error: err.message || 'Twilio call failed' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      call: callRecord,
      twilioCallSid,
      twilioCallStatus,
    });
  } catch (error: any) {
    console.error('[CALL START EXCEPTION]:', error);
    return NextResponse.json({ error: 'Unable to start call' }, { status: 500 });
  }
}
