-- ============================================
-- STRIPE LEAK SCANNER - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  stripe_connected_at TIMESTAMP WITH TIME ZONE,
  stripe_account_status TEXT DEFAULT 'disconnected',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table
CREATE TABLE IF NOT EXISTS scans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_account_id TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending', -- pending, analyzing, completed, error
  error_message TEXT,
  
  -- Payment info
  payment_status TEXT DEFAULT 'pending', -- pending, processing, paid, expired
  stripe_checkout_session_id TEXT,
  stripe_session_id TEXT,
  checkout_created_at TIMESTAMP WITH TIME ZONE,
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  amount_paid DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  
  -- Analysis results
  raw_metrics JSONB,
  analysis_results JSONB,
  ai_report JSONB,
  total_recoverable DECIMAL(10,2),
  executive_score INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  processing_time_ms INTEGER,
  
  -- Indexes
  INDEX idx_scans_user_id (user_id),
  INDEX idx_scans_status (status),
  INDEX idx_scans_payment_status (payment_status),
  INDEX idx_scans_created_at (created_at DESC)
);

-- Invoices table (optional)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_invoice_id TEXT UNIQUE,
  customer_email TEXT,
  amount_due DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  currency TEXT,
  status TEXT,
  invoice_pdf TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_invoices_stripe_id (stripe_invoice_id),
  INDEX idx_invoices_created_at (created_at DESC)
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can only see their own scans
CREATE POLICY "Users can view own scans" ON scans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans" ON scans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans" ON scans
  FOR UPDATE USING (auth.uid() = user_id);

-- Invoices are admin-only (or user-specific if needed)
CREATE POLICY "Admin can view all invoices" ON invoices
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate processing time when scan completes
CREATE OR REPLACE FUNCTION calculate_processing_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.started_at IS NOT NULL THEN
    NEW.processing_time_ms = EXTRACT(EPOCH FROM (NOW() - NEW.started_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_scan_processing_time BEFORE UPDATE ON scans
  FOR EACH ROW EXECUTE FUNCTION calculate_processing_time();

-- ============================================
-- SAMPLE DATA (for testing)
-- ============================================

-- INSERT INTO scans (user_id, status, payment_status, total_recoverable, executive_score) 
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- replace with actual user ID
--   'completed',
--   'paid',
--   12500.50,
--   78
-- );