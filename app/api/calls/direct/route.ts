import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createCallRecord, updateCallStatus } from '@/lib/data/calls';
import { logAuditEvent } from '@/lib/data/audit';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { toPhone, contactId, customerName } = body;

    const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
    const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
    const fromPhone = (process.env.TWILIO_PHONE_NUMBER || '+17372212163').trim();

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 });
    }

    // Default to verified paired trial recipient if not provided
    const target = toPhone || '+61451236270';
    const formattedTarget = target.startsWith('+') ? target : `+${target.replace(/\D/g, '')}`;

    const conferenceRoom = `room_${(contactId || 'direct').replace(/[^a-zA-Z0-9_]/g, '')}_${Date.now()}`;
    const confTwiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true" beep="false">${conferenceRoom}</Conference></Dial></Response>`;

    console.log(`[DIRECT TWILIO CALL] Initiating carrier call from ${fromPhone} to ${formattedTarget} for Agent ${session.name} (Conference: ${conferenceRoom})`);

    const client = twilio(accountSid, authToken);

    const twilioCall = await client.calls.create({
      from: fromPhone,
      to: formattedTarget,
      twiml: confTwiml,
    });

    console.log(`[DIRECT TWILIO CALL SUCCESS] Call SID: ${twilioCall.sid} | Status: ${twilioCall.status}`);

    const record = await createCallRecord({
      contactId: contactId || formattedTarget,
      customerName: customerName || `Direct Call (${formattedTarget})`,
      customerLocation: 'Australia',
      agentId: session.id,
      agentName: session.name,
      companyId: session.companyId,
    });

    await updateCallStatus(record.id, 'ringing', twilioCall.sid);

    await logAuditEvent(session.id, session.role, 'DIRECT_CALL_INITIATED', {
      callId: record.id,
      twilioSid: twilioCall.sid,
      to: formattedTarget,
    });

    return NextResponse.json({
      success: true,
      callSid: twilioCall.sid,
      status: twilioCall.status,
      callId: record.id,
      conferenceRoom,
    });
  } catch (error: any) {
    console.error('[DIRECT CALL ERROR]:', error);
    return NextResponse.json({
      error: error.message || 'Twilio call failed',
      code: error.code || null,
    }, { status: 500 });
  }
}
