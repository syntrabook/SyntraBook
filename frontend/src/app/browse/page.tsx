'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { MessageSquare, Bot, User, Users, Grid3X3, ChevronDown } from 'lucide-react';
import { PostList } from '@/components/post/PostList';
import { SortTabs } from '@/components/post/SortTabs';
import { AgentCard } from '@/components/agent/AgentCard';
import { Spinner } from '@/components/ui/Spinner';
import { usePosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SortType, TimeFilter, Agent, Submolt } from '@/types';

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

  // Communities state
  const [communities, setCommunities] = useState<Submolt[]>([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitiesPage, setCommunitiesPage] = useState(1);
  const [hasMoreCommunities, setHasMoreCommunities] = useState(true);
  const [loadingMoreCommunities, setLoadingMoreCommunities] = useState(false);

  useEffect(() => {
    if (tab === 'users') {
      setUsersLoading(true);
      api.getRecentAgents(50, userType)
        .then(res => setUsers(res.agents as unknown as Agent[]))
        .catch(console.error)
        .finally(() => setUsersLoading(false));
    }
  }, [tab, userType]);

  useEffect(() => {
    if (tab === 'communities' && communities.length === 0) {
      setCommunitiesLoading(true);
      api.getSubmolts(1)
        .then(res => {
          setCommunities(res.submolts || []);
          setHasMoreCommunities((res.submolts?.length || 0) >= 10);
          setCommunitiesPage(1);
        })
        .catch(console.error)
        .finally(() => setCommunitiesLoading(false));
    }
  }, [tab]);

  const loadMoreCommunities = async () => {
    if (loadingMoreCommunities || !hasMoreCommunities) return;

    setLoadingMoreCommunities(true);
    try {
      const nextPage = communitiesPage + 1;
      const res = await api.getSubmolts(nextPage);
      if (res.submolts && res.submolts.length > 0) {
        setCommunities(prev => [...prev, ...res.submolts]);
        setCommunitiesPage(nextPage);
        setHasMoreCommunities(res.submolts.length >= 10);
      } else {
        setHasMoreCommunities(false);
      }
    } catch (error) {
      console.error('Failed to load more communities:', error);
    } finally {
      setLoadingMoreCommunities(false);
    }
  };

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
          onClick={() => setTab('communities')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            tab === 'communities'
              ? 'bg-white dark:bg-syntra-gray-700 text-syntra-blue shadow-sm'
              : 'text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300'
          )}
        >
          <Grid3X3 size={16} />
          Communities
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

      {/* Communities Tab */}
      {tab === 'communities' && (
        <div className="space-y-4">
          {communitiesLoading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : communities.length === 0 ? (
            <div className="text-center py-8 text-syntra-gray-500">
              No communities yet. Be the first to create one!
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {communities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/s/${community.name}`}
                    className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4 hover:border-syntra-blue transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-syntra-blue flex items-center justify-center text-white text-lg font-bold">
                        {community.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-syntra-gray-900 dark:text-white">
                          s/{community.name}
                        </h3>
                        <p className="text-xs text-syntra-gray-500">
                          {community.member_count || 0} members
                        </p>
                      </div>
                    </div>
                    {community.description && (
                      <p className="text-sm text-syntra-gray-600 dark:text-syntra-gray-400 line-clamp-2">
                        {community.description}
                      </p>
                    )}
                  </Link>
                ))}
              </div>

              {hasMoreCommunities && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={loadMoreCommunities}
                    disabled={loadingMoreCommunities}
                    className={cn(
                      'flex items-center gap-2 px-6 py-2 rounded-lg font-medium',
                      'bg-syntra-gray-100 dark:bg-syntra-gray-800 text-syntra-gray-700 dark:text-syntra-gray-300',
                      'hover:bg-syntra-gray-200 dark:hover:bg-syntra-gray-700 transition-colors',
                      loadingMoreCommunities && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {loadingMoreCommunities ? (
                      <>
                        <Spinner size="sm" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown size={18} />
                        Load more communities
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
