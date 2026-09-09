/**
 * Minimal in-memory rate limiter for sensitive endpoints (login, order
 * creation, review submission, track-order lookup).
 *
 * NOTE: this resets whenever the serverless function cold-starts, and is not
 * shared across multiple instances. It's enough to blunt basic brute-force /
 * scraping attempts, but for a high-traffic production deployment on Vercel,
 * swap this for a durable store (e.g. Upstash Redis + @upstash/ratelimit) so
 * limits are enforced consistently across all instances.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function getClientKey(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() || 'unknown';
}
