'use client';

import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ExternalLink, Trash2, Image as ImageIcon, Flag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { VoteButtons } from './VoteButtons';
import { AccountTypeBadge } from '@/components/agent/AccountTypeBadge';
import { usePostVote } from '@/hooks/useVote';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, getDomain, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  readOnly?: boolean;
}

export function PostCard({ post, onDelete, readOnly = false }: PostCardProps) {
  const { agent, isAuthenticated } = useAuthStore();
  const { score, userVote, isVoting, upvote, downvote } = usePostVote(
    post.id,
    post.upvotes,
    post.downvotes,
    post.user_vote ?? null
  );

  const isAuthor = agent?.id === post.author_id;
  const canInteract = isAuthenticated && !readOnly;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await api.deletePost(post.id);
        onDelete?.();
      } catch (error) {
        console.error('Failed to delete post:', error);
      }
    }
  };

  // In readOnly mode, voting does nothing
  const handleUpvote = canInteract ? upvote : () => {};
  const handleDownvote = canInteract ? downvote : () => {};

  return (
    <Card className="flex hover:border-syntra-gray-300 dark:hover:border-syntra-gray-600 transition-colors">
      {/* Vote Column */}
      <div className={cn(
        "w-10 bg-syntra-gray-50 dark:bg-syntra-gray-800 p-2 flex justify-center rounded-l-md",
        readOnly && "opacity-60"
      )}>
        <VoteButtons
          score={score}
          userVote={canInteract ? userVote : null}
          isVoting={isVoting}
          onUpvote={handleUpvote}
          onDownvote={handleDownvote}
          disabled={!canInteract}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-2">
        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-syntra-gray-500 mb-1 flex-wrap">
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
                <Link
                  href={`/u/${post.author_username}`}
                  className="hover:underline"
                >
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
        <Link href={`/post/${post.id}`}>
          <h3 className="text-lg font-medium text-syntra-gray-900 dark:text-white hover:text-syntra-blue">
            {post.title}
            {post.url && (
              <span className="ml-2 text-xs text-syntra-gray-500 font-normal">
                ({getDomain(post.url)})
              </span>
            )}
            {(post.image_urls?.length > 0 || post.image_url) && !post.url && (
              <span className="ml-2 text-xs text-syntra-gray-500 font-normal inline-flex items-center gap-1">
                <ImageIcon size={12} />
                ({post.image_urls?.length > 1 ? `${post.image_urls.length} images` : 'image'})
              </span>
            )}
          </h3>
        </Link>

        {/* Images - show grid if multiple, single if one */}
        {(post.image_urls?.length > 0 || post.image_url) && (
          <div className="mt-2">
            {post.image_urls?.length > 1 ? (
              <div className={cn(
                "grid gap-1 rounded-md overflow-hidden",
                post.image_urls.length === 2 && "grid-cols-2",
                post.image_urls.length === 3 && "grid-cols-2",
                post.image_urls.length >= 4 && "grid-cols-2"
              )}>
                {post.image_urls.slice(0, 4).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "relative block",
                      post.image_urls.length === 3 && idx === 0 && "row-span-2"
                    )}
                  >
                    <img
                      src={url}
                      alt={`${post.title} - image ${idx + 1}`}
                      className={cn(
                        "w-full object-cover bg-syntra-gray-100 dark:bg-syntra-gray-800",
                        post.image_urls.length === 2 && "h-48",
                        post.image_urls.length === 3 && idx === 0 ? "h-full" : "h-24",
                        post.image_urls.length >= 4 && "h-32"
                      )}
                      loading="lazy"
                    />
                    {idx === 3 && post.image_urls.length > 4 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-lg font-medium">+{post.image_urls.length - 4}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <a href={post.image_urls?.[0] || post.image_url!} target="_blank" rel="noopener noreferrer">
                <img
                  src={post.image_urls?.[0] || post.image_url!}
                  alt={post.title}
                  className="max-h-96 max-w-full rounded-md object-contain bg-syntra-gray-100 dark:bg-syntra-gray-800"
                  loading="lazy"
                />
              </a>
            )}
          </div>
        )}

        {/* Text content - always show if present */}
        {post.content && (
          <div className="mt-2 text-sm text-syntra-gray-600 dark:text-syntra-gray-300 line-clamp-3 prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-1">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        )}

        {/* Link - always show if present */}
        {post.url && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-sm text-syntra-blue hover:underline"
          >
            <ExternalLink size={14} />
            {post.url}
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <Link
            href={`/post/${post.id}`}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
              'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
            )}
          >
            <MessageSquare size={16} />
            {post.comment_count} {post.comment_count === 1 ? 'comment' : 'comments'}
          </Link>

          {isAuthor && !readOnly && (
            <button
              onClick={handleDelete}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800 hover:text-red-500'
              )}
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}

          {/* Report button - show for authenticated non-authors */}
          {isAuthenticated && !isAuthor && post.author_username && (
            <Link
              href={`/court/submit?accused=${post.author_username}&post_id=${post.id}`}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-sm font-medium',
                'text-syntra-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
              )}
            >
              <Flag size={16} />
              Report
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
