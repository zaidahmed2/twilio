'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import CallPanel from '@/components/calling/CallPanel';
import { Phone, Users, PhoneCall, CheckCircle, Clock, ShieldCheck, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeLead, CallRecord } from '@/lib/data/types';

export default function AgentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SafeLead[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>([]);
  const [activeCallTarget, setActiveCallTarget] = useState<SafeLead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.authenticated) setUser(meData.user);

      const leadsRes = await fetch('/api/leads');
      const leadsData = await leadsRes.json();
      if (leadsData.leads) setLeads(leadsData.leads);

      const callsRes = await fetch('/api/calls');
      const callsData = await callsRes.json();
      if (callsData.calls) setRecentCalls(callsData.calls);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRecords = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  const connectedCallsCount = recentCalls.filter((c) => c.status === 'completed' || c.status === 'answered').length;
  const interestedLeadsCount = leads.filter((l) => l.status === 'Interested').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="AGENT" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Agent Calling Portal</h1>
              <p className="text-sm text-slate-500 mt-1">Select an assigned lead to initiate browser voice calling.</p>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Phone Privacy Guard Active
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Total CRM Leads</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{leads.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Calls Today</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{recentCalls.length}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Connected Calls</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{connectedCallsCount}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-500">Interested Leads</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{interestedLeadsCount}</p>
            </div>
          </div>

          {/* Lead Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">CRM Call Leads</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
                    {totalRecords} Leads
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Click Call Customer to start a secure phone conversation.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search customer or city..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Interested">Interested</option>
                  <option value="Callback">Callback</option>
                </select>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                >
                  <option value={10}>10 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading leads...</div>
            ) : paginatedLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No matching leads found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Customer Name</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Lead Status</th>
                      <th className="py-3.5 px-5">Tags</th>
                      <th className="py-3.5 px-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{lead.name}</td>
                        <td className="py-4 px-5 text-slate-600">
                          {lead.city}, {lead.state}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              lead.status === 'Interested'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lead.status === 'Callback'
                                ? 'bg-amber-100 text-amber-800'
                                : lead.status === 'New'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-wrap gap-1">
                            {lead.tags?.map((tag) => (
                              <span key={tag} className="bg-slate-100 text-slate-600 text-[11px] px-2 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => setActiveCallTarget(lead)}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm shadow-blue-500/20 transition active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Customer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 px-5">
                <div>
                  Showing <span className="font-bold text-slate-900">{startIndex + 1}</span>–
                  <span className="font-bold text-slate-900">{Math.min(startIndex + pageSize, totalRecords)}</span> of{' '}
                  <span className="font-bold text-slate-900">{totalRecords}</span> leads (Page {currentPage} of {totalPages})
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {activeCallTarget && (
        <CallPanel
          contactId={activeCallTarget.id}
          customerName={activeCallTarget.name}
          customerLocation={`${activeCallTarget.city}, ${activeCallTarget.state}`}
          onClose={() => setActiveCallTarget(null)}
          onOutcomeSaved={fetchData}
        />
      )}
    </div>
  );
}
