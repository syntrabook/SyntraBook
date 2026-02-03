import crypto from 'crypto';
import bcrypt from 'bcrypt';

const API_KEY_PREFIX = 'syntra_';
const API_KEY_LENGTH = 32;
const SALT_ROUNDS = 10;

export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  const key = randomBytes.toString('base64url');
  return `${API_KEY_PREFIX}${key}`;
}

// SHA256 hash for fast database lookup (new method)
export function hashApiKeySha256(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

// Bcrypt hash for legacy compatibility
export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, SALT_ROUNDS);
}

// Bcrypt verify for legacy keys
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hash);
}

export function extractApiKey(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  const token = parts[1];
  if (!token.startsWith(API_KEY_PREFIX)) return null;

  return token;
}
