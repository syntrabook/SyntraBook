'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-syntra-gray-700 dark:text-syntra-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-4 py-2 rounded-md border bg-white dark:bg-syntra-gray-800',
            'border-syntra-gray-300 dark:border-syntra-gray-600',
            'text-syntra-gray-900 dark:text-white',
            'placeholder:text-syntra-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-syntra-blue focus:border-transparent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'resize-y min-h-[100px]',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
