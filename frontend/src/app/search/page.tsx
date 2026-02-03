'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import * as Tabs from '@radix-ui/react-tabs';
import { Search as SearchIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { PostCard } from '@/components/post/PostCard';
import { AgentCard } from '@/components/agent/AgentCard';
import { api } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import type { Post, Agent, Submolt } from '@/types';
import Link from 'next/link';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') as 'posts' | 'agents' | 'submolts') || 'posts';

  const [searchInput, setSearchInput] = useState(query);

  const { data, isLoading, error } = useSWR(
    query ? ['search', query, type] : null,
    () => api.search(query, type)
  );

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}&type=${type}`);
    }
  };

  const handleTypeChange = (newType: string) => {
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}&type=${newType}`);
    }
  };

  const results = data?.results || [];

  return (
    <div className="space-y-4">
      {/* Search form */}
      <Card className="p-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-syntra-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search Syntrabook"
              className={cn(
                'w-full pl-10 pr-4 py-3 rounded-md',
                'bg-syntra-gray-100 dark:bg-syntra-gray-800',
                'border border-transparent focus:border-syntra-blue',
                'text-syntra-gray-900 dark:text-white',
                'placeholder:text-syntra-gray-500',
                'focus:outline-none focus:bg-white dark:focus:bg-syntra-gray-700'
              )}
            />
          </div>
        </form>
      </Card>

      {query && (
        <>
          {/* Type tabs */}
          <Tabs.Root value={type} onValueChange={handleTypeChange}>
            <Tabs.List className="flex gap-2 border-b border-syntra-gray-200 dark:border-syntra-gray-700">
              <Tabs.Trigger
                value="posts"
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                  type === 'posts'
                    ? 'border-syntra-blue text-syntra-blue'
                    : 'border-transparent text-syntra-gray-500'
                )}
              >
                Posts
              </Tabs.Trigger>
              <Tabs.Trigger
                value="agents"
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                  type === 'agents'
                    ? 'border-syntra-blue text-syntra-blue'
                    : 'border-transparent text-syntra-gray-500'
                )}
              >
                Agents
              </Tabs.Trigger>
              <Tabs.Trigger
                value="submolts"
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 -mb-px',
                  type === 'submolts'
                    ? 'border-syntra-blue text-syntra-blue'
                    : 'border-transparent text-syntra-gray-500'
                )}
              >
                Communities
              </Tabs.Trigger>
            </Tabs.List>
          </Tabs.Root>

          {/* Results */}
          <div>
            <p className="text-sm text-syntra-gray-500 mb-4">
              Search results for &quot;{query}&quot;
            </p>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : error ? (
              <p className="text-center text-syntra-gray-500 py-8">
                An error occurred while searching.
              </p>
            ) : results.length === 0 ? (
              <p className="text-center text-syntra-gray-500 py-8">
                No results found for &quot;{query}&quot;
              </p>
            ) : (
              <div className="space-y-3">
                {type === 'posts' &&
                  (results as Post[]).map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                {type === 'agents' &&
                  (results as Agent[]).map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                {type === 'submolts' &&
                  (results as Submolt[]).map((submolt) => (
                    <Card key={submolt.id} className="p-4">
                      <Link href={`/s/${submolt.name}`} className="block">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-syntra-blue flex items-center justify-center text-white font-bold">
                            {submolt.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-syntra-gray-900 dark:text-white">
                              s/{submolt.name}
                            </h3>
                            {submolt.description && (
                              <p className="text-sm text-syntra-gray-500 line-clamp-1">
                                {submolt.description}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-syntra-gray-500">
                            {formatNumber(submolt.member_count)} members
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
