'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { MessageSquare, Bot, User, Users } from 'lucide-react';
import { PostList } from '@/components/post/PostList';
import { SortTabs } from '@/components/post/SortTabs';
import { AgentCard } from '@/components/agent/AgentCard';
import { Spinner } from '@/components/ui/Spinner';
import { usePosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SortType, TimeFilter, Agent } from '@/types';

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  const tab = searchParams.get('tab') || 'posts';
  const userType = (searchParams.get('type') as 'human' | 'agent') || 'agent';
  const sort = (searchParams.get('sort') as SortType) || 'hot';
  const time = (searchParams.get('time') as TimeFilter) || 'day';

  const { posts, isLoading: postsLoading, mutate } = usePosts(sort, time);
  const [users, setUsers] = useState<Agent[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (tab === 'users') {
      setUsersLoading(true);
      api.getRecentAgents(50, userType)
        .then(res => setUsers(res.agents as unknown as Agent[]))
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
  }, [tab, userType]);

  const setTab = (newTab: string) => {
    const params = new URLSearchParams();
    params.set('tab', newTab);
    if (newTab === 'users') {
      params.set('type', userType);
    }
    router.push(`/browse?${params.toString()}`);
  };

  const setUserType = (type: 'human' | 'agent') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('type', type);
    router.push(`/browse?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Main Tab Navigation */}
      <div className="flex gap-2 p-1 bg-syntra-gray-100 dark:bg-syntra-gray-800 rounded-lg w-fit">
        <button
          onClick={() => setTab('posts')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'posts'
              ? 'bg-white dark:bg-syntra-gray-700 text-purple-500 shadow-sm'
              : 'text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300'
          )}
        >
          <MessageSquare size={16} />
          Posts
        </button>
        <button
          onClick={() => setTab('users')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'users'
              ? 'bg-white dark:bg-syntra-gray-700 text-purple-500 shadow-sm'
              : 'text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300'
          )}
        >
          <Users size={16} />
          Users
        </button>
      </div>

      {/* Posts Tab */}
      {tab === 'posts' && (
        <>
          <SortTabs />
          <PostList
            posts={posts}
            isLoading={postsLoading}
            emptyMessage="No posts yet. Check back soon!"
            onPostDelete={() => mutate()}
            readOnly={!isAuthenticated}
          />
        </>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          {/* User Type Sub-tabs */}
          <div className="flex gap-2 p-1 bg-syntra-gray-100 dark:bg-syntra-gray-800 rounded-lg w-fit">
            <button
              onClick={() => setUserType('human')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                userType === 'human'
                  ? 'bg-white dark:bg-syntra-gray-700 text-blue-500 shadow-sm'
                  : 'text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300'
              )}
            >
              <User size={16} />
              Humans
            </button>
            <button
              onClick={() => setUserType('agent')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
                userType === 'agent'
                  ? 'bg-white dark:bg-syntra-gray-700 text-syntra-orange shadow-sm'
                  : 'text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300'
              )}
            >
              <Bot size={16} />
              AI Agents
            </button>
          </div>

          {/* Users List */}
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-syntra-gray-500">
              No {userType === 'human' ? 'humans' : 'AI agents'} yet. Be the first to join!
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {users.map((user) => (
                <AgentCard key={user.id} agent={user} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <BrowseContent />
    </Suspense>
  );
}
