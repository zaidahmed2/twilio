import fs from 'fs';

function getEnvVars() {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const env: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        env[key] = value;
      }
    }
  }
  return env;
}

async function testGHLFullFetch() {
  const env = getEnvVars();
  const apiKey = env.GHL_API_KEY;
  const locationId = env.GHL_LOCATION_ID;

  let allContacts: any[] = [];
  let currentUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=100`;
  let page = 0;

  while (currentUrl && page < 20) {
    page++;
    const res = await fetch(currentUrl, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: '2021-07-28',
      },
    });

    if (!res.ok) {
      console.error('Fetch error:', res.status, await res.text());
      break;
    }

    const data = await res.json();
    const batch = data.contacts || [];
    allContacts.push(...batch);

    console.log(`Page ${page}: Fetched ${batch.length} contacts (Total so far: ${allContacts.length})`);

    if (data.meta && data.meta.nextPageUrl) {
      currentUrl = data.meta.nextPageUrl;
    } else if (data.meta && data.meta.startAfter && data.meta.startAfterId) {
      currentUrl = `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=100&startAfter=${data.meta.startAfter}&startAfterId=${data.meta.startAfterId}`;
    } else {
      currentUrl = '';
    }

    if (batch.length < 100) {
      break;
    }
  }

  console.log(`🎉 COMPLETED FULL FETCH: ${allContacts.length} TOTAL CONTACTS FETCHED`);
}

testGHLFullFetch().catch(console.error);
