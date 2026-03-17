CREATE TABLE IF NOT EXISTS metric_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '60 minutes'),
  metrics JSONB NOT NULL,
  stripe_data_hash TEXT,
  UNIQUE(user_id, stripe_account_id)
);

CREATE INDEX IF NOT EXISTS idx_metric_cache_expires ON metric_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_metric_cache_lookup ON metric_cache(user_id, stripe_account_id);

ALTER TABLE metric_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own cache" ON metric_cache
  FOR ALL USING (auth.uid() = user_id);
