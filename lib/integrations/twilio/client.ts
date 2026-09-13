import twilio from 'twilio';

export function isTwilioConfigured(): boolean {
  const sid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const appSid = (process.env.TWILIO_TWIML_APP_SID || '').trim();

  const isInvalid = (val: string) =>
    !val ||
    val.includes('your_') ||
    val.includes('dummy') ||
    val.includes('change_') ||
    val.includes('placeholder') ||
    val.length < 10;

  if (isInvalid(sid) || isInvalid(token) || isInvalid(appSid)) {
    return false;
  }

  return sid.startsWith('AC') && appSid.startsWith('AP');
}

export function generateTwilioVoiceToken(identity: string): string | null {
  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const apiKey = (process.env.TWILIO_API_KEY || '').trim() || accountSid;
  const apiSecret = (process.env.TWILIO_API_SECRET || '').trim() || authToken;
  const twimlAppSid = (process.env.TWILIO_TWIML_APP_SID || '').trim();

  if (!accountSid || !authToken || !twimlAppSid) {
    return null;
  }

  const { AccessToken } = twilio.jwt;
  const { VoiceGrant } = AccessToken;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false,
  });

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600,
  });

  token.addGrant(voiceGrant);
  return token.toJwt();
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string | null
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken || !signature) return true; // In dev mode without token, skip validation
  return twilio.validateRequest(authToken, signature, url, params);
}
