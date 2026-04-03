-- ==============================================================
-- SQL para criar a tabela de Investimentos no Supabase
-- Execute este script no SQL Editor do seu painel Supabase
-- ==============================================================

-- 1. Criar a tabela de investimentos
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'Ações',
  ticker TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  average_price NUMERIC NOT NULL DEFAULT 0,
  current_value NUMERIC DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuários podem ler seus próprios investimentos
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: Usuários podem inserir seus próprios investimentos
CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: Usuários podem atualizar seus próprios investimentos
CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Política: Usuários podem deletar seus próprios investimentos
CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Índice para performance
CREATE INDEX idx_investments_user_id ON investments(user_id);
