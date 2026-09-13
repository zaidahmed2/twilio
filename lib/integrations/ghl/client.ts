/**
 * HighLevel (GHL) API Integration Service (Server-Side Only)
 * HighLevel official API v2 endpoint integration wrapper.
 */

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com';

export function isGHLConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

export async function ghlFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: string | null }> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    return { data: null, error: 'GHL API Key is missing in environment variables.' };
  }

  const url = `${GHL_API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    Version: '2021-07-28',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorText = await res.text();
      return { data: null, error: `GHL API error (${res.status}): ${errorText}` };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to communicate with HighLevel API' };
  }
}
