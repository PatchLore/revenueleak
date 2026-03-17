-- Add plan and subscription columns to users for Indie/Studio tiers
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

COMMENT ON COLUMN users.plan IS 'free | indie | studio';
COMMENT ON COLUMN users.subscription_status IS 'active | canceled | past_due';
