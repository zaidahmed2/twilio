import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { getPrivatePhoneForCall, getLeadById } from '@/lib/data/leads';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const contactId = (formData.get('contactId') || formData.get('ContactId') || formData.get('To')) as string;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '';

    const voiceResponse = new twilio.twiml.VoiceResponse();

    if (!contactId) {
      voiceResponse.say('Invalid request. No contact identifier provided.');
      voiceResponse.hangup();
      return new NextResponse(voiceResponse.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Server-side Private Phone Resolution from GHL CRM / Private Vault
    let targetPhone = await getPrivatePhoneForCall(contactId, 'system', 'ADMIN');
    if (!targetPhone) {
      const lead = await getLeadById(contactId);
      if (lead && lead.phone && lead.phone !== 'N/A') {
        targetPhone = lead.phone;
      }
    }

    if (!targetPhone || targetPhone === 'N/A') {
      console.warn(`[TWILIO VOICE] Call attempted for contact ${contactId} but no phone number exists in HighLevel CRM.`);
      voiceResponse.say('This contact does not have a phone number registered in HighLevel CRM.');
      voiceResponse.hangup();
      return new NextResponse(voiceResponse.toString(), {
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Format phone to E.164 if missing leading plus
    const formattedPhone = targetPhone.startsWith('+') ? targetPhone : `+${targetPhone.replace(/\D/g, '')}`;

    console.log(`[TWILIO VOICE] Connecting WebRTC call for contact ${contactId} to phone ${formattedPhone}`);

    // Determine Caller ID (must be Twilio number or Verified Caller ID)
    let callerId = (process.env.TWILIO_PHONE_NUMBER || '').trim();
    if (!callerId || callerId.includes('451236270')) {
      callerId = '+61422436270';
    }

    // Dial out through Twilio Voice Infrastructure
    const dial = voiceResponse.dial({
      callerId: callerId,
      record: process.env.TWILIO_RECORD_CALLS === 'true' ? 'record-from-answer' : 'do-not-record',
      action: '/api/webhooks/twilio/call-status',
    });

    dial.number(formattedPhone);

    return new NextResponse(voiceResponse.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error: any) {
    console.error('[TWILIO VOICE WEBHOOK ERROR]:', error);
    const voiceResponse = new twilio.twiml.VoiceResponse();
    voiceResponse.say('An error occurred while routing the call.');
    voiceResponse.hangup();
    return new NextResponse(voiceResponse.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}
