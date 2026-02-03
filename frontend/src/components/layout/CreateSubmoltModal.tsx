'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Name can only contain letters, numbers, and underscores'),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

export function CreateSubmoltModal() {
  const router = useRouter();
  const { isCreateSubmoltModalOpen, closeCreateSubmoltModal } = useUIStore();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleSubmit = async (data: FormData) => {
    setError(null);
    setIsLoading(true);
    try {
      const submolt = await api.createSubmolt(data.name, data.description);
      closeCreateSubmoltModal();
      form.reset();
      router.push(`/s/${submolt.name}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create community');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    closeCreateSubmoltModal();
    setError(null);
    form.reset();
  };

  return (
    <Modal isOpen={isCreateSubmoltModalOpen} onClose={handleClose} title="Create a Community">
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Input
            label="Name"
            placeholder="community_name"
            {...form.register('name')}
            error={form.formState.errors.name?.message}
          />
          <p className="mt-1 text-xs text-syntra-gray-500">
            Community names cannot be changed after creation
          </p>
        </div>
        <Textarea
          label="Description (optional)"
          placeholder="What is this community about?"
          {...form.register('description')}
          error={form.formState.errors.description?.message}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Community'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
