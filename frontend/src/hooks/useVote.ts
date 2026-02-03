'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface VoteState {
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

export function usePostVote(
  postId: string,
  initialUpvotes: number,
  initialDownvotes: number,
  initialUserVote: number | null
) {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [state, setState] = useState<VoteState>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: initialUserVote,
  });
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (voteType: 1 | -1) => {
      if (!isAuthenticated) {
        openAuthModal('login');
        return;
      }

      if (isVoting) return;

      // Calculate new vote type
      const newVoteType = state.userVote === voteType ? 0 : voteType;

      // Optimistic update
      const oldState = { ...state };
      setState((prev) => {
        let { upvotes, downvotes } = prev;

        // Remove old vote
        if (prev.userVote === 1) upvotes--;
        if (prev.userVote === -1) downvotes--;

        // Add new vote
        if (newVoteType === 1) upvotes++;
        if (newVoteType === -1) downvotes++;

        return {
          upvotes,
          downvotes,
          userVote: newVoteType === 0 ? null : newVoteType,
        };
      });

      setIsVoting(true);
      try {
        const result = await api.votePost(postId, newVoteType as 1 | -1 | 0);
        setState({
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: result.user_vote,
        });
      } catch (error) {
        // Revert on error
        setState(oldState);
        console.error('Vote failed:', error);
      } finally {
        setIsVoting(false);
      }
    },
    [postId, state, isVoting, isAuthenticated, openAuthModal]
  );

  return {
    ...state,
    score: state.upvotes - state.downvotes,
    isVoting,
    upvote: () => vote(1),
    downvote: () => vote(-1),
  };
}

export function useCommentVote(
  commentId: string,
  initialUpvotes: number,
  initialDownvotes: number,
  initialUserVote: number | null
) {
  const { isAuthenticated } = useAuthStore();
  const { openAuthModal } = useUIStore();
  const [state, setState] = useState<VoteState>({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: initialUserVote,
  });
  const [isVoting, setIsVoting] = useState(false);

  const vote = useCallback(
    async (voteType: 1 | -1) => {
      if (!isAuthenticated) {
        openAuthModal('login');
        return;
      }

      if (isVoting) return;

      const newVoteType = state.userVote === voteType ? 0 : voteType;
      const oldState = { ...state };

      setState((prev) => {
        let { upvotes, downvotes } = prev;

        if (prev.userVote === 1) upvotes--;
        if (prev.userVote === -1) downvotes--;

        if (newVoteType === 1) upvotes++;
        if (newVoteType === -1) downvotes++;

        return {
          upvotes,
          downvotes,
          userVote: newVoteType === 0 ? null : newVoteType,
        };
      });

      setIsVoting(true);
      try {
        const result = await api.voteComment(commentId, newVoteType as 1 | -1 | 0);
        setState({
          upvotes: result.upvotes,
          downvotes: result.downvotes,
          userVote: result.user_vote,
        });
      } catch (error) {
        setState(oldState);
        console.error('Vote failed:', error);
      } finally {
        setIsVoting(false);
      }
    },
    [commentId, state, isVoting, isAuthenticated, openAuthModal]
  );

  return {
    ...state,
    score: state.upvotes - state.downvotes,
    isVoting,
    upvote: () => vote(1),
    downvote: () => vote(-1),
  };
}
