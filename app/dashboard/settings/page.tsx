'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import {
  Settings,
  ShieldCheck,
  Database,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  KeyRound,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface KeyCheckResult {
  name: string;
  value: string;
  valid: boolean;
  message: string;
}

interface IntegrationStatus {
  ghl: {
    overallConnected: boolean;
    statusText: string;
    keys: KeyCheckResult[];
  };
  twilio: {
    overallConnected: boolean;
    statusText: string;
    keys: KeyCheckResult[];
  };
  recording: { enabled: boolean; statusText: string };
}

export default function AdminSettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchStatus() {
    try {
      const statusRes = await fetch('/api/settings/status');
      const statusData = await statusRes.json();
      if (statusRes.ok) setStatus(statusData);
    } catch (err) {
      console.error('Failed to fetch API status:', err);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.authenticated) setUser(meData.user);

        await fetchStatus();
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStatus();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="ADMIN" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <Settings className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-extrabold text-slate-900">API Credentials & Connection Audit</h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Real-time live connection tests for HighLevel CRM and Twilio Voice API keys.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow border border-slate-700 transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Testing Live Connections...' : 'Re-Test All API Keys'}
            </button>
          </div>

          {isLoading ? (
            <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="font-semibold text-slate-700">Performing live API handshake with HighLevel & Twilio...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* HighLevel CRM Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-md">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">HighLevel (GHL) CRM</h3>
                      <p className="text-xs text-purple-200">Contacts & Timeline Activity API v2</p>
                    </div>
                  </div>

                  {status?.ghl.overallConnected ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/40 px-3 py-1 rounded-full text-xs font-bold">
                      <XCircle className="w-3.5 h-3.5" /> Connection Error
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-purple-500" /> Individual Key Connection Breakdown
                  </div>

                  <div className="space-y-3">
                    {status?.ghl.keys.map((k) => (
                      <div
                        key={k.name}
                        className={`p-3.5 rounded-xl border transition ${
                          k.valid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-800">{k.name}</span>
                          {k.valid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Disconnected
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-xs text-slate-500 font-mono">
                          <span>Value: {k.value}</span>
                        </div>

                        <p className={`mt-2 text-xs font-medium flex items-center gap-1.5 ${k.valid ? 'text-emerald-800' : 'text-red-800'}`}>
                          {k.valid ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
                          {k.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Twilio Voice Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Twilio Programmable Voice</h3>
                      <p className="text-xs text-blue-200">WebRTC Browser Gateway & PSTN Trunk</p>
                    </div>
                  </div>

                  {status?.twilio.overallConnected ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" /> Issues Detected
                    </span>
                  )}
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-500" /> Key-By-Key Connection Breakdown
                  </div>

                  <div className="space-y-3">
                    {status?.twilio.keys.map((k) => (
                      <div
                        key={k.name}
                        className={`p-3.5 rounded-xl border transition ${
                          k.valid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-slate-800">{k.name}</span>
                          {k.valid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              <XCircle className="w-3 h-3" /> Invalid / Error
                            </span>
                          )}
                        </div>

                        <div className="mt-1 text-xs font-mono text-slate-500">
                          <span>Value: {k.value}</span>
                        </div>

                        <p className={`mt-2 text-xs font-medium flex items-start gap-1.5 ${k.valid ? 'text-emerald-800' : 'text-red-800 font-semibold'}`}>
                          {k.valid ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                          <span>{k.message}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Setup Help Instructions */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <HelpCircle className="w-5 h-5" />
              <span>How To Fix Disconnected Keys in .env.local:</span>
            </div>
            <ul className="text-xs space-y-2 text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-white">TWILIO_AUTH_TOKEN:</strong> Go to Twilio Console Dashboard and copy the Auth Token associated with Account SID <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded">ACb655...</code>.
              </li>
              <li>
                <strong className="text-white">TWILIO_TWIML_APP_SID:</strong> Create a TwiML App in Twilio Console under <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded">Voice -&gt; TwiML Apps</code> and copy the SID starting with <code className="bg-emerald-800 text-emerald-200 px-1 py-0.5 rounded">AP...</code>. (Do NOT use your Account SID starting with AC!).
              </li>
              <li>
                <strong className="text-white">TWILIO_API_KEY:</strong> Generate a new API Key in Twilio under <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded">Account -&gt; API Keys &amp; Tokens</code> starting with <code className="bg-emerald-800 text-emerald-200 px-1 py-0.5 rounded">SK...</code>.
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
}
