type Bucket = {
  windowStart: number;
  count: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 5;

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string): { allowed: boolean } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  bucket.count += 1;
  return { allowed: true };
}

