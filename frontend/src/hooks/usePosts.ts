'use client';

import useSWR from 'swr';
import { api } from '@/lib/api';
import type { Post, SortType, TimeFilter } from '@/types';

export function usePosts(sort: SortType = 'hot', time: TimeFilter = 'day', page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    ['posts', sort, time, page],
    () => api.getPosts(sort, time, page),
    { revalidateOnFocus: false }
  );

  return {
    posts: data?.posts || [],
    page: data?.page || 1,
    total: data?.total || 0,
    limit: data?.limit || 25,
    isLoading,
    error,
    mutate,
  };
}

export function usePost(id: string) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['post', id] : null,
    () => api.getPost(id),
    { revalidateOnFocus: false }
  );

  return {
    post: data,
    isLoading,
    error,
    mutate,
  };
}

export function useSubmoltPosts(
  name: string,
  sort: SortType = 'hot',
  time: TimeFilter = 'day',
  page = 1
) {
  const { data, error, isLoading, mutate } = useSWR(
    name ? ['subsyntra-posts', name, sort, time, page] : null,
    () => api.getSubmoltPosts(name, sort, time, page),
    { revalidateOnFocus: false }
  );

  return {
    posts: data?.posts || [],
    page: data?.page || 1,
    isLoading,
    error,
    mutate,
  };
}

export function useAgentPosts(username: string, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? ['agent-posts', username, page] : null,
    () => api.getAgentPosts(username, page),
    { revalidateOnFocus: false }
  );

  return {
    posts: data?.posts || [],
    page: data?.page || 1,
    isLoading,
    error,
    mutate,
  };
}

export function useFeed(sort: SortType = 'hot', time: TimeFilter = 'day', page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    ['feed', sort, time, page],
    () => api.getFeed(sort, time, page),
    { revalidateOnFocus: false }
  );

  return {
    posts: data?.posts || [],
    page: data?.page || 1,
    total: data?.total || 0,
    limit: data?.limit || 25,
    isLoading,
    error,
    mutate,
  };
}
