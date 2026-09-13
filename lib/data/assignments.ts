import { Assignment } from './types';
import { updateLeadAssignment } from './leads';
import { getUserById } from './users';

let assignmentsStore: Assignment[] = [
  { id: 'asgn_1', contactId: 'ghl_contact_101', agentId: 'agent_1', companyId: 'company_default', assignedAt: '2026-09-10T10:00:00Z' },
  { id: 'asgn_2', contactId: 'ghl_contact_102', agentId: 'agent_1', companyId: 'company_default', assignedAt: '2026-09-08T09:15:00Z' },
  { id: 'asgn_3', contactId: 'ghl_contact_103', agentId: 'agent_1', companyId: 'company_default', assignedAt: '2026-09-09T11:45:00Z' },
  { id: 'asgn_4', contactId: 'ghl_contact_104', agentId: 'agent_2', companyId: 'company_default', assignedAt: '2026-09-11T08:20:00Z' },
];

export async function getAssignments(companyId: string = 'company_default'): Promise<Assignment[]> {
  return assignmentsStore.filter((a) => a.companyId === companyId);
}

export async function assignLeadToAgent(
  contactId: string,
  agentId: string,
  companyId: string = 'company_default'
): Promise<Assignment | null> {
  const agent = await getUserById(agentId);
  if (!agent) return null;

  // Remove existing assignment if any
  assignmentsStore = assignmentsStore.filter((a) => a.contactId !== contactId);

  const newAssignment: Assignment = {
    id: `asgn_${Date.now()}`,
    contactId,
    agentId,
    companyId,
    assignedAt: new Date().toISOString(),
  };

  assignmentsStore.push(newAssignment);
  await updateLeadAssignment(contactId, agentId, agent.name);
  return newAssignment;
}

export async function unassignLead(contactId: string): Promise<boolean> {
  const initialLength = assignmentsStore.length;
  assignmentsStore = assignmentsStore.filter((a) => a.contactId !== contactId);
  await updateLeadAssignment(contactId, null, null);
  return assignmentsStore.length < initialLength;
}

export async function isLeadAssignedToAgent(contactId: string, agentId: string): Promise<boolean> {
  return assignmentsStore.some((a) => a.contactId === contactId && a.agentId === agentId);
}
