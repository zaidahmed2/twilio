'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Phone,
  UserCheck,
  Settings,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'AGENT';
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();

  const adminLinks = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Leads CRM', href: '/dashboard/leads', icon: Users },
    { label: 'Agents', href: '/dashboard/agents', icon: UserCheck },
    { label: 'Call Records', href: '/dashboard/calls', icon: Phone },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const agentLinks = [
    { label: 'My Dashboard', href: '/agent', icon: LayoutDashboard },
    { label: 'Assigned Leads', href: '/agent/leads', icon: Users },
    { label: 'My Calls', href: '/agent/calls', icon: Phone },
  ];

  const links = role === 'ADMIN' ? adminLinks : agentLinks;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4 shrink-0">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Navigation Menu
          </p>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
        <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Zero-Phone Exposure Active
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Customer numbers remain server-side and are masked from client payloads.
        </p>
      </div>
    </aside>
  );
}
