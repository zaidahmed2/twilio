import fs from 'fs';
import path from 'path';

function loadEnvRaw() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return env;
}

async function check() {
  const env = loadEnvRaw();
  const accountSid = env['TWILIO_ACCOUNT_SID'];
  const authToken = env['TWILIO_AUTH_TOKEN'];
  const twimlAppSid = env['TWILIO_TWIML_APP_SID'];
  const apiKey = env['TWILIO_API_KEY'];
  const apiSecret = env['TWILIO_API_SECRET'];
  const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  console.log('\n==================================================');
  console.log('✅ CURRENT .ENV.LOCAL CREDENTIALS STATUS');
  console.log('==================================================');
  console.log(`Account SID  : ${accountSid}`);
  console.log(`Auth Token   : ${authToken.slice(0,6)}...${authToken.slice(-4)}`);
  console.log(`TwiML App SID: ${twimlAppSid}`);
  console.log(`API Key      : ${apiKey}`);

  // Test Account
  console.log('\n--- TWILIO_ACCOUNT_SID + AUTH_TOKEN ---');
  const r1 = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, { headers: { Authorization: auth } });
  if (r1.ok) {
    const d = await r1.json();
    console.log(`✅ Account: "${d.friendly_name}" (${d.status})`);
  } else {
    console.log(`❌ HTTP ${r1.status}: ${await r1.text()}`);
  }

  // Test TwiML App on US1
  console.log('\n--- TWILIO_TWIML_APP_SID (US1) ---');
  const r2 = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications/${twimlAppSid}.json`, { headers: { Authorization: auth } });
  if (r2.ok) {
    const d = await r2.json();
    console.log(`✅ TwiML App Found: "${d.friendly_name}"`);
    console.log(`   Voice URL: ${d.voice_url || 'NOT SET'}`);
  } else {
    console.log(`❌ HTTP ${r2.status}: ${await r2.text()}`);
  }

  // Test TwiML App on AU1
  console.log('\n--- TWILIO_TWIML_APP_SID (AU1) ---');
  const r3 = await fetch(`https://api.au1.twilio.com/2010-04-01/Accounts/${accountSid}/Applications/${twimlAppSid}.json`, { headers: { Authorization: auth } });
  if (r3.ok) {
    const d = await r3.json();
    console.log(`✅ TwiML App Found on AU1: "${d.friendly_name}"`);
    console.log(`   Voice URL: ${d.voice_url || 'NOT SET'}`);
  } else {
    console.log(`❌ AU1 HTTP ${r3.status}: ${await r3.text()}`);
  }

  // Test API Key on US1
  console.log('\n--- TWILIO_API_KEY (US1) ---');
  const r4 = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Keys/${apiKey}.json`, { headers: { Authorization: auth } });
  if (r4.ok) {
    const d = await r4.json();
    console.log(`✅ API Key Found: "${d.friendly_name}"`);
  } else {
    console.log(`❌ HTTP ${r4.status}: ${await r4.text()}`);
  }

  // Test API Key on AU1
  console.log('\n--- TWILIO_API_KEY (AU1) ---');
  const r5 = await fetch(`https://api.au1.twilio.com/2010-04-01/Accounts/${accountSid}/Keys/${apiKey}.json`, { headers: { Authorization: auth } });
  if (r5.ok) {
    const d = await r5.json();
    console.log(`✅ API Key Found on AU1: "${d.friendly_name}"`);
  } else {
    console.log(`❌ AU1 HTTP ${r5.status}: ${await r5.text()}`);
  }

  // List ALL TwiML Apps in account
  console.log('\n--- ALL TWIML APPS IN ACCOUNT ---');
  const r6 = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Applications.json`, { headers: { Authorization: auth } });
  if (r6.ok) {
    const d = await r6.json();
    if (d.applications?.length === 0) {
      console.log('⚠️  NO TwiML Apps found in this account at all!');
    } else {
      d.applications?.forEach((app: any) => {
        console.log(`   SID: ${app.sid} | Name: "${app.friendly_name}" | VoiceURL: ${app.voice_url || 'NONE'}`);
      });
    }
  } else {
    console.log(`❌ HTTP ${r6.status}: ${await r6.text()}`);
  }

  console.log('\n==================================================\n');
}

check().catch(console.error);
