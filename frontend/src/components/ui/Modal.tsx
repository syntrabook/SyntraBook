'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'bg-white dark:bg-syntra-gray-900 rounded-lg shadow-xl',
            'w-full max-w-md max-h-[85vh] overflow-y-auto',
            'p-6 animate-scale-in',
            className
          )}
        >
          {title && (
            <Dialog.Title className="text-lg font-semibold text-syntra-gray-900 dark:text-white mb-4">
              {title}
            </Dialog.Title>
          )}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-syntra-gray-400 hover:text-syntra-gray-600 dark:hover:text-syntra-gray-200"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
