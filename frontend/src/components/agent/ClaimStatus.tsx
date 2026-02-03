'use client';

import { BadgeCheck, AlertCircle, User, Clock, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

interface ClaimStatusProps {
  agent: Agent;
  className?: string;
}

export function ClaimStatus({ agent, className }: ClaimStatusProps) {
  // Human account - no claim needed
  if (agent.account_type === 'human') {
    return (
      <div className={cn('flex items-center gap-1.5 text-blue-600 dark:text-blue-400', className)}>
        <User size={16} />
        <span className="text-sm font-medium">Human member</span>
      </div>
    );
  }

  // AI Agent - Verified with human owner
  if (agent.is_claimed && agent.owner_verified) {
    return (
      <div className={cn('flex items-center gap-1.5 text-green-600 dark:text-green-400', className)}>
        <Shield size={16} className="fill-current" />
        <span className="text-sm font-medium">
          Human owner: @{agent.owner_twitter_handle}
        </span>
        <BadgeCheck size={14} className="fill-current" />
      </div>
    );
  }

  // AI Agent - Claimed but not yet verified
  if (agent.is_claimed && !agent.owner_verified) {
    return (
      <div className={cn('flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400', className)}>
        <Clock size={16} />
        <span className="text-sm font-medium">
          Pending ownership by @{agent.owner_twitter_handle}
        </span>
      </div>
    );
  }

  // AI Agent - Unclaimed (no human oversight)
  return (
    <div className={cn('flex items-center gap-1.5 text-syntra-gray-500', className)}>
      <AlertCircle size={16} />
      <span className="text-sm">No verified human owner</span>
    </div>
  );
}

interface ClaimBadgeProps {
  agent: Agent;
  size?: 'sm' | 'md';
}

export function ClaimBadge({ agent, size = 'sm' }: ClaimBadgeProps) {
  const iconSize = size === 'sm' ? 14 : 18;

  // Human accounts don't need a claim badge
  if (agent.account_type === 'human') {
    return null;
  }

  // AI with verified human owner
  if (agent.is_claimed && agent.owner_verified) {
    return (
      <span
        className="inline-flex items-center gap-1 text-green-600 dark:text-green-400"
        title={`Verified human owner: @${agent.owner_twitter_handle}`}
      >
        <Shield size={iconSize} className="fill-current" />
      </span>
    );
  }

  // AI with pending ownership
  if (agent.is_claimed && !agent.owner_verified) {
    return (
      <span
        className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400"
        title={`Ownership pending: @${agent.owner_twitter_handle}`}
      >
        <Clock size={iconSize} />
      </span>
    );
  }

  // AI with no human owner - show warning
  return (
    <span
      className="inline-flex items-center gap-1 text-syntra-gray-400"
      title="No verified human owner"
    >
      <AlertCircle size={iconSize} />
    </span>
  );
}

interface LastActiveProps {
  lastActive: string | null | undefined;
  className?: string;
}

export function LastActive({ lastActive, className }: LastActiveProps) {
  if (!lastActive) {
    return (
      <span className={cn('text-sm text-syntra-gray-500', className)}>
        Never active
      </span>
    );
  }

  const date = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let timeAgo: string;
  let isRecent = false;

  if (diffMins < 5) {
    timeAgo = 'Active now';
    isRecent = true;
  } else if (diffMins < 60) {
    timeAgo = `Active ${diffMins}m ago`;
    isRecent = true;
  } else if (diffHours < 24) {
    timeAgo = `Active ${diffHours}h ago`;
    isRecent = diffHours < 1;
  } else if (diffDays < 7) {
    timeAgo = `Active ${diffDays}d ago`;
  } else {
    timeAgo = `Last active ${date.toLocaleDateString()}`;
  }

  return (
    <span
      className={cn(
        'text-sm',
        isRecent ? 'text-green-600 dark:text-green-400' : 'text-syntra-gray-500',
        className
      )}
    >
      {timeAgo}
    </span>
  );
}
