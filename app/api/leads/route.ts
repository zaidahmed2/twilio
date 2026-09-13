import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getLeads, getLeadsForAgent } from '@/lib/data/leads';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawLeads =
      session.role === 'ADMIN'
        ? await getLeads(session.companyId)
        : await getLeadsForAgent(session.id, session.companyId);

    if (session.role === 'AGENT') {
      // STRICTLY SANITIZE & STRIP PHONE NUMBERS FOR AGENT PAYLOADS
      const agentLeads = rawLeads.map((lead) => {
        const copy = { ...lead };
        delete copy.phone;
        return copy;
      });
      return NextResponse.json({ leads: agentLeads });
    }

    // ADMIN RECEIVES FULL LEAD DATA INCLUDING PHONE NUMBERS
    return NextResponse.json({ leads: rawLeads });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve leads' }, { status: 500 });
  }
}
