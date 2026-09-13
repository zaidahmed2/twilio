import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { generateTwilioVoiceToken, isTwilioConfigured } from '@/lib/integrations/twilio/client';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const phone = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const isConfigured = isTwilioConfigured();

  console.log('\n==================================================');
  console.log('📞 TWILIO WEBRTC TOKEN REQUEST LOG');
  console.log(`Agent/User: ${session.name} (${session.id})`);
  console.log(`Account SID: ${sid ? `${sid.slice(0, 6)}...` : 'NOT SET'}`);
  console.log(`Outbound Caller ID (Phone): ${phone || 'NOT SET (Default: Server Resolution)'}`);
  console.log(`Twilio Credential Status: ${isConfigured ? '✅ REAL / TRIAL TWILIO CREDS DETECTED' : '⚠️ UNCONFIGURED / MOCK MODE (Dev Testing)'}`);
  console.log('==================================================\n');

  if (!isConfigured) {
    console.warn(`[TWILIO TOKEN NOTICE] Real Twilio keys missing or invalid in .env.local. Returning Mock Mode token for UI testing.`);
    return NextResponse.json({
      token: 'DEV_MOCK_TWILIO_TOKEN',
      identity: session.id,
      mockMode: true,
      message: 'Twilio credentials not configured. Running in Dev Simulation Mode.',
    });
  }

  const token = generateTwilioVoiceToken(session.id);

  if (!token) {
    console.error(`[TWILIO TOKEN ERROR] Failed to generate Twilio Access Token for user ${session.id}`);
    return NextResponse.json({ error: 'Failed to generate Twilio Voice Access Token' }, { status: 500 });
  }

  console.log(`[TWILIO TOKEN SUCCESS] WebRTC Access Token generated successfully for user ${session.name}`);
  return NextResponse.json({ token, identity: session.id, mockMode: false });
}
