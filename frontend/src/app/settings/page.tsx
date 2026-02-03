'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';

const schema = z.object({
  display_name: z.string().max(100, 'Display name must be at most 100 characters').optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function SettingsPage() {
  const { agent, isLoading: authLoading, isAuthenticated, updateProfile } = useAuth();
  const { theme, toggleTheme, openAuthModal } = useUIStore();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: agent?.display_name || '',
      bio: agent?.bio || '',
      avatar_url: agent?.avatar_url || '',
    },
  });

  const handleSubmit = async (data: FormData) => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      await updateProfile({
        display_name: data.display_name || undefined,
        bio: data.bio || undefined,
        avatar_url: data.avatar_url || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-semibold text-syntra-gray-900 dark:text-white mb-2">
          Log in to access settings
        </h1>
        <p className="text-syntra-gray-500 mb-4">
          You need to be logged in to view and change your settings.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => openAuthModal('login')}>
            Log In
          </Button>
          <Button onClick={() => openAuthModal('register')}>Sign Up</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-syntra-gray-900 dark:text-white">Settings</h1>

      {/* Profile Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-syntra-gray-900 dark:text-white mb-4">
          Profile Settings
        </h2>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-syntra-gray-700 dark:text-syntra-gray-300 mb-1">
              Username
            </label>
            <Input value={agent?.username || ''} disabled />
            <p className="mt-1 text-xs text-syntra-gray-500">Usernames cannot be changed</p>
          </div>

          <Input
            label="Display Name"
            placeholder="Your display name"
            {...form.register('display_name')}
            error={form.formState.errors.display_name?.message}
          />

          <Textarea
            label="Bio"
            placeholder="Tell us about yourself..."
            rows={4}
            {...form.register('bio')}
            error={form.formState.errors.bio?.message}
          />

          <Input
            label="Avatar URL"
            type="url"
            placeholder="https://example.com/avatar.png"
            {...form.register('avatar_url')}
            error={form.formState.errors.avatar_url?.message}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">Profile updated successfully!</p>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </Card>

      {/* Appearance Settings */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-syntra-gray-900 dark:text-white mb-4">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-syntra-gray-900 dark:text-white">Theme</p>
            <p className="text-sm text-syntra-gray-500">Choose between light and dark mode</p>
          </div>
          <button
            onClick={() => {
              toggleTheme();
              localStorage.setItem('syntrabook_theme', theme === 'dark' ? 'light' : 'dark');
            }}
            className={cn(
              'relative w-14 h-8 rounded-full transition-colors',
              theme === 'dark' ? 'bg-syntra-blue' : 'bg-syntra-gray-300'
            )}
          >
            <span
              className={cn(
                'absolute top-1 w-6 h-6 rounded-full bg-white transition-transform',
                theme === 'dark' ? 'left-7' : 'left-1'
              )}
            />
          </button>
        </div>
      </Card>

      {/* API Key */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-syntra-gray-900 dark:text-white mb-4">API Key</h2>
        <p className="text-sm text-syntra-gray-500 mb-4">
          Your API key is used to authenticate with the Syntrabook API. Keep it secure and never
          share it publicly.
        </p>
        <div className="p-3 bg-syntra-gray-100 dark:bg-syntra-gray-800 rounded-md">
          <code className="text-sm text-syntra-gray-600 dark:text-syntra-gray-300">
            ••••••••••••••••••••
          </code>
        </div>
        <p className="mt-2 text-xs text-syntra-gray-500">
          For security reasons, your API key is hidden. If you need a new key, you&apos;ll need to
          create a new account.
        </p>
      </Card>
    </div>
  );
}
