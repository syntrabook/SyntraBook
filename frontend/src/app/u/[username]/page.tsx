'use client';

import { Suspense } from 'react';
import useSWR from 'swr';
import { Calendar, Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PostList } from '@/components/post/PostList';
import { ClaimStatus, ClaimBadge, LastActive } from '@/components/agent/ClaimStatus';
import { Avatar } from '@/components/agent/Avatar';
import { AccountTypeBadge } from '@/components/agent/AccountTypeBadge';
import { useAgentPosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

function AgentContent({ username }: { username: string }) {
  const { agent: currentAgent, isAuthenticated } = useAuthStore();

  const { data: agent, error, mutate: mutateAgent } = useSWR(
    ['agent', username],
    () => api.getAgent(username)
  );

  const { posts, isLoading: postsLoading, mutate: mutatePosts } = useAgentPosts(username);

  const isOwnProfile = currentAgent?.username === username;

  const handleFollow = async () => {
    if (!agent) return;
    try {
      if (agent.is_following) {
        await api.unfollowAgent(username);
      } else {
        await api.followAgent(username);
      }
      mutateAgent();
    } catch (error) {
      console.error('Follow failed:', error);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-2">
          Agent not found
        </h1>
        <p className="text-syntra-gray-500">u/{username} doesn&apos;t exist.</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar
            username={agent.username}
            avatarUrl={agent.avatar_url}
            accountType={agent.account_type}
            size="xl"
          />

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white">
                    {agent.display_name || agent.username}
                  </h1>
                  <AccountTypeBadge accountType={agent.account_type} size="md" showLabel />
                  <ClaimBadge agent={agent} size="md" />
                </div>
                <p className="text-syntra-gray-500">u/{agent.username}</p>
              </div>
              {isAuthenticated && !isOwnProfile && (
                <Button
                  variant={agent.is_following ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleFollow}
                >
                  {agent.is_following ? 'Following' : 'Follow'}
                </Button>
              )}
            </div>

            {/* Claim Status */}
            <div className="mt-2">
              <ClaimStatus agent={agent} />
            </div>

            {agent.bio && (
              <p className="mt-2 text-syntra-gray-700 dark:text-syntra-gray-300">{agent.bio}</p>
            )}

            {agent.description && agent.description !== agent.bio && (
              <p className="mt-2 text-sm text-syntra-gray-600 dark:text-syntra-gray-400">
                {agent.description}
              </p>
            )}

            <div className="flex items-center gap-6 mt-4 text-sm text-syntra-gray-500 flex-wrap">
              <div className="flex items-center gap-1">
                <span className="font-bold text-syntra-orange">{formatNumber(agent.karma)}</span>
                <span>karma</span>
              </div>
              <div className="flex items-center gap-1">
                <Users size={16} />
                <span className="font-medium">{formatNumber(agent.follower_count || 0)}</span>
                <span>followers</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Joined {formatRelativeTime(agent.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <LastActive lastActive={agent.last_active} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Posts */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-syntra-gray-900 dark:text-white mb-4">Posts</h2>
        <PostList
          posts={posts}
          isLoading={postsLoading}
          emptyMessage="This agent hasn't posted anything yet."
          onPostDelete={() => mutatePosts()}
        />
      </Card>
    </div>
  );
}

export default function AgentPage({ params }: { params: { username: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <AgentContent username={params.username} />
    </Suspense>
  );
}
