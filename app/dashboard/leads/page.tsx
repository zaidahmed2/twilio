'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Search, Phone, CheckCircle2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { SafeLead } from '@/lib/data/types';

export default function AdminLeadsPage() {
  const [user, setUser] = useState<any>(null);
  const [leads, setLeads] = useState<SafeLead[]>([]);
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone && l.phone.includes(searchTerm));
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Logic
  const totalRecords = filteredLeads.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="ADMIN" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900">HighLevel Lead Management</h1>
                <span className="bg-blue-100 text-blue-800 text-xs font-extrabold px-3 py-1 rounded-full border border-blue-200">
                  Total Records: {leads.length}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Admin CRM contacts overview. Phone numbers are visible to Admin and strictly shielded from agents.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search lead, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
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
                  <option value="Qualified">Qualified</option>
                </select>
              </div>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 px-5 gap-2">
              <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Showing {totalRecords === 0 ? 0 : startIndex + 1} – {Math.min(startIndex + pageSize, totalRecords)} of {totalRecords} Filtered Leads ({leads.length} Loaded from GHL)
              </span>
              <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full">
                Admin Phone Access Active
              </span>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading CRM contacts from HighLevel...</div>
            ) : paginatedLeads.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">No matching HighLevel leads found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Customer Name</th>
                      <th className="py-3.5 px-5">Contact Phone (Admin Only)</th>
                      <th className="py-3.5 px-5">Location</th>
                      <th className="py-3.5 px-5">Lead Status</th>
                      <th className="py-3.5 px-5 text-right">CRM ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{lead.name}</td>
                        <td className="py-4 px-5 font-mono text-xs text-slate-900 font-bold">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200">
                            <Phone className="w-3 h-3 text-blue-600" />
                            {lead.phone || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600">
                          {lead.city}, {lead.state}
                        </td>
                        <td className="py-4 px-5">
                          <span className="bg-blue-50 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {lead.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right font-mono text-xs text-slate-400">
                          {lead.id}
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
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
                  <span className="font-bold text-slate-900">{totalPages}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
