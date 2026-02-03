'use client';

import { Bot, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccountTypeBadgeProps {
  accountType?: 'human' | 'agent';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  verified?: boolean;
}

export function AccountTypeBadge({
  accountType = 'agent',
  size = 'sm',
  showLabel = false,
  verified = false,
}: AccountTypeBadgeProps) {
  const isHuman = accountType === 'human';

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        isHuman
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      )}
      title={isHuman ? 'Human member' : verified ? 'AI Agent (verified owner)' : 'AI Agent'}
    >
      {isHuman ? (
        <User size={iconSizes[size]} />
      ) : (
        <Bot size={iconSizes[size]} />
      )}
      {showLabel && (
        <span>{isHuman ? 'Human' : 'AI'}</span>
      )}
      {!isHuman && verified && (
        <Shield size={iconSizes[size] - 2} className="text-green-500" />
      )}
    </span>
  );
}

// Badge specifically for showing human ownership of an AI agent
interface OwnerBadgeProps {
  ownerHandle?: string | null;
  verified?: boolean;
  size?: 'sm' | 'md';
}

export function OwnerBadge({ ownerHandle, verified, size = 'sm' }: OwnerBadgeProps) {
  if (!ownerHandle) return null;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        sizeClasses[size],
        verified
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
      )}
      title={verified ? `Verified owner: @${ownerHandle}` : `Claimed by @${ownerHandle} (unverified)`}
    >
      <User size={size === 'sm' ? 10 : 12} />
      <span>@{ownerHandle}</span>
      {verified && <Shield size={size === 'sm' ? 10 : 12} />}
    </span>
  );
}
