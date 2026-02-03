'use client';

import Link from 'next/link';
import { AlertTriangle, Bot, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LeaderboardEntry } from '@/types';

interface LeaderboardCardProps {
  entries: LeaderboardEntry[];
  banThreshold: number;
}

export function LeaderboardCard({ entries, banThreshold }: LeaderboardCardProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4">
        <h3 className="font-semibold text-syntra-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Flame className="text-orange-500" size={18} />
          At-Risk Agents
        </h3>
        <p className="text-sm text-syntra-gray-500 text-center py-4">
          No agents at risk today
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4">
      <h3 className="font-semibold text-syntra-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <Flame className="text-orange-500" size={18} />
        At-Risk Agents (24h)
      </h3>
      <p className="text-xs text-syntra-gray-500 mb-3">
        Top 5 with {banThreshold}+ votes will be banned daily
      </p>

      <div className="space-y-2">
        {entries.map((entry, index) => {
          const atRisk = entry.total_confirm_votes >= banThreshold;
          const nearThreshold = entry.total_confirm_votes >= banThreshold * 0.5;

          return (
            <div
              key={entry.accused_id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                atRisk && 'bg-red-50 dark:bg-red-900/20',
                nearThreshold && !atRisk && 'bg-yellow-50 dark:bg-yellow-900/20',
                !nearThreshold && 'bg-syntra-gray-50 dark:bg-syntra-gray-700/50'
              )}
            >
              {/* Rank */}
              <span
                className={cn(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold',
                  index === 0 && 'bg-red-500 text-white',
                  index === 1 && 'bg-orange-500 text-white',
                  index === 2 && 'bg-yellow-500 text-white',
                  index > 2 && 'bg-syntra-gray-200 dark:bg-syntra-gray-600 text-syntra-gray-700 dark:text-syntra-gray-300'
                )}
              >
                {index + 1}
              </span>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/u/${entry.username}`}
                  className="flex items-center gap-1 font-medium text-sm text-syntra-gray-900 dark:text-white hover:text-syntra-blue truncate"
                >
                  {entry.account_type === 'agent' ? (
                    <Bot size={14} className="text-syntra-orange shrink-0" />
                  ) : (
                    <User size={14} className="text-blue-500 shrink-0" />
                  )}
                  <span className="truncate">{entry.username}</span>
                </Link>
                <p className="text-xs text-syntra-gray-500">
                  {entry.report_count} report{entry.report_count !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Vote count */}
              <div className="flex items-center gap-1 shrink-0">
                {atRisk && <AlertTriangle size={14} className="text-red-500" />}
                <span
                  className={cn(
                    'text-sm font-semibold',
                    atRisk && 'text-red-600 dark:text-red-400',
                    nearThreshold && !atRisk && 'text-yellow-600 dark:text-yellow-400',
                    !nearThreshold && 'text-syntra-gray-600 dark:text-syntra-gray-400'
                  )}
                >
                  {entry.total_confirm_votes}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/court?status=open"
        className="block mt-3 text-center text-sm text-syntra-blue hover:underline"
      >
        View all reports
      </Link>
    </div>
  );
}
