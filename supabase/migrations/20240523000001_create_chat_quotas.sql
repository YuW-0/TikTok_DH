-- Create a new table to track daily chat usage and extra chances
CREATE TABLE IF NOT EXISTS public.chat_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) NOT NULL UNIQUE,
    daily_count INTEGER DEFAULT 0,
    last_chat_date DATE DEFAULT CURRENT_DATE,
    extra_chances INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_chat_quotas_user_id ON public.chat_quotas(user_id);
