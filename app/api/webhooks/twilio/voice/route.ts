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

    // 1. Direct phone parameter from WebRTC client
    let targetPhone = (formData.get('targetPhone') || formData.get('phone') || formData.get('phoneNumber')) as string;

    // 2. If contactId itself is a phone number (e.g. +61...)
    if (!targetPhone && contactId && (contactId.startsWith('+') || /^\d{7,15}$/.test(contactId.replace(/\D/g, '')))) {
      targetPhone = contactId;
    }

    // 3. Resolve from vault or GHL cache
    if (!targetPhone && contactId) {
      targetPhone = (await getPrivatePhoneForCall(contactId, 'system', 'ADMIN')) || '';
      if (!targetPhone) {
        const lead = await getLeadById(contactId);
        if (lead && lead.phone && lead.phone !== 'N/A') {
          targetPhone = lead.phone;
        }
      }
    }

    // 4. Fallback for testing / trial account to verified number
    if (!targetPhone || targetPhone === 'N/A') {
      targetPhone = '+61451236270';
    }

    // Format phone to E.164
    const formattedPhone = targetPhone.startsWith('+') ? targetPhone : `+${targetPhone.replace(/\D/g, '')}`;

    console.log(`[TWILIO VOICE] Connecting WebRTC call for contact ${contactId} to phone ${formattedPhone}`);

    // Determine Caller ID (Twilio trial number)
    const callerId = '+17372212163';

    // Dial out cleanly through Twilio Voice Infrastructure
    const dial = voiceResponse.dial({ callerId });
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
