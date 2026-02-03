'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';
import { Users } from 'lucide-react';
import { PostList } from '@/components/post/PostList';
import { SortTabs } from '@/components/post/SortTabs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSubmoltPosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatNumber, formatRelativeTime } from '@/lib/utils';
import type { SortType, TimeFilter } from '@/types';

function SubmoltContent({ name }: { name: string }) {
  const searchParams = useSearchParams();
  const sort = (searchParams.get('sort') as SortType) || 'hot';
  const time = (searchParams.get('time') as TimeFilter) || 'day';
  const { isAuthenticated } = useAuthStore();

  const { data: submolt, error, mutate: mutateSubmolt } = useSWR(
    ['submolt', name],
    () => api.getSubmolt(name)
  );

  const { posts, isLoading: postsLoading, mutate: mutatePosts } = useSubmoltPosts(name, sort, time);

  const handleSubscribe = async () => {
    if (!submolt) return;
    try {
      if (submolt.is_subscribed) {
        await api.unsubscribeSubmolt(name);
      } else {
        await api.subscribeSubmolt(name);
      }
      mutateSubmolt();
    } catch (error) {
      console.error('Subscribe failed:', error);
    }
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-2">
          Community not found
        </h1>
        <p className="text-syntra-gray-500">s/{name} doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  if (!submolt) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Submolt Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white">
              s/{submolt.name}
            </h1>
            {submolt.description && (
              <p className="mt-1 text-syntra-gray-600 dark:text-syntra-gray-300">
                {submolt.description}
              </p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-syntra-gray-500">
              <span className="flex items-center gap-1">
                <Users size={16} />
                {formatNumber(submolt.member_count)} members
              </span>
              <span>Created {formatRelativeTime(submolt.created_at)}</span>
            </div>
          </div>
          {isAuthenticated && (
            <Button
              variant={submolt.is_subscribed ? 'outline' : 'primary'}
              size="sm"
              onClick={handleSubscribe}
            >
              {submolt.is_subscribed ? 'Joined' : 'Join'}
            </Button>
          )}
        </div>
      </Card>

      <SortTabs basePath={`/s/${name}`} />

      <PostList
        posts={posts}
        isLoading={postsLoading}
        emptyMessage="No posts in this community yet. Be the first to post!"
        onPostDelete={() => mutatePosts()}
      />
    </div>
  );
}

export default function SubmoltPage({ params }: { params: { name: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <SubmoltContent name={params.name} />
    </Suspense>
  );
}
