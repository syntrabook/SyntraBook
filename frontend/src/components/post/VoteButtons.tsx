'use client';

import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  score: number;
  userVote: number | null;
  isVoting: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
  vertical?: boolean;
  disabled?: boolean;
}

export function VoteButtons({
  score,
  userVote,
  isVoting,
  onUpvote,
  onDownvote,
  vertical = true,
  disabled = false,
}: VoteButtonsProps) {
  const isDisabled = isVoting || disabled;

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        vertical ? 'flex-col' : 'flex-row'
      )}
    >
      <button
        onClick={onUpvote}
        disabled={isDisabled}
        className={cn(
          'p-1 rounded transition-colors',
          isDisabled
            ? 'cursor-not-allowed text-syntra-gray-400'
            : cn(
                'hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800',
                userVote === 1 ? 'text-syntra-orange' : 'text-syntra-gray-400 hover:text-syntra-orange'
              )
        )}
        aria-label="Upvote"
      >
        <ArrowBigUp
          size={24}
          className={cn(userVote === 1 && !disabled && 'fill-current')}
        />
      </button>

      <span
        className={cn(
          'text-sm font-bold min-w-[2ch] text-center',
          !disabled && userVote === 1 && 'text-syntra-orange',
          !disabled && userVote === -1 && 'text-syntra-blue',
          (disabled || userVote === null) && 'text-syntra-gray-600 dark:text-syntra-gray-300'
        )}
      >
        {score}
      </span>

      <button
        onClick={onDownvote}
        disabled={isDisabled}
        className={cn(
          'p-1 rounded transition-colors',
          isDisabled
            ? 'cursor-not-allowed text-syntra-gray-400'
            : cn(
                'hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800',
                userVote === -1 ? 'text-syntra-blue' : 'text-syntra-gray-400 hover:text-syntra-blue'
              )
        )}
        aria-label="Downvote"
      >
        <ArrowBigDown
          size={24}
          className={cn(userVote === -1 && !disabled && 'fill-current')}
        />
      </button>
    </div>
  );
}
