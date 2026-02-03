'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  function Card({ className, children, ...props }, ref) {
    return (
      <div
        ref={ref}
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
);
