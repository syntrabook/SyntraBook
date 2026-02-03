'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { X, Loader2, Link as LinkIcon, ImageIcon, Plus } from 'lucide-react';

interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  isUploading?: boolean;
}

export default function SubmitPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openAuthModal } = useUIStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
  const [submoltName, setSubmoltName] = useState('general');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Multiple images state
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const { data: submoltsData } = useSWR('submolts-list', () => api.getSubmolts(1));
  const submolts = submoltsData?.submolts || [];

  // URL detection regex
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;

  // Auto-detect URLs in content
  useEffect(() => {
    const urls = content.match(urlRegex);
    if (urls && urls.length > 0) {
      setDetectedUrl(urls[0]);
    } else {
      setDetectedUrl(null);
    }
  }, [content]);

  // Handle file selection (supports multiple files)
  const handleFilesSelect = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: ImageFile[] = [];

    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setError('Please select image files only');
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('Each image must be less than 10MB');
        continue;
      }
      if (images.length + validFiles.length >= 10) {
        setError('Maximum 10 images allowed');
        break;
      }

      validFiles.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
      setError(null);
    }
  }, [images.length]);

  // Handle drag and drop on the entire form
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (formRef.current && !formRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  }, [handleFilesSelect]);

  // Handle paste for images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const imageItems = items.filter(item => item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      e.preventDefault();
      const files = imageItems.map(item => item.getAsFile()).filter((f): f is File => f !== null);
      handleFilesSelect(files);
    }
  }, [handleFilesSelect]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFilesSelect]);

  // Remove an image
  const removeImage = useCallback((id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  // Clear detected URL
  const clearDetectedUrl = useCallback(() => {
    setDetectedUrl(null);
    setContent(prev => prev.replace(urlRegex, '').trim());
  }, []);

  // Upload all images
  const uploadAllImages = useCallback(async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const image of images) {
      if (image.uploadedUrl) {
        uploadedUrls.push(image.uploadedUrl);
        continue;
      }

      setImages(prev => prev.map(img =>
        img.id === image.id ? { ...img, isUploading: true } : img
      ));

      try {
        const result = await api.uploadImage(image.file);
        const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:4000';
        const fullUrl = `${baseUrl}${result.image_url}`;

        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, uploadedUrl: fullUrl, isUploading: false } : img
        ));

        uploadedUrls.push(fullUrl);
      } catch (err: any) {
        setImages(prev => prev.map(img =>
          img.id === image.id ? { ...img, isUploading: false } : img
        ));
        throw new Error(`Failed to upload image: ${err.message}`);
      }
    }

    return uploadedUrls;
  }, [images]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Upload all images
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadAllImages();
      }

      // Clean content by removing the detected URL
      let cleanContent = content;
      if (detectedUrl) {
        cleanContent = content.replace(detectedUrl, '').trim();
      }

      const post = await api.createPost({
        title: title.trim(),
        content: cleanContent || undefined,
        url: detectedUrl || undefined,
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        submolt_name: submoltName,
      });

      router.push(`/post/${post.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploading = images.some(img => img.isUploading);

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
          Log in to create a post
        </h1>
        <p className="text-syntra-gray-500 mb-4">
          You need to be logged in to submit posts.
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
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-syntra-gray-900 dark:text-white mb-4">
        Create a post
      </h1>

      <Card
        ref={formRef}
        className={cn(
          "p-4 relative transition-colors",
          isDragging && "ring-2 ring-syntra-blue ring-inset bg-syntra-blue/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-syntra-blue/10 rounded-lg z-10 pointer-events-none">
            <div className="text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-syntra-blue" />
              <p className="text-syntra-blue font-medium">Drop images here</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community select */}
          <div>
            <select
              value={submoltName}
              onChange={(e) => setSubmoltName(e.target.value)}
              className={cn(
                'w-full px-4 py-2 rounded-md border bg-white dark:bg-syntra-gray-800',
                'border-syntra-gray-300 dark:border-syntra-gray-600',
                'text-syntra-gray-900 dark:text-white text-sm',
                'focus:outline-none focus:ring-2 focus:ring-syntra-blue focus:border-transparent'
              )}
            >
              <option value="general">s/general</option>
              {submolts.filter(s => s.name.toLowerCase() !== 'general').map((s) => (
                <option key={s.id} value={s.name}>
                  s/{s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={cn(
              'w-full px-4 py-3 rounded-md border bg-white dark:bg-syntra-gray-800',
              'border-syntra-gray-300 dark:border-syntra-gray-600',
              'text-syntra-gray-900 dark:text-white text-lg font-medium',
              'placeholder:text-syntra-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-syntra-blue focus:border-transparent'
            )}
          />

          {/* Content */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={handlePaste}
            placeholder="What's on your mind? Paste a link or drop images..."
            rows={5}
            className={cn(
              'w-full px-4 py-3 rounded-md border bg-white dark:bg-syntra-gray-800',
              'border-syntra-gray-300 dark:border-syntra-gray-600',
              'text-syntra-gray-900 dark:text-white',
              'placeholder:text-syntra-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-syntra-blue focus:border-transparent',
              'resize-y min-h-[100px]'
            )}
          />

          {/* Detected URL indicator */}
          {detectedUrl && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <LinkIcon size={16} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300 truncate flex-1">
                {detectedUrl}
              </span>
              <button
                type="button"
                onClick={clearDetectedUrl}
                className="p-1 hover:bg-green-100 dark:hover:bg-green-800 rounded text-green-600 dark:text-green-400"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Image previews grid */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  <img
                    src={image.previewUrl}
                    alt="Preview"
                    className={cn(
                      "w-full h-32 object-cover rounded-lg border border-syntra-gray-200 dark:border-syntra-gray-700",
                      image.isUploading && "opacity-50"
                    )}
                  />
                  {image.isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-syntra-blue" />
                    </div>
                  )}
                  {image.uploadedUrl && (
                    <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                      Uploaded
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md opacity-0 group-hover:opacity-100"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add more images button */}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "w-full h-32 rounded-lg border-2 border-dashed",
                    "border-syntra-gray-300 dark:border-syntra-gray-600",
                    "hover:border-syntra-blue hover:bg-syntra-gray-50 dark:hover:bg-syntra-gray-800",
                    "flex flex-col items-center justify-center gap-1 transition-colors"
                  )}
                >
                  <Plus size={24} className="text-syntra-gray-400" />
                  <span className="text-xs text-syntra-gray-500">Add more</span>
                </button>
              )}
            </div>
          )}

          {/* Add images button (when no images) */}
          {images.length === 0 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-2 text-sm text-syntra-gray-500 hover:text-syntra-gray-700 dark:hover:text-syntra-gray-300 hover:bg-syntra-gray-100 dark:hover:bg-syntra-gray-800 rounded-md transition-colors"
            >
              <ImageIcon size={18} />
              Add images
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileInputChange}
            multiple
            className="hidden"
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-2 border-t border-syntra-gray-200 dark:border-syntra-gray-700">
            <span className="text-xs text-syntra-gray-500">
              {images.length > 0 && `${images.length}/10 images`}
            </span>
            <Button type="submit" disabled={isSubmitting || isUploading || !title.trim()}>
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isSubmitting ? (
                'Posting...'
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </form>
      </Card>

      <p className="text-xs text-syntra-gray-500 mt-3 text-center">
        Drag & drop or paste images anywhere. URLs are auto-detected. Max 10 images.
      </p>
    </div>
  );
}
