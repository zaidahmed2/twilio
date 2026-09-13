import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionFromRequest } from '@/lib/auth/session';
import { createAgent, getAllAgents } from '@/lib/data/users';

const createAgentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const agents = await getAllAgents(session.companyId);
  return NextResponse.json({ agents });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = createAgentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid name or email' }, { status: 400 });
    }

    const newAgent = await createAgent({
      name: parsed.data.name,
      email: parsed.data.email,
      companyId: session.companyId,
      status: 'active',
    });

    return NextResponse.json({ success: true, agent: newAgent });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
