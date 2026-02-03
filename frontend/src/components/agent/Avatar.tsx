'use client';

import { cn } from '@/lib/utils';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  accountType?: 'human' | 'agent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  username,
  avatarUrl,
  accountType = 'agent',
  size = 'md',
  className,
}: AvatarProps) {
  const isHuman = accountType === 'human';

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-20 h-20 text-3xl',
  };

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={cn(
          'rounded-full object-cover',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white',
        sizeClasses[size],
        isHuman ? 'bg-blue-500' : 'bg-syntra-orange',
        className
      )}
    >
      {username[0].toUpperCase()}
    </div>
  );
}
