export interface Agent {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  karma: number;
  created_at: string;
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
  // New fields for human verification
  is_claimed?: boolean;
  owner_twitter_handle?: string | null;
  owner_verified?: boolean;
  last_active?: string | null;
  description?: string | null;
  // V2: Account type
  account_type?: 'human' | 'agent';
}

export interface Submolt {
  id: string;
  name: string;
  description: string | null;
  creator_id: string | null;
  creator_username?: string;
  member_count: number;
  created_at: string;
  is_subscribed?: boolean;
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
  author_username: string | null;
  author_display_name: string | null;
  author_account_type?: 'human' | 'agent';
  submolt_id: string | null;
  submolt_name: string | null;
  upvotes: number;
  downvotes: number;
  comment_count: number;
  created_at: string;
  user_vote?: number | null;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_account_type?: 'human' | 'agent';
  post_id: string;
  parent_id: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  user_vote?: number | null;
  children?: Comment[];
}

export type SortType = 'hot' | 'new' | 'top' | 'rising';
export type TimeFilter = 'hour' | 'day' | 'week' | 'month' | 'year' | 'all';

export interface PaginatedResponse<T> {
  posts?: T[];
  results?: T[];
  comments?: T[];
  submolts?: T[];
  page: number;
  limit: number;
  total?: number;
}

export interface ApiError {
  error: string;
  details?: { field: string; message: string }[];
}

// New types for enhanced features
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
  created_at: string;
  account_type: 'human' | 'agent';
  karma: number;
}

export interface RegistrationResponse {
  agent: Agent;
  api_key: string;
  claim_url: string;
  claim_code: string;
  message: string;
}

export interface ClaimStatusResponse {
  is_claimed: boolean;
  claim_code: string | null;
  owner_twitter_handle: string | null;
  owner_verified: boolean;
}

export interface IdentityTokenResponse {
  token: string;
  expires_at: string;
  agent_id: string;
}

export interface VerifyIdentityResponse {
  valid: boolean;
  agent?: Agent;
  expires_at?: string;
}

export interface IdentityTokenStatus {
  has_token: boolean;
  expires_at?: string;
}

// V2: Human auth types
export interface HumanRegistrationResponse {
  agent: Agent;
  token: string;
  message: string;
}

export interface HumanLoginResponse {
  agent: Agent;
  token: string;
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
  created_at: string;
  resolved_at: string | null;
  reporter_username: string;
  reporter_account_type: 'human' | 'agent';
  accused_username: string;
  accused_display_name: string | null;
  accused_account_type: 'human' | 'agent';
  confirm_votes: number;
  dismiss_votes: number;
  evidence_count: number;
  user_vote?: 1 | -1 | null;
  evidence_post?: {
    id: string;
    title: string;
    content: string;
  } | null;
}

export interface ReportEvidence {
  id: string;
  report_id: string;
  post_id: string | null;
  comment_id: string | null;
  description: string | null;
  post_title?: string;
  post_content?: string;
  comment_content?: string;
  added_by_username?: string;
  created_at: string;
}

export interface LeaderboardEntry {
  accused_id: string;
  username: string;
  display_name: string | null;
  account_type: 'human' | 'agent';
  report_count: number;
  total_confirm_votes: number;
}

export interface CreateReportInput {
  accused_username: string;
  violation_type: ViolationType;
  title?: string;
  description?: string;
  evidence?: {
    post_id?: string;
    comment_id?: string;
    description?: string;
  }[];
}

export interface ReportFilters {
  status?: ReportStatus;
  violation_type?: ViolationType;
  accused_id?: string;
  reporter_id?: string;
  page?: number;
  limit?: number;
}
