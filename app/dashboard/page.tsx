'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Users, PhoneCall, CheckCircle2, Clock, ShieldCheck, UserCheck, Activity, ChevronRight } from 'lucide-react';
import { SafeLead, CallRecord, User } from '@/lib/data/types';
import Link from 'next/link';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SafeLead[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (meData.authenticated) setUser(meData.user);

        const leadsRes = await fetch('/api/leads');
        const leadsData = await leadsRes.json();
        if (leadsData.leads) setLeads(leadsData.leads);

        const callsRes = await fetch('/api/calls');
        const callsData = await callsRes.json();
        if (callsData.calls) setCalls(callsData.calls);

        const agentsRes = await fetch('/api/agents');
        const agentsData = await agentsRes.json();
        if (agentsData.agents) setAgents(agentsData.agents);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const connectedCallsCount = calls.filter((c) => c.status === 'completed' || c.status === 'answered').length;
  const interestedLeadsCount = leads.filter((l) => l.status === 'Interested').length;
  const totalDuration = calls.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
  const avgDurationSeconds = calls.length > 0 ? Math.floor(totalDuration / calls.length) : 0;

  const formatAvgTime = (secs: number) => {
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
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Admin Control Overview</h1>
              <p className="text-sm text-slate-500 mt-1">
                Monitor team calling performance, lead assignments, and HighLevel CRM security metrics.
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              <Activity className="w-4 h-4 text-blue-400" />
              View Integration Status
            </Link>
          </div>

          {/* Analytics Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Total Leads</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{leads.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Calls Logged</span>
              <p className="text-2xl font-extrabold text-indigo-600 mt-2">{calls.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Connected Rate</span>
              <p className="text-2xl font-extrabold text-emerald-600 mt-2">
                {calls.length > 0 ? Math.round((connectedCallsCount / calls.length) * 100) : 0}%
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Interested Leads</span>
              <p className="text-2xl font-extrabold text-purple-600 mt-2">{interestedLeadsCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Avg Duration</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-2">{formatAvgTime(avgDurationSeconds)}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-500">Active Agents</span>
              <p className="text-2xl font-extrabold text-blue-600 mt-2">{agents.length}</p>
            </div>
          </div>

          {/* Content Split: Lead Assignment & Recent Calls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Assigned CRM Leads</h2>
                <Link
                  href="/dashboard/leads"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Manage All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{lead.name}</p>
                      <p className="text-xs text-slate-500">
                        {lead.city}, {lead.state} • <span className="font-medium text-slate-700">Agent: {lead.assignedAgentName || 'Unassigned'}</span>
                      </p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Calls Log */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Recent Call Activity</h2>
                <Link
                  href="/dashboard/calls"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  View History <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {calls.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No call activity recorded yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {calls.slice(0, 5).map((call) => (
                    <div key={call.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{call.customerName}</p>
                        <p className="text-xs text-slate-500">
                          By {call.agentName} • {call.durationSeconds}s
                        </p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {call.outcome || call.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
