ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invite_code TEXT,
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS last_checkin_date DATE,
ADD COLUMN IF NOT EXISTS ad_token_date DATE,
ADD COLUMN IF NOT EXISTS ad_token_count INTEGER DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_invite_code_unique ON public.users(invite_code) WHERE invite_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_invited_by ON public.users(invited_by);

UPDATE public.users
SET token_balance = COALESCE(token_balance, 0),
    ad_token_count = COALESCE(ad_token_count, 0)
WHERE TRUE;
