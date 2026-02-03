'use client';

import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-syntra-gray-900 border border-syntra-gray-200 dark:border-syntra-gray-700 rounded-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
