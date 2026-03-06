-- Add foreign key to fortune_records to link to ai_interpretations
ALTER TABLE public.fortune_records ADD COLUMN ai_interpretation_id UUID REFERENCES public.ai_interpretations(id);
