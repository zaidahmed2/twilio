'use client';

import React from 'react';
import { LogOut, User as UserIcon, Shield, PhoneCall } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: 'ADMIN' | 'AGENT';
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-xl">
          <PhoneCall className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-none">Twiolo Voice</h1>
          <p className="text-xs text-slate-500 mt-1">HighLevel Call Security Gateway</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">{user.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider ${
                    user.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Shield className="w-2.5 h-2.5" />
                  {user.role}
                </span>
                <span className="text-[11px] text-slate-400">• {user.email}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
