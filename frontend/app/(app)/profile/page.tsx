'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Archive, FileText, Bell, Info, ChevronRight, LogOut } from 'lucide-react';
import gsap from 'gsap';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';
import { toast } from '@/components/ui/Toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.profile-el', { opacity: 0, y: 16, stagger: 0.07, duration: 0.4, ease: 'power2.out' });
    });
    return () => ctx.revert();
  }, []);

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const menuItems = [
    { href: '/my-items',      icon: Archive,   label: 'My Items' },
    { href: '/claims',        icon: FileText,  label: 'My Claims' },
    { href: '/notifications', icon: Bell,      label: 'Notifications' },
  ];

  return (
    <div className="px-4 pt-5 pb-8">
      <h1 className="profile-el text-2xl font-extrabold text-[#111827] mb-6">Profile</h1>

      {/* Avatar */}
      <div className="profile-el flex flex-col items-center mb-7">
        <div className="w-20 h-20 rounded-full bg-[#F97316] border-4 border-[#FDBA74] flex items-center justify-center text-white text-2xl font-extrabold mb-3 shadow-md">
          {getInitials(user.fullName)}
        </div>
        <p className="text-lg font-extrabold text-[#111827]">{user.fullName}</p>
        <p className="text-sm text-gray-500 font-medium">Student ID: {user.matricNumber}</p>
        {user.role === 'ADMIN' && (
          <span className="mt-1.5 text-xs font-bold text-[#F97316] bg-[#FFF7ED] px-2.5 py-0.5 rounded-full">Admin</span>
        )}
      </div>

      {/* Info cards */}
      <div className="profile-el flex flex-col gap-2 mb-6">
        {[
          { label: 'CAMPUS EMAIL', value: user.email },
          { label: 'PHONE NUMBER', value: user.phoneNumber },
          { label: 'MEMBER SINCE', value: memberSince },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-[#111827]">{value}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="profile-el flex flex-col gap-2 mb-6">
        {menuItems.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href}
            className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 flex items-center gap-3 hover:shadow-sm transition-shadow">
            <Icon size={18} className="text-[#F97316]" />
            <span className="text-sm font-semibold text-[#111827] flex-1">{label}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
        <button
          onClick={() => toast('About ReFound: Campus Lost & Found Platform v1.0.2', 'info')}
          className="bg-white rounded-2xl px-4 py-3.5 border border-gray-100 flex items-center gap-3 hover:shadow-sm transition-shadow text-left w-full"
        >
          <Info size={18} className="text-[#F97316]" />
          <span className="text-sm font-semibold text-[#111827] flex-1">About ReFound</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* Sign out */}
      <div className="profile-el">
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={logout}
        >
          <LogOut size={16} />
          Sign Out
        </Button>
      </div>

      {user.role === 'ADMIN' && (
        <div className="profile-el mt-3">
          <Link href="/admin">
            <Button fullWidth size="lg" variant="secondary">
              Go to Admin Panel
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
