import { ghlFetch, isGHLConfigured } from './client';
import { getLeadById, setPrivatePhone } from '@/lib/data/leads';
import { SafeLead } from '@/lib/data/types';

export interface GHLContact {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  phone?: string;
  city?: string;
  state?: string;
  tags?: string[];
  assignedTo?: string;
  dateAdded?: string;
}

export interface GHLContactsResponse {
  contacts: GHLContact[];
  meta?: {
    total?: number;
    nextPageUrl?: string;
    startAfterId?: string;
    startAfter?: number;
  };
}

/**
 * Server-side Auto-Pagination: Fetches ALL contacts across all HighLevel API pages (all 1169+ contacts).
 * Stores phone numbers in the server-only PRIVATE_PHONE_STORE vault,
 * and attaches phone to SafeLead object (stripped dynamically for Agents in API router).
 */
export async function fetchGHLContactsSafe(): Promise<SafeLead[]> {
  if (!isGHLConfigured()) {
    return [];
  }

  const locationId = process.env.GHL_LOCATION_ID;
  let allContacts: GHLContact[] = [];
  let currentUrl = locationId
    ? `/contacts/?locationId=${locationId}&limit=100`
    : `/contacts/?limit=100`;

  let pageCount = 0;
  const maxPages = 40; // Safety limit supporting up to 4,000 contacts

  while (currentUrl && pageCount < maxPages) {
    pageCount++;
    const response = await ghlFetch<GHLContactsResponse>(currentUrl);

    if (!response.data || !Array.isArray(response.data.contacts) || response.data.contacts.length === 0) {
      break;
    }

    const batch = response.data.contacts;
    allContacts.push(...batch);

    const meta = response.data.meta;
    if (meta?.nextPageUrl) {
      // Relative path for ghlFetch
      const urlObj = new URL(meta.nextPageUrl);
      currentUrl = `${urlObj.pathname}${urlObj.search}`;
    } else if (meta?.startAfter && meta?.startAfterId) {
      currentUrl = `/contacts/?locationId=${locationId}&limit=100&startAfter=${meta.startAfter}&startAfterId=${meta.startAfterId}`;
    } else {
      currentUrl = '';
    }

    if (batch.length < 100) {
      break;
    }
  }

  return allContacts.map((c) => {
    // Store phone privately server-side
    if (c.phone) {
      setPrivatePhone(c.id, c.phone);
    }

    return {
      id: c.id,
      name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Contact',
      city: c.city || 'N/A',
      state: c.state || 'N/A',
      status: 'New',
      assignedAgentId: c.assignedTo || null,
      assignedAgentName: c.assignedTo ? 'Assigned Agent' : null,
      companyId: 'company_default',
      lastContact: null,
      createdAt: c.dateAdded || new Date().toISOString(),
      tags: c.tags || [],
      phone: c.phone || 'N/A',
    };
  });
}

/**
 * Privately retrieves contact from GHL API or local data vault.
 */
export async function getGHLContactSafe(contactId: string): Promise<SafeLead | null> {
  if (isGHLConfigured()) {
    const response = await ghlFetch<{ contact: GHLContact }>(`/contacts/${contactId}`);
    if (response.data && response.data.contact) {
      const c = response.data.contact;
      if (c.phone) {
        setPrivatePhone(c.id, c.phone);
      }
      return {
        id: c.id,
        name: c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unknown Contact',
        city: c.city || 'N/A',
        state: c.state || 'N/A',
        status: 'New',
        assignedAgentId: c.assignedTo || null,
        assignedAgentName: c.assignedTo ? 'Assigned Agent' : null,
        companyId: 'company_default',
        lastContact: null,
        createdAt: c.dateAdded || new Date().toISOString(),
        tags: c.tags || [],
        phone: c.phone || 'N/A',
      };
    }
  }

  return getLeadById(contactId);
}

/**
 * Log Call activity note to GHL Contact timeline
 */
export async function logGHLCallActivity(
  contactId: string,
  data: {
    durationSeconds: number;
    outcome?: string;
    notes?: string;
    agentName: string;
  }
): Promise<boolean> {
  if (!isGHLConfigured()) {
    return false;
  }

  const noteBody = `[Call Agent Dashboard] Call logged by ${data.agentName}. Duration: ${data.durationSeconds}s. Outcome: ${data.outcome || 'N/A'}. Notes: ${data.notes || 'None'}`;

  const response = await ghlFetch(`/contacts/${contactId}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body: noteBody }),
  });

  return Boolean(response.data);
}
