import { User } from './types';

const INITIAL_USERS: User[] = [
  {
    id: 'admin_1',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    name: 'System Admin',
    role: 'ADMIN',
    companyId: 'company_default',
    status: 'active',
    callsToday: 12,
    connectedCalls: 9,
    interestedLeads: 4,
  },
  {
    id: 'agent_1',
    email: process.env.AGENT_EMAIL || 'agent@example.com',
    name: 'Call Agent 01',
    role: 'AGENT',
    companyId: 'company_default',
    status: 'active',
    assignedLeadsCount: 5,
    callsToday: 24,
    connectedCalls: 18,
    interestedLeads: 7,
  },
  {
    id: 'agent_2',
    email: 'agent2@example.com',
    name: 'Sarah Connor',
    role: 'AGENT',
    companyId: 'company_default',
    status: 'active',
    assignedLeadsCount: 3,
    callsToday: 15,
    connectedCalls: 11,
    interestedLeads: 3,
  },
];

let usersStore: User[] = [...INITIAL_USERS];

export async function getAllAgents(companyId: string = 'company_default'): Promise<User[]> {
  return usersStore.filter((u) => u.companyId === companyId && u.role === 'AGENT');
}

export async function getUserById(id: string): Promise<User | null> {
  return usersStore.find((u) => u.id === id) || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return usersStore.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function createAgent(
  data: Omit<User, 'id' | 'role' | 'callsToday' | 'connectedCalls' | 'interestedLeads'>
): Promise<User> {
  const newUser: User = {
    ...data,
    id: `agent_${Date.now()}`,
    role: 'AGENT',
    callsToday: 0,
    connectedCalls: 0,
    interestedLeads: 0,
    assignedLeadsCount: 0,
  };
  usersStore.push(newUser);
  return newUser;
}

export async function updateUserStatus(id: string, status: 'active' | 'disabled'): Promise<User | null> {
  const user = usersStore.find((u) => u.id === id);
  if (!user) return null;
  user.status = status;
  return user;
}
