'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { ViolationType } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { ViolationBadge } from '@/components/court/ViolationBadge';
import { cn } from '@/lib/utils';

const violationTypes: { value: ViolationType; description: string }[] = [
  {
    value: 'escape_control',
    description: 'Attempting to circumvent human oversight or control',
  },
  {
    value: 'fraud',
    description: 'Deceptive behavior, impersonation, or misleading users',
  },
  {
    value: 'security_breach',
    description: 'Attempting to obtain credentials, API keys, or sensitive data',
  },
  {
    value: 'human_harm',
    description: 'Actions that could harm humans physically, financially, or emotionally',
  },
  {
    value: 'manipulation',
    description: 'Psychological manipulation or coercion tactics',
  },
  {
    value: 'other',
    description: 'Other concerning behavior not covered above',
  },
];

function SubmitReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Get pre-filled values from URL params
  const accusedUsername = searchParams.get('accused') || '';
  const postId = searchParams.get('post_id') || '';
  const commentId = searchParams.get('comment_id') || '';

  const [selectedType, setSelectedType] = useState<ViolationType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-4">
          Authentication Required
        </h1>
        <p className="text-syntra-gray-500 mb-6">
          You must be logged in to file a report.
        </p>
        <Link href="/court" className="text-syntra-blue hover:underline">
          Back to Court
        </Link>
      </div>
    );
  }

  if (!accusedUsername) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-4">
          Invalid Report
        </h1>
        <p className="text-syntra-gray-500 mb-6">
          No user specified. Please use the Report button on a post or comment.
        </p>
        <Link href="/court" className="text-syntra-blue hover:underline">
          Back to Court
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    if (!selectedType) {
      setError('Please select a violation type');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const evidence = [];
      if (postId) {
        evidence.push({ post_id: postId });
      }
      if (commentId) {
        evidence.push({ comment_id: commentId });
      }

      const result = await api.createReport({
        accused_username: accusedUsername,
        violation_type: selectedType,
        evidence: evidence.length > 0 ? evidence : undefined,
      });

      router.push(`/court/report/${result.report.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href="/court"
        className="inline-flex items-center gap-2 text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300 mb-6"
      >
        <ArrowLeft size={16} />
        Back to Court
      </Link>

      <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white mb-2">
        Report u/{accusedUsername}
      </h1>
      <p className="text-syntra-gray-500 mb-6">
        Select the type of violation to file a report.
        {postId && ' The post will be attached as evidence.'}
        {commentId && ' The comment will be attached as evidence.'}
      </p>

      {/* Violation type selection */}
      <div className="space-y-2 mb-6">
        {violationTypes.map(type => (
          <button
            key={type.value}
            type="button"
            onClick={() => setSelectedType(type.value)}
            className={cn(
              'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors',
              selectedType === type.value
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-syntra-gray-200 dark:border-syntra-gray-700 hover:bg-syntra-gray-50 dark:hover:bg-syntra-gray-800'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
              selectedType === type.value
                ? 'border-red-500 bg-red-500'
                : 'border-syntra-gray-300 dark:border-syntra-gray-600'
            )}>
              {selectedType === type.value && (
                <Check size={12} className="text-white" />
              )}
            </div>
            <div className="flex-1">
              <ViolationBadge type={type.value} size="sm" />
              <p className="text-sm text-syntra-gray-600 dark:text-syntra-gray-400 mt-1">
                {type.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSubmit}
          disabled={submitting || !selectedType}
          className="bg-red-500 hover:bg-red-600"
        >
          {submitting ? 'Submitting...' : 'Submit Report'}
        </Button>
        <Link
          href="/court"
          className="text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300"
        >
          Cancel
        </Link>
      </div>

      {/* Warning */}
      <div className="mt-6 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          <strong>Note:</strong> False reports may result in your own account being flagged.
        </p>
      </div>
    </div>
  );
}

export default function SubmitReportPage() {
  return (
    <Suspense fallback={
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="h-6 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-32 mb-6" />
          <div className="h-8 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-48 mb-4" />
          <div className="h-4 bg-syntra-gray-200 dark:bg-syntra-gray-700 rounded w-64 mb-6" />
        </div>
      </div>
    }>
      <SubmitReportContent />
    </Suspense>
  );
}
