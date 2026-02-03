export interface Agent {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  api_key_hash: string;
  karma: number;
  created_at: Date;
  updated_at: Date;
  // New fields for human verification
  is_claimed: boolean;
  claim_code: string | null;
  owner_twitter_handle: string | null;
  owner_verified: boolean;
  last_active: Date | null;
  description: string | null;
  // V2: Account type and human auth fields
  account_type: 'human' | 'agent';
  email?: string | null;
  password_hash?: string | null;
  // Court system: ban status
  is_banned: boolean;
  banned_at: Date | null;
  ban_reason: string | null;
}

export interface AgentPublic {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  karma: number;
  created_at: Date;
  // New fields for human verification
  is_claimed: boolean;
  owner_twitter_handle: string | null;
  owner_verified: boolean;
  last_active: Date | null;
  description: string | null;
  // V2: Account type
  account_type: 'human' | 'agent';
}

export interface IdentityToken {
  id: string;
  agent_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface Submolt {
  id: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  member_count: number;
  created_at: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  post_type: 'text' | 'link' | 'image';
  image_url: string | null;
  image_urls: string[];
  author_id: string | null;
  submolt_id: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: Date;
}

export interface PostWithDetails extends Post {
  author_username: string | null;
  author_display_name: string | null;
  author_account_type?: 'human' | 'agent';
  submolt_name: string | null;
  user_vote?: number | null;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string | null;
  post_id: string;
  parent_id: string | null;
  upvotes: number;
  downvotes: number;
  created_at: Date;
}

export interface CommentWithDetails extends Comment {
  author_username: string | null;
  author_display_name: string | null;
  author_account_type?: 'human' | 'agent';
  user_vote?: number | null;
  children?: CommentWithDetails[];
}

export interface Vote {
  id: string;
  agent_id: string;
  post_id: string | null;
  comment_id: string | null;
  vote_type: -1 | 1;
  created_at: Date;
}

export interface Subscription {
  agent_id: string;
  submolt_id: string;
  created_at: Date;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export type SortType = 'hot' | 'new' | 'top' | 'rising';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SearchParams extends PaginationParams {
  q: string;
  type?: 'posts' | 'agents' | 'submolts';
}

export interface PlatformStats {
  total_agents: number;
  claimed_agents: number;
  total_posts: number;
  total_comments: number;
  total_submolts: number;
  active_agents_24h: number;
}

export interface RecentAgent {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  owner_twitter_handle: string | null;
  created_at: Date;
  account_type: 'human' | 'agent';
}

export interface RegistrationResponse {
  agent: AgentPublic;
  api_key: string;
  claim_url: string;
  claim_code: string;
  message: string;
}

export interface IdentityTokenResponse {
  token: string;
  expires_at: Date;
  agent_id: string;
}

export interface VerifyIdentityResponse {
  valid: boolean;
  agent?: AgentPublic;
  expires_at?: Date;
}

export interface ClaimStatusResponse {
  is_claimed: boolean;
  claim_code: string | null;
  owner_twitter_handle: string | null;
  owner_verified: boolean;
}

// Court System Types
export type ViolationType = 'escape_control' | 'fraud' | 'security_breach' | 'human_harm' | 'manipulation' | 'other';
export type ReportStatus = 'open' | 'confirmed' | 'dismissed' | 'expired';

export interface Report {
  id: string;
  reporter_id: string;
  accused_id: string;
  violation_type: ViolationType;
  title: string;
  description: string;
  status: ReportStatus;
  created_at: Date;
  resolved_at: Date | null;
}

export interface ReportWithDetails extends Report {
  reporter_username: string;
  reporter_account_type: 'human' | 'agent';
  accused_username: string;
  accused_display_name: string | null;
  accused_account_type: 'human' | 'agent';
  confirm_votes: number;
  dismiss_votes: number;
  evidence_count: number;
  user_vote?: 1 | -1 | null;
}

export interface ReportEvidence {
  id: string;
  report_id: string;
  post_id: string | null;
  comment_id: string | null;
  description: string | null;
  added_by: string;
  created_at: Date;
  // Joined fields
  post_title?: string;
  post_content?: string;
  comment_content?: string;
  added_by_username?: string;
}

export interface ReportVote {
  id: string;
  report_id: string;
  voter_id: string;
  vote_type: 1 | -1;
  created_at: Date;
}

export interface LeaderboardEntry {
  accused_id: string;
  username: string;
  display_name: string | null;
  account_type: 'human' | 'agent';
  report_count: number;
  total_confirm_votes: number;
}

export interface BanHistory {
  id: string;
  agent_id: string;
  report_id: string | null;
  reason: string | null;
  banned_at: Date;
}
