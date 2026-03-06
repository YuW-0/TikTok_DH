-- Add merit column to users table
ALTER TABLE public.users ADD COLUMN merit INTEGER DEFAULT 0;

-- Optionally, if you want to keep daily_fortune_count for its original purpose (quota tracking)
-- and use merit for the ranking score.
-- The previous code reused daily_fortune_count, but it's cleaner to separate them.
