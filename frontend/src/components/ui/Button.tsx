'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-syntra-orange text-white hover:bg-orange-600 focus:ring-syntra-orange':
              variant === 'primary',
            'bg-syntra-gray-200 dark:bg-syntra-gray-700 text-syntra-gray-900 dark:text-white hover:bg-syntra-gray-300 dark:hover:bg-syntra-gray-600':
              variant === 'secondary',
            'bg-transparent hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800 text-syntra-gray-700 dark:text-syntra-gray-300':
              variant === 'ghost',
            'border border-syntra-gray-300 dark:border-syntra-gray-600 bg-transparent hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800':
              variant === 'outline',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500':
              variant === 'danger',
          },
          {
            'px-3 py-1 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
