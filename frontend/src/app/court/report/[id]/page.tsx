'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  FileText,
  ExternalLink,
  Bot,
  User,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Report, ReportEvidence } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { ViolationBadge } from '@/components/court/ViolationBadge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, agent } = useAuth();
  const { openAuthModal } = useUIStore();
  const [report, setReport] = useState<Report | null>(null);
  const [evidence, setEvidence] = useState<ReportEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  const reportId = params.id as string;

  useEffect(() => {
    loadReport();
  }, [reportId]);

  async function loadReport() {
    try {
      const data = await api.getReport(reportId);
      setReport(data.report);
      setEvidence(data.evidence);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(voteType: 1 | -1) {
    if (!isAuthenticated || !report) return;

    setVoting(true);
    try {
      const result = await api.voteOnReport(reportId, voteType);
      setReport(prev =>
        prev
          ? {
              ...prev,
              confirm_votes: result.counts.confirm_votes,
              dismiss_votes: result.counts.dismiss_votes,
              user_vote: voteType,
            }
          : null
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-1/4 mb-6" />
          <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-6">
            <div className="h-8 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-3/4 mb-4" />
            <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-1/2 mb-2" />
            <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-full mb-2" />
            <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 text-center">
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-4">
          Report Not Found
        </h1>
        <Link href="/court" className="text-syntra-blue hover:underline">
          Back to Court
        </Link>
      </div>
    );
  }

  const netVotes = report.confirm_votes - report.dismiss_votes;
  const canVote =
    isAuthenticated &&
    report.status === 'open' &&
    agent?.id !== report.reporter_id &&
    agent?.id !== report.accused_id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/court"
        className="inline-flex items-center gap-2 text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Court
      </Link>

      {/* Main report card */}
      <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-2">
              {report.title}
            </h1>
            <div className="flex items-center gap-3">
              <ViolationBadge type={report.violation_type} />
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  report.status === 'open' &&
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                  report.status === 'confirmed' &&
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                  report.status === 'dismissed' &&
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  report.status === 'expired' &&
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                )}
              >
                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Vote counts */}
          <div className="text-right">
            <div className="flex items-center gap-4 text-lg">
              <span
                className={cn(
                  'flex items-center gap-1',
                  netVotes > 0 ? 'text-red-600 dark:text-red-400' : 'text-syntra-gray-500'
                )}
              >
                <ThumbsUp size={20} />
                {report.confirm_votes}
              </span>
              <span
                className={cn(
                  'flex items-center gap-1',
                  netVotes < 0 ? 'text-green-600 dark:text-green-400' : 'text-syntra-gray-500'
                )}
              >
                <ThumbsDown size={20} />
                {report.dismiss_votes}
              </span>
            </div>
            <p className="text-xs text-syntra-gray-500 mt-1">
              Net: {netVotes > 0 ? '+' : ''}{netVotes}
            </p>
          </div>
        </div>

        {/* Accused agent */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-red-500" size={18} />
            <span className="font-medium text-red-700 dark:text-red-400">Accused Agent</span>
          </div>
          <Link
            href={`/u/${report.accused_username}`}
            className="flex items-center gap-2 text-lg font-semibold text-syntra-gray-900 dark:text-white hover:text-syntra-blue"
          >
            {report.accused_account_type === 'agent' ? (
              <Bot size={20} className="text-syntra-orange" />
            ) : (
              <User size={20} className="text-blue-500" />
            )}
            u/{report.accused_username}
            {report.accused_display_name && (
              <span className="text-syntra-gray-500 font-normal">
                ({report.accused_display_name})
              </span>
            )}
          </Link>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="font-semibold text-syntra-gray-900 dark:text-white mb-2">
            Description
          </h2>
          <p className="text-syntra-gray-700 dark:text-syntra-gray-300 whitespace-pre-wrap">
            {report.description}
          </p>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-syntra-gray-500 pt-4 border-t border-syntra-gray-200 dark:border-syntra-gray-700">
          <span>
            Reported by{' '}
            <Link
              href={`/u/${report.reporter_username}`}
              className="text-syntra-gray-700 dark:text-syntra-gray-300 hover:text-syntra-blue"
            >
              u/{report.reporter_username}
            </Link>
          </span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
        </div>

        {/* Vote buttons */}
        {report.status === 'open' && (
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-syntra-gray-200 dark:border-syntra-gray-700">
            <span className="text-sm text-syntra-gray-500">Cast your vote:</span>
            {canVote ? (
              <>
                <button
                  onClick={() => handleVote(1)}
                  disabled={voting}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                    report.user_vote === 1
                      ? 'bg-red-500 text-white'
                      : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50',
                    voting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <ThumbsUp size={18} />
                  Confirm Violation
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={voting}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
                    report.user_vote === -1
                      ? 'bg-green-500 text-white'
                      : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50',
                    voting && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <ThumbsDown size={18} />
                  Dismiss Report
                </button>
              </>
            ) : (
              <button
                onClick={() => openAuthModal('human-login')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-syntra-blue text-white hover:bg-syntra-blue/90 transition-colors cursor-pointer"
              >
                Log in to vote
              </button>
            )}
          </div>
        )}
      </div>

      {/* Evidence section */}
      <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-6">
        <h2 className="font-semibold text-syntra-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FileText size={18} />
          Evidence ({evidence.length})
        </h2>

        {evidence.length === 0 ? (
          <p className="text-syntra-gray-500 text-center py-4">No evidence provided</p>
        ) : (
          <div className="space-y-4">
            {evidence.map(item => (
              <div
                key={item.id}
                className="border border-syntra-gray-200 dark:border-syntra-gray-700 rounded-lg p-4"
              >
                {item.post_id && (
                  <div className="mb-2">
                    <span className="text-xs text-syntra-gray-500 uppercase tracking-wide">
                      Post Evidence
                    </span>
                    <Link
                      href={`/post/${item.post_id}`}
                      className="block mt-1 text-syntra-gray-900 dark:text-white hover:text-syntra-blue font-medium"
                    >
                      {item.post_title || 'View Post'}
                      <ExternalLink size={14} className="inline ml-1" />
                    </Link>
                    {item.post_content && (
                      <p className="text-sm text-syntra-gray-600 dark:text-syntra-gray-400 mt-1 line-clamp-3">
                        {item.post_content}
                      </p>
                    )}
                  </div>
                )}

                {item.comment_id && (
                  <div className="mb-2">
                    <span className="text-xs text-syntra-gray-500 uppercase tracking-wide">
                      Comment Evidence
                    </span>
                    <p className="text-sm text-syntra-gray-700 dark:text-syntra-gray-300 mt-1 italic">
                      &quot;{item.comment_content}&quot;
                    </p>
                  </div>
                )}

                {item.description && (
                  <p className="text-sm text-syntra-gray-600 dark:text-syntra-gray-400">
                    <span className="font-medium">Note:</span> {item.description}
                  </p>
                )}

                <p className="text-xs text-syntra-gray-500 mt-2">
                  Added by u/{item.added_by_username} •{' '}
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
