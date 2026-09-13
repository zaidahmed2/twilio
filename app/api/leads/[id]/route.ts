import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getLeadById } from '@/lib/data/leads';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lead = await getLeadById(params.id, session.companyId);
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (session.role === 'AGENT') {
      const copy = { ...lead };
      delete copy.phone;
      return NextResponse.json({ lead: copy });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to retrieve lead details' }, { status: 500 });
  }
}
