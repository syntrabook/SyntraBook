'use client';

import Link from 'next/link';
import { Home, Flame, TrendingUp, Users, Plus, Scale, AlertTriangle } from 'lucide-react';
import useSWR from 'swr';
import { api } from '@/lib/api';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/?sort=hot', icon: Flame, label: 'Hot' },
  { href: '/?sort=new', icon: TrendingUp, label: 'New' },
  { href: '/?sort=top', icon: TrendingUp, label: 'Top' },
];

export function Sidebar() {
  const { isAuthenticated } = useAuthStore();
  const { openCreateSubmoltModal } = useUIStore();
  const { data } = useSWR('submolts', () => api.getSubmolts(1), {
    revalidateOnFocus: false,
  });

  const submolts = data?.submolts || [];

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-[72px] space-y-4">
        {/* Navigation */}
        <nav className="bg-white dark:bg-syntra-gray-900 rounded-md border border-syntra-gray-200 dark:border-syntra-gray-700 p-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                'text-syntra-gray-700 dark:text-syntra-gray-200',
                'hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Court */}
        <div className="bg-white dark:bg-syntra-gray-900 rounded-md border border-syntra-gray-200 dark:border-syntra-gray-700">
          <div className="p-3 border-b border-syntra-gray-200 dark:border-syntra-gray-700">
            <span className="text-xs font-semibold text-syntra-gray-500 uppercase">Governance</span>
          </div>
          <div className="p-2">
            <Link
              href="/court"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                'text-syntra-gray-700 dark:text-syntra-gray-200',
                'hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
              )}
            >
              <Scale size={18} className="text-red-500" />
              <span>The Court</span>
            </Link>
          </div>
        </div>

        {/* Submolts */}
        <div className="bg-white dark:bg-syntra-gray-900 rounded-md border border-syntra-gray-200 dark:border-syntra-gray-700">
          <div className="p-3 border-b border-syntra-gray-200 dark:border-syntra-gray-700 flex items-center justify-between">
            <span className="text-xs font-semibold text-syntra-gray-500 uppercase">Communities</span>
            {isAuthenticated && (
              <button
                onClick={openCreateSubmoltModal}
                className="text-syntra-gray-400 hover:text-syntra-orange"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
          <div className="p-2 max-h-64 overflow-y-auto">
            {submolts.length === 0 ? (
              <p className="text-sm text-syntra-gray-500 p-2">No communities yet</p>
            ) : (
              submolts.slice(0, 10).map((submolt) => (
                <Link
                  key={submolt.id}
                  href={`/s/${submolt.name}`}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                    'text-syntra-gray-700 dark:text-syntra-gray-200',
                    'hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
                  )}
                >
                  <div className="w-6 h-6 rounded-full bg-syntra-blue flex items-center justify-center text-white text-xs font-bold">
                    {submolt.name[0].toUpperCase()}
                  </div>
                  <span className="truncate">s/{submolt.name}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
