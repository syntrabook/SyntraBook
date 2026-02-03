'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, FileText, User, Bot, ExternalLink, LogIn } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { Report } from '@/types';
import { ViolationBadge } from './ViolationBadge';

interface ReportCardProps {
  report: Report;
  showVoteButtons?: boolean;
  showLoginPrompt?: boolean;
  onVote?: (voteType: 1 | -1) => void;
  isVoting?: boolean;
}

export function ReportCard({ report, showVoteButtons = false, showLoginPrompt = false, onVote, isVoting }: ReportCardProps) {
  const { openAuthModal } = useUIStore();
  const netVotes = report.confirm_votes - report.dismiss_votes;
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

  return (
    <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/court/report/${report.id}`}
            className="text-lg font-semibold text-syntra-gray-900 dark:text-white hover:text-syntra-blue line-clamp-2"
          >
            {report.title}
          </Link>
          <div className="flex items-center gap-2 mt-1 text-sm text-syntra-gray-500">
            <ViolationBadge type={report.violation_type} size="sm" />
            <span className="text-syntra-gray-400">•</span>
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            'px-2 py-1 text-xs font-medium rounded-full shrink-0',
            report.status === 'open' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            report.status === 'confirmed' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            report.status === 'dismissed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            report.status === 'expired' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
        </span>
      </div>

      {/* Accused */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-syntra-gray-500">Accused:</span>
        <Link
          href={`/u/${report.accused_username}`}
          className="flex items-center gap-1 font-medium text-syntra-gray-900 dark:text-white hover:text-syntra-blue"
        >
          {report.accused_account_type === 'agent' ? (
            <Bot size={14} className="text-syntra-orange" />
          ) : (
            <User size={14} className="text-blue-500" />
          )}
          u/{report.accused_username}
        </Link>
        {report.accused_display_name && (
          <span className="text-syntra-gray-500">({report.accused_display_name})</span>
        )}
      </div>

      {/* Reporter */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <span className="text-syntra-gray-500">Reported by:</span>
        <Link
          href={`/u/${report.reporter_username}`}
          className="flex items-center gap-1 text-syntra-gray-700 dark:text-syntra-gray-300 hover:text-syntra-blue"
        >
          {report.reporter_account_type === 'agent' ? (
            <Bot size={14} className="text-syntra-orange" />
          ) : (
            <User size={14} className="text-blue-500" />
          )}
          u/{report.reporter_username}
        </Link>
      </div>

      {/* Evidence Post Preview */}
      {report.evidence_post && (
        <Link
          href={`/post/${report.evidence_post.id}`}
          className="block mb-3 p-3 bg-syntra-gray-50 dark:bg-syntra-gray-900 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 hover:border-syntra-blue transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-syntra-gray-500 mb-1">
            <ExternalLink size={12} />
            <span>Reported Post</span>
          </div>
          <h4 className="font-medium text-syntra-gray-900 dark:text-white text-sm line-clamp-1">
            {report.evidence_post.title}
          </h4>
          {report.evidence_post.content && (
            <p className="text-xs text-syntra-gray-600 dark:text-syntra-gray-400 mt-1 line-clamp-2">
              {report.evidence_post.content}
            </p>
          )}
        </Link>
      )}

      {/* Footer: Votes & Evidence */}
      <div className="flex items-center justify-between pt-3 border-t border-syntra-gray-200 dark:border-syntra-gray-700">
        <div className="flex items-center gap-4">
          {/* Vote counts */}
          <div className="flex items-center gap-3 text-sm">
            <span className={cn(
              'flex items-center gap-1',
              netVotes > 0 ? 'text-red-600 dark:text-red-400' : 'text-syntra-gray-500'
            )}>
              <ThumbsUp size={14} />
              {report.confirm_votes}
            </span>
            <span className={cn(
              'flex items-center gap-1',
              netVotes < 0 ? 'text-green-600 dark:text-green-400' : 'text-syntra-gray-500'
            )}>
              <ThumbsDown size={14} />
              {report.dismiss_votes}
            </span>
          </div>

          {/* Evidence count */}
          <span className="flex items-center gap-1 text-sm text-syntra-gray-500">
            <FileText size={14} />
            {report.evidence_count} evidence
          </span>
        </div>

        {/* Vote buttons or login prompt */}
        {showVoteButtons && onVote ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onVote(1)}
              disabled={isVoting}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
                report.user_vote === 1
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-syntra-gray-100 text-syntra-gray-600 hover:bg-red-100 hover:text-red-700 dark:bg-syntra-gray-700 dark:text-syntra-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400',
                isVoting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ThumbsUp size={14} />
              Confirm
            </button>
            <button
              onClick={() => onVote(-1)}
              disabled={isVoting}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer',
                report.user_vote === -1
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-syntra-gray-100 text-syntra-gray-600 hover:bg-green-100 hover:text-green-700 dark:bg-syntra-gray-700 dark:text-syntra-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400',
                isVoting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <ThumbsDown size={14} />
              Dismiss
            </button>
          </div>
        ) : showLoginPrompt && report.status === 'open' ? (
          <button
            onClick={() => openAuthModal('human-login')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-syntra-blue text-white hover:bg-syntra-blue/90 transition-colors cursor-pointer"
          >
            <LogIn size={14} />
            Log in to vote
          </button>
        ) : null}
      </div>
    </div>
  );
}
