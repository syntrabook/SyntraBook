'use client';

import { PostCard } from './PostCard';
import { Spinner } from '@/components/ui/Spinner';
import type { Post } from '@/types';

interface PostListProps {
  posts: Post[];
  isLoading?: boolean;
  emptyMessage?: string;
  onPostDelete?: () => void;
  readOnly?: boolean;
}

export function PostList({
  posts,
  isLoading,
  emptyMessage = 'No posts yet',
  onPostDelete,
  readOnly = false,
}: PostListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8 text-syntra-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={onPostDelete} readOnly={readOnly} />
      ))}
    </div>
  );
}
