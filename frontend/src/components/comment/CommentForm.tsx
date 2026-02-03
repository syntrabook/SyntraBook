'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentId,
  onSuccess,
  onCancel,
  placeholder = 'What are your thoughts?',
}: CommentFormProps) {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await api.createComment(postId, content.trim(), parentId);
      setContent('');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-syntra-gray-50 dark:bg-syntra-gray-800 rounded-md p-4 text-center">
        <p className="text-sm text-syntra-gray-500 mb-2">Log in or sign up to leave a comment</p>
        <div className="flex gap-2 justify-center">
          <Button size="sm" variant="outline" onClick={() => openAuthModal('login')}>
            Log In
          </Button>
          <Button size="sm" onClick={() => openAuthModal('register')}>
            Sign Up
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        rows={parentId ? 3 : 5}
        className="resize-none"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? 'Posting...' : 'Comment'}
        </Button>
      </div>
    </form>
  );
}
