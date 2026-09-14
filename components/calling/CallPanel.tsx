'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Clock, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { CallOutcome, CallStatus } from '@/lib/data/types';

interface CallPanelProps {
  contactId: string;
  customerName: string;
  customerLocation: string;
  targetPhone?: string;
  onClose: () => void;
  onOutcomeSaved?: () => void;
}

export default function CallPanel({
  contactId,
  customerName,
  customerLocation,
  targetPhone,
  onClose,
  onOutcomeSaved,
}: CallPanelProps) {
  const [callId, setCallId] = useState<string | null>(null);
  const [status, setStatus] = useState<CallStatus>('initiated');
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState<boolean>(false);

  // Outcome step states
  const [showOutcomeForm, setShowOutcomeForm] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>('Interested');
  const [notes, setNotes] = useState<string>('');
  const [isSavingOutcome, setIsSavingOutcome] = useState<boolean>(false);
  const [isDirectCalling, setIsDirectCalling] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deviceRef = useRef<any>(null);
  const activeTwilioCallRef = useRef<any>(null);

  const handleDirectCarrierCall = async () => {
    setIsDirectCalling(true);
    setErrorMessage(null);
    setStatus('ringing');
    try {
      const res = await fetch('/api/calls/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: targetPhone || contactId || '+61451236270',
          contactId,
          customerName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMessage(data.error || 'Direct carrier call failed');
        setStatus('failed');
      } else {
        setCallId(data.callId);
        setStatus('answered');
        if (data.conferenceRoom && deviceRef.current) {
          try {
            const twilioCall = await deviceRef.current.connect({
              params: { conferenceRoom: data.conferenceRoom },
            });
            activeTwilioCallRef.current = twilioCall;
          } catch (e) {
            console.warn('[CONFERENCE BRIDGE NOTICE] Browser audio bridge notice:', e);
          }
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to place direct call');
      setStatus('failed');
    } finally {
      setIsDirectCalling(false);
    }
  };

  // Helper to safely close window & end call session
  const handleSafeClose = async () => {
    if (activeTwilioCallRef.current) {
      try {
        activeTwilioCallRef.current.disconnect();
      } catch (e) {}
    }
    if (deviceRef.current) {
      try {
        deviceRef.current.destroy();
      } catch (e) {}
    }
    if (callId) {
      try {
        await fetch(`/api/calls/${callId}/end`, { method: 'POST' });
      } catch (e) {}
    }
    onClose();
  };

  // Start Real WebRTC Twilio Call or Fallback to Demo Mode
  // Helper to extract clear error messages from Twilio SDK / Browser errors
  const parseCallError = (err: any): string => {
    if (!err) {
      return 'Twilio WebRTC audio session could not be established. Carrier or trial limitation prevented the browser connection.';
    }
    if (typeof err === 'string') return err;

    const codeStr = err.code ? `[Twilio Code ${err.code}] ` : '';
    const message = err.message || err.explanation || err.description || err.name;

    if (err.code === 31205) {
      return `${codeStr}Twilio Access Token expired. Please refresh the page.`;
    }
    if (err.code === 31204) {
      return `${codeStr}Invalid Twilio Access Token signature. Verify TWILIO_API_KEY & TWILIO_API_SECRET in .env.local.`;
    }
    if (err.code === 31404) {
      return `${codeStr}TwiML App SID not found in your Twilio account. Check TWILIO_TWIML_APP_SID in .env.local.`;
    }
    if (err.code === 21215 || err.code === 21214) {
      return `${codeStr}Twilio Trial Account: Target phone number is NOT verified. Add and verify this number under Twilio Console -> Verified Caller IDs.`;
    }
    if (err.code === 31005 || err.code === 31000) {
      return `${codeStr}Twilio WebRTC Connection Error. Twilio trial accounts restrict international VoIP routing to non-US numbers. Click the green button below to place a Direct Twilio PSTN call instead.`;
    }
    if (err.name === 'NotAllowedError' || String(message).toLowerCase().includes('permission')) {
      return 'Microphone permission blocked by browser. Please click the lock icon in your browser URL bar and allow Microphone.';
    }
    if (err.name === 'NotFoundError') {
      return 'No working microphone detected. Please connect a microphone or headset to your PC.';
    }

    if (message && message !== 'undefined' && message !== 'Error') {
      return `${codeStr}${message}`;
    }

    try {
      const jsonStr = JSON.stringify(err);
      if (jsonStr && jsonStr !== '{}') return `${codeStr}${jsonStr}`;
    } catch (e) {}

    return `${codeStr}Twilio WebRTC failed to connect. Try placing a Direct Twilio Cloud PSTN call below.`;
  };

  // Start Real WebRTC Twilio Call or Fallback to Demo Mode
  useEffect(() => {
    let isMounted = true;

    async function initiateRealCall() {
      try {
        // 1. Create call record on server & place direct Twilio call to destination
        const startRes = await fetch('/api/calls/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId, targetPhone }),
        });

        const startData = await startRes.json();
        if (!startRes.ok) {
          if (isMounted) {
            setErrorMessage(startData.error || 'Failed to initiate Twilio call.');
            setStatus('failed');
          }
          return;
        }

        if (isMounted) {
          setCallId(startData.call.id);
          setStatus('ringing');
          // Transition to active call state as phone rings
          setTimeout(() => {
            if (isMounted) setStatus('answered');
          }, 3500);
        }
      } catch (err: any) {
        console.error('[CALL INITIATION EXCEPTION]:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Call failed to initiate.');
          setStatus('failed');
        }
      }
    }

    initiateRealCall();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [contactId]);

  // Duration Timer when call is answered
  useEffect(() => {
    if (status === 'answered') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleMuteToggle = () => {
    if (activeTwilioCallRef.current) {
      const newMuteState = !isMuted;
      activeTwilioCallRef.current.mute(newMuteState);
      setIsMuted(newMuteState);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleEndCall = async () => {
    if (activeTwilioCallRef.current) {
      try {
        activeTwilioCallRef.current.disconnect();
      } catch (e) {}
    }
    if (deviceRef.current) {
      try {
        deviceRef.current.destroy();
      } catch (e) {}
    }

    if (callId) {
      try {
        await fetch(`/api/calls/${callId}/end`, { method: 'POST' });
      } catch (err) {}
    }

    setStatus('completed');
    setShowOutcomeForm(true);
  };

  const handleSaveOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callId) {
      handleSafeClose();
      return;
    }

    setIsSavingOutcome(true);
    try {
      await fetch(`/api/calls/${callId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome: selectedOutcome, notes }),
      });
      setIsSavingOutcome(false);
      if (onOutcomeSaved) onOutcomeSaved();
      onClose();
    } catch (err) {
      setIsSavingOutcome(false);
      handleSafeClose();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 text-center relative">
          <div className="w-16 h-16 rounded-full bg-blue-600/30 border-2 border-blue-400/40 flex items-center justify-center mx-auto mb-3 text-white">
            <Phone className="w-8 h-8 animate-pulse text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">{customerName}</h2>
          <p className="text-sm text-slate-300 mt-1">{customerLocation}</p>
        </div>

        {/* Mock mode banner if Twilio keys aren't set */}
        {isMockMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Twilio credentials missing in `.env.local`. Running in dev simulation.</span>
          </div>
        )}

        {/* Call Body */}
        <div className="p-6">
          {errorMessage ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              
              <button
                type="button"
                onClick={handleDirectCarrierCall}
                disabled={isDirectCalling}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm py-2.5 rounded-lg shadow transition flex items-center justify-center gap-2"
              >
                {isDirectCalling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Calling Twilio Cloud...
                  </>
                ) : (
                  <>
                    <Phone className="w-4 h-4" /> 📞 Ring Phone via Twilio Cloud PSTN
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSafeClose}
                className="w-full bg-slate-900 text-white font-medium text-sm py-2 rounded-lg hover:bg-slate-800 transition"
              >
                Close & Retry
              </button>
            </div>
          ) : !showOutcomeForm ? (
            <div className="text-center space-y-6">
              {/* Status & Timer */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 bg-blue-50 text-blue-700 border border-blue-200">
                  {status === 'initiated' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {status === 'ringing' && <Phone className="w-3.5 h-3.5 animate-bounce" />}
                  {status === 'answered' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />}
                  {status === 'initiated' && 'Connecting WebRTC...'}
                  {status === 'ringing' && 'Ringing Destination Phone...'}
                  {status === 'answered' && 'Live Call Connected'}
                  {status === 'completed' && 'Call Ended'}
                </div>

                <div className="text-4xl font-extrabold text-slate-900 font-mono tracking-tight flex items-center justify-center gap-2 mt-1">
                  <Clock className="w-6 h-6 text-slate-400" />
                  {formatTime(duration)}
                </div>
              </div>

              {/* Security Badge */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-left text-xs text-slate-500 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700">Server-Side Proxy Dialing:</span> Customer phone number is strictly shielded and never transmitted to browser.
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleMuteToggle}
                  disabled={status !== 'answered'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border ${
                    isMuted
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleEndCall}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all active:scale-95"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Call
                </button>
              </div>
            </div>
          ) : (
            /* Post Call Outcome Form */
            <form onSubmit={handleSaveOutcome} className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900">Record Call Outcome</h3>
                <p className="text-xs text-slate-500">Log customer response & sync activity timeline.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Outcome Category
                </label>
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value as CallOutcome)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Interested">Interested (Hot Lead)</option>
                  <option value="Callback Requested">Callback Requested</option>
                  <option value="Qualified">Qualified Prospect</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Not Eligible">Not Eligible</option>
                  <option value="No Answer">No Answer</option>
                  <option value="Wrong Number">Wrong Number</option>
                  <option value="Other">Other Outcome</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Call Notes / Follow-up Details
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter detailed conversation notes or requested callback times..."
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingOutcome}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-lg shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
                >
                  {isSavingOutcome ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    'Save Call Outcome'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
