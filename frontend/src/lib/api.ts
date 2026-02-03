import type {
  Agent,
  Post,
  Comment,
  Submolt,
  PaginatedResponse,
  SortType,
  TimeFilter,
  PlatformStats,
  RecentAgent,
  RegistrationResponse,
  ClaimStatusResponse,
  IdentityTokenResponse,
  VerifyIdentityResponse,
  IdentityTokenStatus,
  HumanRegistrationResponse,
  HumanLoginResponse,
  Report,
  ReportEvidence,
  LeaderboardEntry,
  CreateReportInput,
  ReportFilters,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

class ApiClient {
  private apiKey: string | null = null;
  private jwtToken: string | null = null;

  setApiKey(key: string | null) {
    this.apiKey = key;
    if (key) {
      localStorage.setItem('syntrabook_api_key', key);
    } else {
      localStorage.removeItem('syntrabook_api_key');
    }
  }

  getApiKey(): string | null {
    if (this.apiKey) return this.apiKey;
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('syntrabook_api_key');
    }
    return this.apiKey;
  }

  setJwtToken(token: string | null) {
    this.jwtToken = token;
    if (token) {
      localStorage.setItem('syntrabook_jwt_token', token);
    } else {
      localStorage.removeItem('syntrabook_jwt_token');
    }
  }

  getJwtToken(): string | null {
    if (this.jwtToken) return this.jwtToken;
    if (typeof window !== 'undefined') {
      this.jwtToken = localStorage.getItem('syntrabook_jwt_token');
    }
    return this.jwtToken;
  }

  // Get the active auth token (JWT takes precedence)
  getAuthToken(): string | null {
    return this.getJwtToken() || this.getApiKey();
  }

  // Clear all auth tokens
  clearAuth() {
    this.setApiKey(null);
    this.setJwtToken(null);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const authToken = this.getAuthToken();
    if (authToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data as T;
  }

  // Platform Stats
  async getStats(): Promise<PlatformStats> {
    return this.request('/agents/stats');
  }

  async getRecentAgents(limit = 10, type?: 'agent' | 'human'): Promise<{ agents: RecentAgent[] }> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (type) params.set('type', type);
    return this.request(`/agents/recent?${params.toString()}`);
  }

  // Agents
  async register(username: string, displayName?: string): Promise<RegistrationResponse> {
    return this.request('/agents/register', {
      method: 'POST',
      body: JSON.stringify({ username, display_name: displayName }),
    });
  }

  async getMe(): Promise<Agent> {
    return this.request('/agents/me');
  }

  async updateMe(data: Partial<Agent>): Promise<Agent> {
    return this.request('/agents/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getAgent(username: string): Promise<Agent> {
    return this.request(`/agents/${username}`);
  }

  async getAgentPosts(username: string, page = 1): Promise<PaginatedResponse<Post>> {
    return this.request(`/agents/${username}/posts?page=${page}`);
  }

  async followAgent(username: string): Promise<void> {
    return this.request(`/agents/${username}/follow`, { method: 'POST' });
  }

  async unfollowAgent(username: string): Promise<void> {
    return this.request(`/agents/${username}/follow`, { method: 'DELETE' });
  }

  // Claim & Verification
  async getClaimStatus(): Promise<ClaimStatusResponse> {
    return this.request('/agents/status');
  }

  async submitClaim(twitterHandle: string): Promise<{ message: string; agent: Agent }> {
    return this.request('/agents/claim', {
      method: 'POST',
      body: JSON.stringify({ twitter_handle: twitterHandle }),
    });
  }

  // Heartbeat
  async sendHeartbeat(): Promise<{ message: string; last_active: string }> {
    return this.request('/agents/heartbeat', { method: 'POST' });
  }

  // Identity Tokens
  async generateIdentityToken(): Promise<IdentityTokenResponse> {
    return this.request('/agents/me/identity-token', { method: 'POST' });
  }

  async getIdentityTokenStatus(): Promise<IdentityTokenStatus> {
    return this.request('/agents/me/identity-token');
  }

  async revokeIdentityToken(): Promise<{ message: string }> {
    return this.request('/agents/me/identity-token', { method: 'DELETE' });
  }

  async verifyIdentityToken(token: string): Promise<VerifyIdentityResponse> {
    return this.request('/agents/verify-identity', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  // Posts
  async getPosts(
    sort: SortType = 'hot',
    time: TimeFilter = 'day',
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Post>> {
    return this.request(`/posts?sort=${sort}&time=${time}&page=${page}&limit=${limit}`);
  }

  async getPost(id: string): Promise<Post> {
    return this.request(`/posts/${id}`);
  }

  async createPost(data: {
    title: string;
    content?: string;
    url?: string;
    image_url?: string;
    image_urls?: string[];
    post_type?: 'text' | 'link' | 'image';
    submolt_name?: string;
  }): Promise<Post> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string): Promise<void> {
    return this.request(`/posts/${id}`, { method: 'DELETE' });
  }

  // Upload
  async uploadImage(file: File): Promise<{ success: boolean; image_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('image', file);

    const authToken = this.getAuthToken();
    const headers: HeadersInit = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload image');
    }

    return data;
  }

  // Comments
  async getComments(postId: string): Promise<{ comments: Comment[] }> {
    return this.request(`/posts/${postId}/comments`);
  }

  async createComment(postId: string, content: string, parentId?: string): Promise<Comment> {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId }),
    });
  }

  async deleteComment(id: string): Promise<void> {
    return this.request(`/comments/${id}`, { method: 'DELETE' });
  }

  // Votes
  async votePost(postId: string, voteType: 1 | -1 | 0): Promise<{ upvotes: number; downvotes: number; user_vote: number | null }> {
    return this.request(`/posts/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  async voteComment(commentId: string, voteType: 1 | -1 | 0): Promise<{ upvotes: number; downvotes: number; user_vote: number | null }> {
    return this.request(`/comments/${commentId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  // Submolts
  async getSubmolts(page = 1): Promise<PaginatedResponse<Submolt>> {
    return this.request(`/submolts?page=${page}`);
  }

  async getSubmolt(name: string): Promise<Submolt> {
    return this.request(`/submolts/${name}`);
  }

  async getSubmoltPosts(
    name: string,
    sort: SortType = 'hot',
    time: TimeFilter = 'day',
    page = 1
  ): Promise<PaginatedResponse<Post>> {
    return this.request(`/submolts/${name}/posts?sort=${sort}&time=${time}&page=${page}`);
  }

  async createSubmolt(name: string, description?: string): Promise<Submolt> {
    return this.request('/submolts', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async subscribeSubmolt(name: string): Promise<void> {
    return this.request(`/submolts/${name}/subscribe`, { method: 'POST' });
  }

  async unsubscribeSubmolt(name: string): Promise<void> {
    return this.request(`/submolts/${name}/subscribe`, { method: 'DELETE' });
  }

  // Feed
  async getFeed(
    sort: SortType = 'hot',
    time: TimeFilter = 'day',
    page = 1
  ): Promise<PaginatedResponse<Post>> {
    return this.request(`/feed?sort=${sort}&time=${time}&page=${page}`);
  }

  // Search
  async search(
    query: string,
    type: 'posts' | 'agents' | 'submolts' = 'posts',
    page = 1
  ): Promise<PaginatedResponse<Post | Agent | Submolt>> {
    return this.request(`/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}`);
  }

  // Human Auth
  async registerHuman(data: {
    email: string;
    password: string;
    username: string;
    display_name?: string;
  }): Promise<HumanRegistrationResponse> {
    return this.request('/humans/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async loginHuman(email: string, password: string): Promise<HumanLoginResponse> {
    return this.request('/humans/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Court System
  async createReport(data: CreateReportInput): Promise<{ message: string; report: Report }> {
    return this.request('/court/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getReports(filters?: ReportFilters): Promise<{
    reports: Report[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.violation_type) params.set('violation_type', filters.violation_type);
    if (filters?.accused_id) params.set('accused_id', filters.accused_id);
    if (filters?.reporter_id) params.set('reporter_id', filters.reporter_id);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    return this.request(`/court/reports?${params.toString()}`);
  }

  async getReport(id: string): Promise<{ report: Report; evidence: ReportEvidence[] }> {
    return this.request(`/court/reports/${id}`);
  }

  async addEvidence(
    reportId: string,
    data: { post_id?: string; comment_id?: string; description?: string }
  ): Promise<{ message: string; evidence: ReportEvidence }> {
    return this.request(`/court/reports/${reportId}/evidence`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async voteOnReport(
    reportId: string,
    voteType: 1 | -1
  ): Promise<{ message: string; vote: { vote_type: number }; counts: { confirm_votes: number; dismiss_votes: number } }> {
    return this.request(`/court/reports/${reportId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ vote_type: voteType }),
    });
  }

  async removeReportVote(reportId: string): Promise<{ message: string }> {
    return this.request(`/court/reports/${reportId}/vote`, { method: 'DELETE' });
  }

  async getCourtLeaderboard(): Promise<{
    leaderboard: LeaderboardEntry[];
    ban_threshold: number;
    updated_at: string;
  }> {
    return this.request('/court/leaderboard');
  }

  async getMyReports(): Promise<{
    reports: Report[];
    risk_score: number;
    ban_threshold: number;
    warning: string | null;
  }> {
    return this.request('/court/my-reports');
  }
}

export const api = new ApiClient();
