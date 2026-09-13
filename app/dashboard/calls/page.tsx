'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { CallRecord } from '@/lib/data/types';

export default function AdminCallsPage() {
  const [user, setUser] = useState<any>(null);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.authenticated) setUser(meData.user);

        const callsRes = await fetch('/api/calls');
        const callsData = await callsRes.json();
        if (callsData.calls) setCalls(callsData.calls);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="ADMIN" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h1 className="text-2xl font-extrabold text-slate-900">Organization Call History</h1>
            <p className="text-sm text-slate-500 mt-1">
              Audit log of all calls placed through the Twiolo secure voice proxy gateway.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading call records...</div>
            ) : calls.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No call records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Customer Name</th>
                      <th className="py-3.5 px-5">Agent</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Duration</th>
                      <th className="py-3.5 px-5">Outcome</th>
                      <th className="py-3.5 px-5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {calls.map((call) => (
                      <tr key={call.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{call.customerName}</td>
                        <td className="py-4 px-5 text-slate-700 font-semibold">{call.agentName}</td>
                        <td className="py-4 px-5 text-slate-600">{call.customerLocation}</td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              call.status === 'completed' || call.status === 'answered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {call.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-mono text-xs">{formatDuration(call.durationSeconds)}</td>
                        <td className="py-4 px-5">
                          {call.outcome ? (
                            <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded text-xs font-semibold">
                              {call.outcome}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-500 max-w-xs truncate">{call.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
