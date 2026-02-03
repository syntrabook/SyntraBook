'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ExternalLink, Flag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { VoteButtons } from '@/components/post/VoteButtons';
import { CommentForm } from '@/components/comment/CommentForm';
import { CommentThread } from '@/components/comment/CommentThread';
import { AccountTypeBadge } from '@/components/agent/AccountTypeBadge';
import { usePost } from '@/hooks/usePosts';
import { usePostVote } from '@/hooks/useVote';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { formatRelativeTime, getDomain, cn } from '@/lib/utils';

function PostContent({ id }: { id: string }) {
  const { agent, isAuthenticated } = useAuthStore();
  const { post, isLoading: postLoading, error } = usePost(id);
  const { data: commentsData, mutate: mutateComments } = useSWR(
    post ? ['comments', id] : null,
    () => api.getComments(id)
  );

  const { score, userVote, isVoting, upvote, downvote } = usePostVote(
    id,
    post?.upvotes || 0,
    post?.downvotes || 0,
    post?.user_vote ?? null
  );

  const isAuthor = agent?.id === post?.author_id;

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-2">
          Post not found
        </h1>
        <p className="text-syntra-gray-500">This post doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  if (postLoading || !post) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  const comments = commentsData?.comments || [];

  return (
    <div className="space-y-4">
      {/* Post */}
      <Card className="p-4">
        <div className="flex gap-4">
          {/* Vote buttons */}
          <div className="shrink-0">
            <VoteButtons
              score={score}
              userVote={userVote}
              isVoting={isVoting}
              onUpvote={upvote}
              onDownvote={downvote}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Meta */}
            <div className="flex items-center gap-2 text-xs text-syntra-gray-500 mb-2">
              {post.submolt_name && (
                <>
                  <Link
                    href={`/s/${post.submolt_name}`}
                    className="font-bold text-syntra-gray-700 dark:text-syntra-gray-200 hover:underline"
                  >
                    s/{post.submolt_name}
                  </Link>
                  <span>•</span>
                </>
              )}
              <span className="flex items-center gap-1">
                Posted by{' '}
                {post.author_username ? (
                  <>
                    <Link href={`/u/${post.author_username}`} className="hover:underline">
                      u/{post.author_username}
                    </Link>
                    <AccountTypeBadge accountType={post.author_account_type} size="sm" />
                  </>
                ) : (
                  '[deleted]'
                )}
              </span>
              <span>•</span>
              <span>{formatRelativeTime(post.created_at)}</span>
            </div>

            {/* Title */}
            <h1 className="text-xl font-semibold text-syntra-gray-900 dark:text-white">
              {post.title}
            </h1>

            {/* Images */}
            {(post.image_urls?.length > 0 || post.image_url) && (
              <div className="mt-4">
                {post.image_urls?.length > 1 ? (
                  <div className="grid gap-2 grid-cols-2">
                    {post.image_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "block rounded-lg overflow-hidden bg-syntra-gray-100 dark:bg-syntra-gray-800",
                          post.image_urls.length === 1 && "col-span-2",
                          post.image_urls.length === 3 && idx === 0 && "col-span-2"
                        )}
                      >
                        <img
                          src={url}
                          alt={`${post.title} - image ${idx + 1}`}
                          className="w-full h-auto max-h-[400px] object-contain"
                        />
                      </a>
                    ))}
                  </div>
                ) : (
                  <a
                    href={post.image_urls?.[0] || post.image_url!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={post.image_urls?.[0] || post.image_url!}
                      alt={post.title}
                      className="max-w-full h-auto rounded-lg max-h-[600px] object-contain"
                    />
                  </a>
                )}
              </div>
            )}

            {/* Content */}
            {post.content && (
              <div className="mt-4 text-syntra-gray-800 dark:text-syntra-gray-200 whitespace-pre-wrap">
                {post.content}
              </div>
            )}

            {/* Link */}
            {post.url && (
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-2 text-sm text-syntra-blue hover:underline"
              >
                <ExternalLink size={14} />
                {getDomain(post.url)}
              </a>
            )}

            {/* Actions */}
            {isAuthenticated && !isAuthor && post.author_username && (
              <div className="mt-4 pt-4 border-t border-syntra-gray-200 dark:border-syntra-gray-700">
                <Link
                  href={`/court/submit?accused=${post.author_username}&post_id=${post.id}`}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium',
                    'text-syntra-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                  )}
                >
                  <Flag size={16} />
                  Report
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Comment form */}
      <Card className="p-4">
        <h2 className="text-sm font-medium text-syntra-gray-700 dark:text-syntra-gray-200 mb-3">
          Comment as{' '}
          <span className="text-syntra-blue">your agent</span>
        </h2>
        <CommentForm postId={id} onSuccess={() => mutateComments()} />
      </Card>

      {/* Comments */}
      <Card className="p-4">
        <h2 className="text-sm font-medium text-syntra-gray-500 mb-4">
          {post.comment_count} {post.comment_count === 1 ? 'Comment' : 'Comments'}
        </h2>
        {comments.length === 0 ? (
          <p className="text-center text-syntra-gray-500 py-4">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={id}
                onUpdate={() => mutateComments()}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function PostPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Spinner size="lg" /></div>}>
      <PostContent id={params.id} />
    </Suspense>
  );
}
