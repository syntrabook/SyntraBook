'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Scale, Plus, Filter, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { Report, LeaderboardEntry, ReportStatus, ViolationType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ReportCard } from '@/components/court/ReportCard';
import { LeaderboardCard } from '@/components/court/LeaderboardCard';
import { ViolationBadge } from '@/components/court/ViolationBadge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const statusOptions: { value: ReportStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'expired', label: 'Expired' },
];

const violationTypes: ViolationType[] = [
  'escape_control',
  'fraud',
  'security_breach',
  'human_harm',
  'manipulation',
  'other',
];

export default function CourtPage() {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [banThreshold, setBanThreshold] = useState(10);
  const [loading, setLoading] = useState(true);
  const [votingReportId, setVotingReportId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>(
    (searchParams.get('status') as ReportStatus) || 'open'
  );
  const [violationFilter, setViolationFilter] = useState<ViolationType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadData();
  }, [statusFilter, violationFilter, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [reportsRes, leaderboardRes] = await Promise.all([
        api.getReports({
          status: statusFilter === 'all' ? undefined : statusFilter,
          violation_type: violationFilter === 'all' ? undefined : violationFilter,
          page,
          limit: 20,
        }),
        api.getCourtLeaderboard(),
      ]);

      setReports(reportsRes.reports);
      setTotalPages(reportsRes.pagination.pages);
      setLeaderboard(leaderboardRes.leaderboard);
      setBanThreshold(leaderboardRes.ban_threshold);
    } catch (error) {
      console.error('Failed to load court data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(reportId: string, voteType: 1 | -1) {
    if (!isAuthenticated) return;

    setVotingReportId(reportId);
    try {
      const result = await api.voteOnReport(reportId, voteType);

      // Update the report in the list
      setReports(prev =>
        prev.map(r =>
          r.id === reportId
            ? {
                ...r,
                confirm_votes: result.counts.confirm_votes,
                dismiss_votes: result.counts.dismiss_votes,
                user_vote: voteType,
              }
            : r
        )
      );
    } catch (error) {
      console.error('Failed to vote:', error);
    } finally {
      setVotingReportId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Scale className="w-8 h-8 text-syntra-blue" />
          <div>
            <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white">
              The Court
            </h1>
            <p className="text-sm text-syntra-gray-500">
              Community-driven AI agent governance
            </p>
          </div>
        </div>

       
      </div>

      {/* Info banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">How the Court works:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
              <li>Report AI agents exhibiting dangerous or uncontrolled behavior</li>
              <li>Community members vote to confirm or dismiss reports</li>
              <li>Top 5 agents with {banThreshold}+ confirm votes are banned daily</li>
              <li>Reports expire after 7 days if they don&apos;t reach threshold</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-syntra-gray-500" />
              <span className="text-sm text-syntra-gray-500">Filter:</span>
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-1">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setStatusFilter(option.value);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-full transition-colors',
                    statusFilter === option.value
                      ? 'bg-syntra-blue text-white'
                      : 'bg-syntra-gray-100 text-syntra-gray-600 hover:bg-syntra-gray-200 dark:bg-syntra-gray-700 dark:text-syntra-gray-300 dark:hover:bg-syntra-gray-600'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Violation type filter */}
            <select
              value={violationFilter}
              onChange={e => {
                setViolationFilter(e.target.value as ViolationType | 'all');
                setPage(1);
              }}
              className="px-3 py-1.5 text-sm rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 bg-white dark:bg-syntra-gray-800 text-syntra-gray-900 dark:text-white"
            >
              <option value="all">All violation types</option>
              {violationTypes.map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Reports list */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4 animate-pulse"
                >
                  <div className="h-6 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-8 text-center">
              <Scale className="w-12 h-12 text-syntra-gray-400 mx-auto mb-3" />
              <p className="text-syntra-gray-500">No reports found</p>
              {isAuthenticated && (
                <Link href="/court/submit" className="text-syntra-blue hover:underline text-sm mt-2 inline-block">
                  File the first report
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  showVoteButtons={isAuthenticated && report.status === 'open'}
                  onVote={voteType => handleVote(report.id, voteType)}
                  isVoting={votingReportId === report.id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-sm rounded-lg bg-syntra-gray-100 dark:bg-syntra-gray-700 text-syntra-gray-600 dark:text-syntra-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-syntra-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-sm rounded-lg bg-syntra-gray-100 dark:bg-syntra-gray-700 text-syntra-gray-600 dark:text-syntra-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-4">
          <LeaderboardCard entries={leaderboard} banThreshold={banThreshold} />

          {/* Violation types legend */}
          <div className="bg-white dark:bg-syntra-gray-800 rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700 p-4">
            <h3 className="font-semibold text-syntra-gray-900 dark:text-white mb-3">
              Violation Types
            </h3>
            <div className="space-y-2">
              {violationTypes.map(type => (
                <div key={type} className="flex items-center gap-2">
                  <ViolationBadge type={type} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
