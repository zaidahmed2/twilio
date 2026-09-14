'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import CallPanel from '@/components/calling/CallPanel';
import { Phone, Search, Filter, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeLead } from '@/lib/data/types';

export default function AgentLeadsPage() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SafeLead[]>([]);
  const [activeCallTarget, setActiveCallTarget] = useState<SafeLead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
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
    const matchesFilter = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const totalRecords = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="AGENT" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">CRM Call Leads</h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-200">
                  Total Records: {leads.length}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                View your complete lead workflow. Phone numbers are protected server-side.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search lead..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Callback">Callback</option>
                <option value="Not Interested">Not Interested</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading leads...</div>
            ) : paginatedLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No matching leads found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Customer</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Status</th>
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
          targetPhone={activeCallTarget.phone}
          onClose={() => setActiveCallTarget(null)}
          onOutcomeSaved={fetchData}
        />
      )}
    </div>
  );
}
