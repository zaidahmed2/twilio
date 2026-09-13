import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';

interface KeyCheckResult {
  name: string;
  value: string;
  valid: boolean;
  message: string;
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const ghlApiKey = (process.env.GHL_API_KEY || '').trim();
  const ghlLocationId = (process.env.GHL_LOCATION_ID || '').trim();

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioPhone = (process.env.TWILIO_PHONE_NUMBER || '').trim();
  const apiKey = (process.env.TWILIO_API_KEY || '').trim();
  const apiSecret = (process.env.TWILIO_API_SECRET || '').trim();
  const twimlAppSid = (process.env.TWILIO_TWIML_APP_SID || '').trim();
  const recordingEnabled = process.env.TWILIO_RECORD_CALLS === 'true';

  const maskValue = (str: string) => {
    if (!str) return 'NOT CONFIGURED';
    if (str.length <= 8) return '********';
    return `${str.slice(0, 6)}...${str.slice(-4)}`;
  };

  // 1. Live HighLevel (GHL) API Tests
  const ghlKeys: KeyCheckResult[] = [];
  let isGhlLiveValid = false;

  if (!ghlApiKey) {
    ghlKeys.push({
      name: 'GHL_API_KEY',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'API Key missing in .env.local',
    });
  }
  if (!ghlLocationId) {
    ghlKeys.push({
      name: 'GHL_LOCATION_ID',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'Location ID missing in .env.local',
    });
  }

  if (ghlApiKey && ghlLocationId) {
    try {
      const ghlRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${ghlApiKey}`,
            Version: '2021-07-28',
          },
        }
      );

      if (ghlRes.ok) {
        isGhlLiveValid = true;
        ghlKeys.push({
          name: 'GHL_API_KEY',
          value: maskValue(ghlApiKey),
          valid: true,
          message: 'Authenticated & Connected (Status 200 OK)',
        });
        ghlKeys.push({
          name: 'GHL_LOCATION_ID',
          value: maskValue(ghlLocationId),
          valid: true,
          message: 'Location ID verified & active',
        });
      } else {
        const errText = await ghlRes.text();
        ghlKeys.push({
          name: 'GHL_API_KEY',
          value: maskValue(ghlApiKey),
          valid: false,
          message: `Live Connection Failed (HTTP ${ghlRes.status}): ${errText.slice(0, 80)}`,
        });
        ghlKeys.push({
          name: 'GHL_LOCATION_ID',
          value: maskValue(ghlLocationId),
          valid: false,
          message: 'Location ID verification unconfirmed due to API auth error',
        });
      }
    } catch (err: any) {
      ghlKeys.push({
        name: 'GHL_API_KEY',
        value: maskValue(ghlApiKey),
        valid: false,
        message: `Network error connecting to GHL: ${err.message}`,
      });
    }
  }

  // 2. Live Twilio API Tests
  const twilioKeys: KeyCheckResult[] = [];
  let isAccountSidValid = false;
  let isAuthTokenValid = false;
  let isTwimlAppValid = false;

  // Test Account SID & Auth Token live
  if (!accountSid) {
    twilioKeys.push({
      name: 'TWILIO_ACCOUNT_SID',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'Account SID missing in .env.local',
    });
  }
  if (!authToken) {
    twilioKeys.push({
      name: 'TWILIO_AUTH_TOKEN',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'Auth Token missing in .env.local',
    });
  }

  if (accountSid && authToken) {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      const accRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        headers: { Authorization: authHeader },
      });

      if (accRes.ok) {
        const accData = await accRes.json();
        isAccountSidValid = true;
        isAuthTokenValid = true;
        twilioKeys.push({
          name: 'TWILIO_ACCOUNT_SID',
          value: maskValue(accountSid),
          valid: true,
          message: `Verified: Account "${accData.friendly_name}" (${accData.status})`,
        });
        twilioKeys.push({
          name: 'TWILIO_AUTH_TOKEN',
          value: maskValue(authToken),
          valid: true,
          message: 'Auth Token authenticated successfully',
        });
      } else {
        const errData = await accRes.json().catch(() => ({}));
        twilioKeys.push({
          name: 'TWILIO_ACCOUNT_SID',
          value: maskValue(accountSid),
          valid: false,
          message: `Live Check Failed (HTTP ${accRes.status}): ${errData.message || 'Invalid SID/Token'}`,
        });
        twilioKeys.push({
          name: 'TWILIO_AUTH_TOKEN',
          value: maskValue(authToken),
          valid: false,
          message: 'Authentication Failed: Auth token is invalid for this Account SID',
        });
      }
    } catch (err: any) {
      twilioKeys.push({
        name: 'TWILIO_ACCOUNT_SID',
        value: maskValue(accountSid),
        valid: false,
        message: `Network error connecting to Twilio REST API: ${err.message}`,
      });
    }
  }

  // Test TwiML App SID
  if (!twimlAppSid) {
    twilioKeys.push({
      name: 'TWILIO_TWIML_APP_SID',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'TwiML App SID missing in .env.local',
    });
  } else if (!twimlAppSid.startsWith('AP') || twimlAppSid.length !== 34) {
    twilioKeys.push({
      name: 'TWILIO_TWIML_APP_SID',
      value: maskValue(twimlAppSid),
      valid: false,
      message: `Invalid Format! Must be 34 chars starting with "AP...". Got: "${twimlAppSid.slice(0, 2)}" (${twimlAppSid.length} chars)`,
    });
  } else if (isAccountSidValid && isAuthTokenValid) {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      // Try AU1 first (Australia region), then fall back to US1
      let appRes = await fetch(
        `https://api.au1.twilio.com/2010-04-01/Accounts/${accountSid}/Applications/${twimlAppSid}.json`,
        { headers: { Authorization: authHeader } }
      );
      if (!appRes.ok) {
        appRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications/${twimlAppSid}.json`,
          { headers: { Authorization: authHeader } }
        );
      }
      if (appRes.ok) {
        const appData = await appRes.json();
        isTwimlAppValid = true;
        twilioKeys.push({
          name: 'TWILIO_TWIML_APP_SID',
          value: maskValue(twimlAppSid),
          valid: true,
          message: `Connected: TwiML App "${appData.friendly_name}" (Voice webhook configured)`,
        });
      } else {
        const errData = await appRes.json().catch(() => ({})) as any;
        // Trial accounts block Applications API — treat as configured if format is valid
        if (errData?.code === 20003 && errData?.message?.includes('Trial')) {
          isTwimlAppValid = true;
          twilioKeys.push({
            name: 'TWILIO_TWIML_APP_SID',
            value: maskValue(twimlAppSid),
            valid: true,
            message: 'Configured ✓ (Trial account — API verification restricted, verify via Twilio Console)',
          });
        } else {
          twilioKeys.push({
            name: 'TWILIO_TWIML_APP_SID',
            value: maskValue(twimlAppSid),
            valid: false,
            message: `Live Check Failed (HTTP ${appRes.status}): TwiML App not found in this account`,
          });
        }
      }
    } catch (err: any) {
      twilioKeys.push({
        name: 'TWILIO_TWIML_APP_SID',
        value: maskValue(twimlAppSid),
        valid: false,
        message: `TwiML App check error: ${err.message}`,
      });
    }
  } else {
    twilioKeys.push({
      name: 'TWILIO_TWIML_APP_SID',
      value: maskValue(twimlAppSid),
      valid: false,
      message: 'Cannot verify TwiML App because Account SID/Token authentication failed',
    });
  }

  // Test API Key & Secret
  if (!apiKey) {
    twilioKeys.push({
      name: 'TWILIO_API_KEY',
      value: 'OPTIONAL (Fallback to Account SID)',
      valid: true,
      message: 'Using Main Account SID fallback for WebRTC token',
    });
  } else if (!apiKey.startsWith('SK')) {
    twilioKeys.push({
      name: 'TWILIO_API_KEY',
      value: maskValue(apiKey),
      valid: false,
      message: 'Invalid Format! Twilio API Keys must start with "SK..."',
    });
  } else if (isAccountSidValid && isAuthTokenValid) {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      // Try AU1 first (Australia region), then fall back to US1
      let keyRes = await fetch(
        `https://api.au1.twilio.com/2010-04-01/Accounts/${accountSid}/Keys/${apiKey}.json`,
        { headers: { Authorization: authHeader } }
      );
      if (!keyRes.ok) {
        keyRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys/${apiKey}.json`,
          { headers: { Authorization: authHeader } }
        );
      }
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        twilioKeys.push({
          name: 'TWILIO_API_KEY',
          value: maskValue(apiKey),
          valid: true,
          message: `Verified: API Key "${keyData.friendly_name}" (AU1 Region)`,
        });
      } else {
        const errData = await keyRes.json().catch(() => ({})) as any;
        // Trial restriction — if format is valid SK key, treat as configured
        if (errData?.code === 20003 && errData?.message?.includes('Trial')) {
          twilioKeys.push({
            name: 'TWILIO_API_KEY',
            value: maskValue(apiKey),
            valid: true,
            message: 'Configured ✓ (Trial account — API verification restricted)',
          });
        } else {
          twilioKeys.push({
            name: 'TWILIO_API_KEY',
            value: maskValue(apiKey),
            valid: false,
            message: `Live Check Failed (HTTP ${keyRes.status}): API Key not found in AU1 or US1`,
          });
        }
      }
    } catch (err: any) {
      twilioKeys.push({
        name: 'TWILIO_API_KEY',
        value: maskValue(apiKey),
        valid: false,
        message: `API Key check error: ${err.message}`,
      });
    }
  }

  // Test Twilio Phone Number
  if (!twilioPhone) {
    twilioKeys.push({
      name: 'TWILIO_PHONE_NUMBER',
      value: 'NOT CONFIGURED',
      valid: false,
      message: 'Outbound Phone Number missing in .env.local',
    });
  } else {
    twilioKeys.push({
      name: 'TWILIO_PHONE_NUMBER',
      value: twilioPhone,
      valid: twilioPhone.startsWith('+'),
      message: twilioPhone.startsWith('+')
        ? 'Formatted as E.164 Outbound Caller ID'
        : 'Warning: Phone number should start with country code "+"',
    });
  }

  const isTwilioOverallValid = isAccountSidValid && isAuthTokenValid && isTwimlAppValid;

  return NextResponse.json({
    ghl: {
      overallConnected: isGhlLiveValid,
      statusText: isGhlLiveValid ? 'Live Connected' : 'Connection Failed',
      keys: ghlKeys,
    },
    twilio: {
      overallConnected: isTwilioOverallValid,
      statusText: isTwilioOverallValid ? 'Live Connected' : 'Configuration Issues',
      keys: twilioKeys,
    },
    recording: {
      enabled: recordingEnabled,
      statusText: recordingEnabled ? 'Enabled' : 'Disabled',
    },
  });
}
