
-- สร้างตาราง profiles สำหรับข้อมูลผู้ใช้
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- สร้างตาราง transactions สำหรับรายการเงินเข้า-ออก
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- สร้างตาราง budgets สำหรับงบประมาณ
CREATE TABLE public.budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  month TEXT NOT NULL, -- รูปแบบ YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, month)
);

-- สร้างตาราง recurring_items สำหรับรายการซ้ำ
CREATE TABLE public.recurring_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  last_generated DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- เปิด Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;

-- สร้าง RLS policies สำหรับ profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- สร้าง RLS policies สำหรับ transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON public.transactions
  FOR DELETE USING (auth.uid() = user_id);

-- สร้าง RLS policies สำหรับ budgets
CREATE POLICY "Users can view own budgets" ON public.budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets" ON public.budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON public.budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON public.budgets
  FOR DELETE USING (auth.uid() = user_id);

-- สร้าง RLS policies สำหรับ recurring_items
CREATE POLICY "Users can view own recurring items" ON public.recurring_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recurring items" ON public.recurring_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recurring items" ON public.recurring_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recurring items" ON public.recurring_items
  FOR DELETE USING (auth.uid() = user_id);

-- สร้างฟังก์ชันสำหรับสร้าง profile อัตโนมัติเมื่อผู้ใช้สมัครสมาชิก
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$$;

-- สร้าง trigger สำหรับเรียกฟังก์ชันเมื่อมีผู้ใช้ใหม่
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
