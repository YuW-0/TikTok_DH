-- Drop tables if they exist to ensure clean slate for dev
DROP TABLE IF EXISTS public.ai_interpretations CASCADE;
DROP TABLE IF EXISTS public.fortune_records CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.fortune_signs CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.payment_orders CASCADE;
DROP TABLE IF EXISTS public.vip_subscriptions CASCADE;

-- Create users table
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  vip_level INT DEFAULT 0,
  daily_fortune_count INT DEFAULT 0,
  last_fortune_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fortune_signs table
CREATE TABLE public.fortune_signs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sign_title TEXT NOT NULL,
  sign_level TEXT NOT NULL,
  sign_text TEXT NOT NULL,
  basic_interpretation TEXT,
  full_interpretation TEXT,
  theme TEXT NOT NULL,
  lucky_number TEXT,
  lucky_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fortune_records table
CREATE TABLE public.fortune_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  sign_id UUID REFERENCES public.fortune_signs(id),
  theme TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ai_interpretations table
CREATE TABLE public.ai_interpretations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  sign_title TEXT,
  sign_level TEXT,
  theme TEXT,
  user_input JSONB,
  ai_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  product_type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, paid, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some sample fortune signs
INSERT INTO public.fortune_signs (sign_title, sign_level, sign_text, basic_interpretation, full_interpretation, theme, lucky_number, lucky_color)
VALUES
('第一签', '上上签', '天官赐福喜临门，金银财宝聚满盆。', '财运亨通，万事如意。', '此签为上上大吉之签。近期您的财运将会有显著提升，无论是正财还是偏财都有不错的收获。建议把握机会，积极进取。', '财运', '8', '金色'),
('第二签', '上吉签', '运去金成铁，时来铁似金。', '时来运转，否极泰来。', '目前可能处于转折点，坚持下去必有后福。切勿急躁，稳扎稳打。', '财运', '6', '红色'),
('第三签', '中吉签', '有意栽花花不发，无心插柳柳成荫。', '随缘而安，自有惊喜。', '不必过于强求，顺其自然反而会有意想不到的收获。保持平常心。', '财运', '3', '绿色'),
('第四签', '中平签', '山重水复疑无路，柳暗花明又一村。', '坚持到底，终见曙光。', '虽然当前面临困境，但只要不放弃，很快就会迎来转机。', '财运', '5', '蓝色'),
('第五签', '上上签', '春风得意马蹄疾，一日看尽长安花。', '事业顺利，功成名就。', '事业运势极佳，有望获得晋升或重要机会。', '事业', '9', '紫色'),
('第六签', '上吉签', '大鹏一日同风起，扶摇直上九万里。', '志向远大，前程似锦。', '只要有远大志向并付诸行动，必能成就一番事业。', '事业', '1', '白色');
