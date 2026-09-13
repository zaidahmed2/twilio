import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

async function verifyCredentials() {
  const env = loadEnv();

  console.log('\n==================================================');
  console.log('🔍 LIVE CREDENTIAL & API AUTHENTICATION AUDIT');
  console.log('==================================================\n');

  // 1. HighLevel (GHL) Audit
  const ghlApiKey = env.GHL_API_KEY;
  const ghlLocationId = env.GHL_LOCATION_ID;

  console.log('--- 1. HighLevel (GHL) CRM Integration ---');
  if (!ghlApiKey || !ghlLocationId) {
    console.log('❌ GHL API Key or Location ID missing.');
  } else {
    try {
      const res = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}&limit=1`, {
        headers: {
          Authorization: `Bearer ${ghlApiKey}`,
          Version: '2021-07-28',
        },
      });
      if (res.ok) {
        console.log(`✅ [GHL SUCCESS] API Key & Location ID are VALID! (Status 200)`);
      } else {
        const errText = await res.text();
        console.log(`❌ [GHL ERROR] HTTP ${res.status}: ${errText}`);
      }
    } catch (e: any) {
      console.log(`❌ [GHL CONNECTION ERROR]: ${e.message}`);
    }
  }

  // 2. Twilio Account SID & Auth Token Audit
  const accountSid = env.TWILIO_ACCOUNT_SID;
  const authToken = env.TWILIO_AUTH_TOKEN;
  const twilioPhone = env.TWILIO_PHONE_NUMBER;
  const twimlAppSid = env.TWILIO_TWIML_APP_SID;
  const apiKey = env.TWILIO_API_KEY;
  const apiSecret = env.TWILIO_API_SECRET;

  console.log('\n--- 2. Twilio Main Account Authentication ---');
  if (!accountSid || !authToken) {
    console.log('❌ TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing.');
  } else {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const accData = await res.json();
        console.log(`✅ [TWILIO ACCOUNT SUCCESS] Account SID & Auth Token are VALID!`);
        console.log(`   Friendly Name: "${accData.friendly_name}"`);
        console.log(`   Account Status: ${accData.status} (Type: ${accData.type})`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.log(`❌ [TWILIO ACCOUNT ERROR] HTTP ${res.status}: ${errJson.message || 'Invalid SID or Token'}`);
      }
    } catch (e: any) {
      console.log(`❌ [TWILIO ACCOUNT ERROR]: ${e.message}`);
    }
  }

  // 3. Twilio TwiML App SID Audit
  console.log('\n--- 3. Twilio TwiML App SID Audit ---');
  if (!twimlAppSid) {
    console.log('❌ TWILIO_TWIML_APP_SID is missing.');
  } else if (!twimlAppSid.startsWith('AP')) {
    console.log(`❌ [CRITICAL ERROR] TWILIO_TWIML_APP_SID = "${twimlAppSid}"`);
    console.log(`   👉 REASON: A TwiML App SID MUST start with "AP..."!`);
    console.log(`   👉 YOU HAVE ENTERED: "${twimlAppSid}" (This is an Account SID starting with AC, NOT a TwiML App SID!).`);
    console.log(`   👉 HOW TO FIX: In Twilio Console -> Explore Products -> Voice -> TwiML Apps -> Create New TwiML App, and copy the SID starting with "AP...".`);
  } else {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications/${twimlAppSid}.json`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const appData = await res.json();
        console.log(`✅ [TWIML APP SUCCESS] TwiML App Found: "${appData.friendly_name}"`);
        console.log(`   Voice URL: ${appData.voice_url || 'NOT CONFIGURED'}`);
      } else {
        console.log(`❌ [TWIML APP ERROR] HTTP ${res.status}: TwiML App ${twimlAppSid} not found under account.`);
      }
    } catch (e: any) {
      console.log(`❌ [TWIML APP ERROR]: ${e.message}`);
    }
  }

  // 4. Twilio API Key & Secret Audit
  console.log('\n--- 4. Twilio API Key & Secret Audit ---');
  if (!apiKey || !apiSecret) {
    console.log('⚠️ TWILIO_API_KEY or TWILIO_API_SECRET missing.');
  } else if (!apiKey.startsWith('SK')) {
    console.log(`❌ [API KEY ERROR] TWILIO_API_KEY = "${apiKey}" does not start with "SK...".`);
  } else {
    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys/${apiKey}.json`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const keyData = await res.json();
        console.log(`✅ [API KEY SUCCESS] API Key "${keyData.friendly_name}" (${apiKey}) is VALID!`);
      } else {
        const errJson = await res.json().catch(() => ({}));
        console.log(`❌ [API KEY ERROR] HTTP ${res.status}: ${errJson.message || 'Key not found'}`);
      }
    } catch (e: any) {
      console.log(`❌ [API KEY ERROR]: ${e.message}`);
    }
  }

  console.log('\n==================================================\n');
}

verifyCredentials();
