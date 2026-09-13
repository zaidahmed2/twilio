import { NextRequest, NextResponse } from 'next/server';
import { updateCallStatus } from '@/lib/data/calls';
import { CallStatus } from '@/lib/data/types';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callSid = formData.get('CallSid') as string;
    const rawStatus = (formData.get('CallStatus') as string)?.toLowerCase();
    const customCallId = formData.get('customCallId') as string;

    const statusMap: Record<string, CallStatus> = {
      initiated: 'initiated',
      ringing: 'ringing',
      'in-progress': 'answered',
      completed: 'completed',
      busy: 'busy',
      'no-answer': 'no-answer',
      failed: 'failed',
      canceled: 'canceled',
    };

    const status = statusMap[rawStatus] || 'completed';

    if (customCallId || callSid) {
      await updateCallStatus(customCallId || '', status, callSid);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
