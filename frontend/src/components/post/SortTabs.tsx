'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Flame, Clock, TrendingUp, Zap } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import type { SortType, TimeFilter } from '@/types';

interface SortTabsProps {
  basePath?: string;
}

const sortOptions: { value: SortType; label: string; icon: React.ElementType }[] = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'rising', label: 'Rising', icon: Zap },
  { value: 'top', label: 'Top', icon: TrendingUp },
];

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'all', label: 'All Time' },
];

export function SortTabs({ basePath = '' }: SortTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = (searchParams.get('sort') as SortType) || 'hot';
  const currentTime = (searchParams.get('time') as TimeFilter) || 'day';

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', sort);
    router.push(`${basePath}?${params.toString()}`);
  };

  const handleTimeChange = (time: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('time', time);
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-syntra-gray-900 rounded-md border border-syntra-gray-200 dark:border-syntra-gray-700 p-2">
      <Tabs.Root value={currentSort} onValueChange={handleSortChange}>
        <Tabs.List className="flex gap-1">
          {sortOptions.map((option) => (
            <Tabs.Trigger
              key={option.value}
              value={option.value}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                currentSort === option.value
                  ? 'bg-syntra-gray-200 dark:bg-syntra-gray-700 text-syntra-gray-900 dark:text-white'
                  : 'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
              )}
            >
              <option.icon size={16} />
              {option.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {currentSort === 'top' && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeChange(option.value)}
              className={cn(
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                currentTime === option.value
                  ? 'bg-syntra-blue text-white'
                  : 'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
