import { SafeLead } from './types';
import { isGHLConfigured } from '@/lib/integrations/ghl/client';
import { fetchGHLContactsSafe } from '@/lib/integrations/ghl/contacts';

// Mock initial leads safe for server consumption
const INITIAL_LEADS: SafeLead[] = [
  {
    id: 'ghl_contact_101',
    name: 'John Smith',
    city: 'Melbourne',
    state: 'VIC',
    status: 'New',
    assignedAgentId: 'agent_1',
    assignedAgentName: 'Call Agent 01',
    companyId: 'company_default',
    lastContact: null,
    createdAt: '2026-09-10T10:00:00Z',
    tags: ['Solar', 'Inbound Lead'],
    phone: '+61412345678',
  },
  {
    id: 'ghl_contact_102',
    name: 'Emma Watson',
    city: 'Sydney',
    state: 'NSW',
    status: 'Interested',
    assignedAgentId: 'agent_1',
    assignedAgentName: 'Call Agent 01',
    companyId: 'company_default',
    lastContact: '2026-09-11T14:30:00Z',
    createdAt: '2026-09-08T09:15:00Z',
    tags: ['HVAC', 'VIP'],
    phone: '+61498765432',
  },
  {
    id: 'ghl_contact_103',
    name: 'Robert Downey Jr.',
    city: 'Brisbane',
    state: 'QLD',
    status: 'Callback',
    assignedAgentId: 'agent_1',
    assignedAgentName: 'Call Agent 01',
    companyId: 'company_default',
    lastContact: '2026-09-11T16:00:00Z',
    createdAt: '2026-09-09T11:45:00Z',
    tags: ['Roofing'],
    phone: '+61455512345',
  },
  {
    id: 'ghl_contact_104',
    name: 'Sophia Martinez',
    city: 'Perth',
    state: 'WA',
    status: 'New',
    assignedAgentId: 'agent_2',
    assignedAgentName: 'Sarah Connor',
    companyId: 'company_default',
    lastContact: null,
    createdAt: '2026-09-11T08:20:00Z',
    tags: ['Enterprise'],
    phone: '+61477788899',
  },
  {
    id: 'ghl_contact_105',
    name: 'Michael Brown',
    city: 'Adelaide',
    state: 'SA',
    status: 'Contacted',
    assignedAgentId: null,
    assignedAgentName: null,
    companyId: 'company_default',
    lastContact: '2026-09-05T12:00:00Z',
    createdAt: '2026-09-01T15:30:00Z',
    tags: ['Unassigned'],
    phone: '+61433322211',
  },
];

// SERVER-ONLY Private Phone Vault
const PRIVATE_PHONE_STORE = new Map<string, string>([
  ['ghl_contact_101', '+61412345678'],
  ['ghl_contact_102', '+61498765432'],
  ['ghl_contact_103', '+61455512345'],
  ['ghl_contact_104', '+61477788899'],
  ['ghl_contact_105', '+61433322211'],
]);

let leadsStore: SafeLead[] = [...INITIAL_LEADS];

// Public safe lead retrieval
export async function getLeads(companyId: string = 'company_default'): Promise<SafeLead[]> {
  if (isGHLConfigured()) {
    const realGHLLeads = await fetchGHLContactsSafe();
    if (realGHLLeads.length > 0) {
      return realGHLLeads;
    }
  }
  return leadsStore.filter((l) => l.companyId === companyId);
}

// Single-Agent / Open Lead access: Agent has access to all leads by default
export async function getLeadsForAgent(agentId: string, companyId: string = 'company_default'): Promise<SafeLead[]> {
  const allLeads = await getLeads(companyId);
  return allLeads; // Return all CRM leads to active call agent
}

export async function getLeadById(contactId: string, companyId: string = 'company_default'): Promise<SafeLead | null> {
  const allLeads = await getLeads(companyId);
  const lead = allLeads.find((l) => l.id === contactId);
  return lead ? { ...lead } : null;
}

export async function updateLeadAssignment(
  contactId: string,
  agentId: string | null,
  agentName: string | null
): Promise<SafeLead | null> {
  const lead = leadsStore.find((l) => l.id === contactId);
  if (!lead) return null;
  lead.assignedAgentId = agentId;
  lead.assignedAgentName = agentName;
  return { ...lead };
}

export async function updateLeadStatus(contactId: string, status: SafeLead['status']): Promise<SafeLead | null> {
  const lead = leadsStore.find((l) => l.id === contactId);
  if (!lead) return null;
  lead.status = status;
  lead.lastContact = new Date().toISOString();
  return { ...lead };
}

/**
 * SERVER-ONLY FUNCTION: Phone Privacy Core Boundary
 * Resolves E.164 phone number strictly on server for Twilio call execution.
 * Must NEVER be imported or invoked in client-side component or exposed via public API to AGENT!
 */
export async function getPrivatePhoneForCall(
  contactId: string,
  requesterId: string,
  requesterRole: 'ADMIN' | 'AGENT',
  companyId: string = 'company_default'
): Promise<string | null> {
  const lead = await getLeadById(contactId, companyId);
  if (!lead) {
    return null;
  }

  // Fetch private phone from vault or lead record
  const privatePhone = PRIVATE_PHONE_STORE.get(contactId) || lead.phone;
  if (!privatePhone) {
    return null;
  }

  // Format to E.164
  return privatePhone.startsWith('+') ? privatePhone : `+${privatePhone.replace(/\D/g, '')}`;
}

export function setPrivatePhone(contactId: string, phone: string): void {
  PRIVATE_PHONE_STORE.set(contactId, phone);
}
