import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { assignLeadToAgent, getAssignments, unassignLead } from '@/lib/data/assignments';

const assignmentSchema = z.object({
  contactId: z.string().min(1),
  agentId: z.string().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const assignments = await getAssignments(session.companyId);
  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = assignmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid assignment payload' }, { status: 400 });
    }

    const { contactId, agentId } = parsed.data;

    if (!agentId) {
      await unassignLead(contactId);
      return NextResponse.json({ success: true, message: 'Lead unassigned' });
    }

    const assignment = await assignLeadToAgent(contactId, agentId, session.companyId);
    if (!assignment) {
      return NextResponse.json({ error: 'Agent not found or assignment failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to assign lead' }, { status: 500 });
  }
}
