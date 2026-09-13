'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { UserCheck, UserPlus, Mail, Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { User } from '@/lib/data/types';

export default function AdminAgentsPage() {
  const [user, setUser] = useState<any>(null);
  const [agents, setAgents] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.authenticated) setUser(meData.user);

      const agentsRes = await fetch('/api/agents');
      const agentsData = await agentsRes.json();
      if (agentsData.agents) setAgents(agentsData.agents);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName, email: newAgentEmail }),
      });
      setNewAgentName('');
      setNewAgentEmail('');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />

      <div className="flex flex-1">
        <Sidebar role="ADMIN" />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Call Agent Management</h1>
              <p className="text-sm text-slate-500 mt-1">
                Configure authorized call agents and review performance metrics.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Add Temporary Agent
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500 text-sm">Loading agents...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500 tracking-wider">
                    <tr>
                      <th className="py-3.5 px-5">Agent Name</th>
                      <th className="py-3.5 px-5">Email Address</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Calls Logged</th>
                      <th className="py-3.5 px-5">Connected Calls</th>
                      <th className="py-3.5 px-5">Interested Leads</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {agents.map((ag) => (
                      <tr key={ag.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-4 px-5 font-bold text-slate-900">{ag.name}</td>
                        <td className="py-4 px-5 text-slate-600">{ag.email}</td>
                        <td className="py-4 px-5">
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                            {ag.status}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-800">{ag.callsToday || 0}</td>
                        <td className="py-4 px-5 font-bold text-emerald-600">{ag.connectedCalls || 0}</td>
                        <td className="py-4 px-5 font-bold text-purple-600">{ag.interestedLeads || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Agent Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Add Temporary Call Agent</h3>
            <p className="text-xs text-slate-500">
              Note: This prototype uses environment-based auth for live testing. Agent profiles added here represent temporary agent assignments.
            </p>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  placeholder="e.g. jane@example.com"
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-500/20"
                >
                  {isSubmitting ? 'Adding...' : 'Create Agent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
