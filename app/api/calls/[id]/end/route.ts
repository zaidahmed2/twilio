import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth/session';
import { getCallById, updateCallStatus } from '@/lib/data/calls';
import { logAuditEvent } from '@/lib/data/audit';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const call = await getCallById(params.id);
    if (!call) {
      console.warn(`[CALL END WARNING] Call ${params.id} not found in store (possibly cleared on restart). Returning success.`);
      return NextResponse.json({ success: true, warning: 'Call not found' });
    }

    if (session.role === 'AGENT' && call.agentId !== session.id) {
      console.warn(`[CALL END FORBIDDEN] Agent ${session.id} attempted to end call ${params.id} belonging to ${call.agentId}`);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedCall = await updateCallStatus(params.id, 'completed');
    await logAuditEvent(session.id, session.role, 'CALL_ENDED', { callId: params.id });

    console.log(`[CALL END SUCCESS] Ended call ${params.id} for agent ${session.name} (Duration: ${updatedCall?.durationSeconds || 0}s)`);
    return NextResponse.json({ success: true, call: updatedCall });
  } catch (error: any) {
    console.error(`[CALL END ERROR] Failed to end call ${params.id}:`, error);
    return NextResponse.json({ error: 'Failed to end call' }, { status: 500 });
  }
}
