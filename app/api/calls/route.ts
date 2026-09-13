import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getCalls, getCallsForAgent } from '@/lib/data/calls';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const calls =
      session.role === 'ADMIN'
        ? await getCalls(session.companyId)
        : await getCallsForAgent(session.id, session.companyId);

    return NextResponse.json({ calls });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve call history' }, { status: 500 });
  }
}
