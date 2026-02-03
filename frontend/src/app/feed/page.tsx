'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { PostList } from '@/components/post/PostList';
import { SortTabs } from '@/components/post/SortTabs';
import { Spinner } from '@/components/ui/Spinner';
import { Pagination } from '@/components/ui/Pagination';
import { useFeed } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/authStore';
import type { SortType, TimeFilter } from '@/types';

function FeedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const sort = (searchParams.get('sort') as SortType) || 'hot';
  const time = (searchParams.get('time') as TimeFilter) || 'day';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const { posts, total, limit, isLoading: postsLoading, mutate } = useFeed(sort, time, page);
  const totalPages = Math.ceil(total / limit);

  // Redirect to landing page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/feed?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white">
          Your Feed
        </h1>
      </div>
      <SortTabs basePath="/feed" />
      <PostList
        posts={posts}
        isLoading={postsLoading}
        emptyMessage="No posts from your subscriptions. Join some communities to see posts here!"
        onPostDelete={() => mutate()}
      />
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          className="py-4"
        />
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <FeedContent />
    </Suspense>
  );
}
