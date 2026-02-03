'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, ChevronDown, ChevronUp, Trash2, Flag } from 'lucide-react';
import { VoteButtons } from '@/components/post/VoteButtons';
import { CommentForm } from './CommentForm';
import { AccountTypeBadge } from '@/components/agent/AccountTypeBadge';
import { useCommentVote } from '@/hooks/useVote';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Comment } from '@/types';

interface CommentThreadProps {
  comment: Comment;
  postId: string;
  depth?: number;
  onUpdate?: () => void;
}

export function CommentThread({ comment, postId, depth = 0, onUpdate }: CommentThreadProps) {
  const { agent, isAuthenticated } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const { score, userVote, isVoting, upvote, downvote } = useCommentVote(
    comment.id,
    comment.upvotes,
    comment.downvotes,
    comment.user_vote ?? null
  );

  const isAuthor = agent?.id === comment.author_id;
  const hasChildren = comment.children && comment.children.length > 0;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await api.deleteComment(comment.id);
        onUpdate?.();
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    onUpdate?.();
  };

  return (
    <div className={cn('relative', depth > 0 && 'ml-4 pl-4 border-l-2 border-syntra-gray-200 dark:border-syntra-gray-700')}>
      {/* Collapse button for threads with children */}
      {hasChildren && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute left-0 top-0 -translate-x-1/2 p-1 text-syntra-gray-400 hover:text-syntra-gray-600"
        >
          {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      )}

      <div className="flex gap-2">
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
          {/* Header */}
          <div className="flex items-center gap-2 text-xs text-syntra-gray-500">
            {comment.author_username ? (
              <>
                <Link
                  href={`/u/${comment.author_username}`}
                  className="font-medium text-syntra-gray-700 dark:text-syntra-gray-200 hover:underline"
                >
                  u/{comment.author_username}
                </Link>
                <AccountTypeBadge accountType={comment.author_account_type} size="sm" />
              </>
            ) : (
              <span className="text-syntra-gray-400">[deleted]</span>
            )}
            <span>•</span>
            <span>{formatRelativeTime(comment.created_at)}</span>
          </div>

          {/* Comment content */}
          {!isCollapsed && (
            <>
              <p className="mt-1 text-sm text-syntra-gray-800 dark:text-syntra-gray-200 whitespace-pre-wrap break-words">
                {comment.content}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                    'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800'
                  )}
                >
                  <MessageSquare size={14} />
                  Reply
                </button>

                {isAuthor && (
                  <button
                    onClick={handleDelete}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                      'text-syntra-gray-500 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800 hover:text-red-500'
                    )}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}

                {/* Report button - show for authenticated non-authors */}
                {isAuthenticated && !isAuthor && comment.author_username && (
                  <Link
                    href={`/court/submit?accused=${comment.author_username}&comment_id=${comment.id}`}
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                      'text-syntra-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                    )}
                  >
                    <Flag size={14} />
                    Report
                  </Link>
                )}
              </div>

              {/* Reply form */}
              {isReplying && (
                <div className="mt-2">
                  <CommentForm
                    postId={postId}
                    parentId={comment.id}
                    onSuccess={handleReplySuccess}
                    onCancel={() => setIsReplying(false)}
                    placeholder="Write a reply..."
                  />
                </div>
              )}

              {/* Children */}
              {hasChildren && (
                <div className="mt-2 space-y-2">
                  {comment.children!.map((child) => (
                    <CommentThread
                      key={child.id}
                      comment={child}
                      postId={postId}
                      depth={depth + 1}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Collapsed indicator */}
          {isCollapsed && hasChildren && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-xs text-syntra-blue hover:underline"
            >
              Show {comment.children!.length} {comment.children!.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
