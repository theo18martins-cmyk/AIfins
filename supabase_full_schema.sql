-- ==============================================================
-- FinAI - Schema COMPLETO do Supabase
-- Gerado a partir das colunas realmente usadas no App.tsx.
-- Seguro de rodar num projeto NOVO/limpo (usa IF NOT EXISTS).
-- Execute no SQL Editor do painel Supabase.
--
-- OBS: seu Supabase atual ja tem estas tabelas. Este arquivo
-- serve para versionar o schema e recriar do zero se precisar.
-- ==============================================================

-- ====================== 1. FAMILIES ===========================
CREATE TABLE IF NOT EXISTS families (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ====================== 2. PROFILES ===========================
-- 1 perfil por usuario do Supabase Auth (id = auth.users.id)
CREATE TABLE IF NOT EXISTS profiles (
  id                        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                      TEXT,
  email                     TEXT,
  avatar_url                TEXT,
  has_completed_onboarding  BOOLEAN DEFAULT false,
  family_id                 UUID REFERENCES families(id) ON DELETE SET NULL,
  family_role               TEXT,            -- 'admin' | 'member'
  family_permissions        JSONB,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- ================== 3. FAMILY_INVITATIONS =====================
CREATE TABLE IF NOT EXISTS family_invitations (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id    UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  invite_code  TEXT NOT NULL,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permissions  JSONB,
  status       TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'accepted'
  expires_at   TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_family_invitations_code ON family_invitations(invite_code);

-- ====================== 4. TRANSACTIONS =======================
CREATE TABLE IF NOT EXISTS transactions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  description  TEXT NOT NULL,
  category     TEXT,
  account      TEXT,
  value        NUMERIC NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Pago',       -- 'Pago' | 'Pendente'
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- ===================== 5. BANK_ACCOUNTS =======================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  type        TEXT,                               -- Conta Corrente | Poupanca | Investimento | Outros
  balance     NUMERIC NOT NULL DEFAULT 0,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);

-- ===================== 6. CREDIT_CARDS ========================
CREATE TABLE IF NOT EXISTS credit_cards (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  credit_limit  NUMERIC NOT NULL DEFAULT 0,
  bill          NUMERIC NOT NULL DEFAULT 0,
  paid          NUMERIC DEFAULT 0,
  color         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);

-- ======================= 7. BUDGETS ===========================
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL,
  planned     NUMERIC NOT NULL DEFAULT 0,
  realized    NUMERIC NOT NULL DEFAULT 0,
  icon        TEXT,
  color       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- ======================== 8. DEBTS ============================
CREATE TABLE IF NOT EXISTS debts (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name                TEXT NOT NULL,
  type                TEXT,
  bank                TEXT,
  total               NUMERIC NOT NULL DEFAULT 0,
  remaining           NUMERIC NOT NULL DEFAULT 0,
  due_date            DATE,
  status              TEXT DEFAULT 'Em dia',       -- 'Em dia' | 'Pendente'
  color               TEXT,
  total_installments  INTEGER DEFAULT 1,
  paid_installments   INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);

-- ======================== 9. GOALS ============================
CREATE TABLE IF NOT EXISTS goals (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  target      NUMERIC NOT NULL DEFAULT 0,
  current     NUMERIC NOT NULL DEFAULT 0,
  image_url   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- ===================== 10. INVESTMENTS ========================
CREATE TABLE IF NOT EXISTS investments (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type           TEXT NOT NULL DEFAULT 'Ações',
  ticker         TEXT,
  name           TEXT NOT NULL,
  quantity       NUMERIC NOT NULL DEFAULT 0,
  average_price  NUMERIC NOT NULL DEFAULT 0,
  current_value  NUMERIC DEFAULT 0,
  date           DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);

-- ==============================================================
-- 11. ROW LEVEL SECURITY (RLS)
-- Politica base: cada usuario acessa apenas as proprias linhas.
-- (Compartilhamento familiar via leitura ampla pode exigir
--  policies adicionais; ajuste conforme sua necessidade.)
-- ==============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'transactions','bank_accounts','credit_cards',
    'budgets','debts','goals','investments'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$CREATE POLICY "own_select_%1$s" ON %1$I FOR SELECT USING (auth.uid() = user_id);$f$, t);
    EXECUTE format($f$CREATE POLICY "own_insert_%1$s" ON %1$I FOR INSERT WITH CHECK (auth.uid() = user_id);$f$, t);
    EXECUTE format($f$CREATE POLICY "own_update_%1$s" ON %1$I FOR UPDATE USING (auth.uid() = user_id);$f$, t);
    EXECUTE format($f$CREATE POLICY "own_delete_%1$s" ON %1$I FOR DELETE USING (auth.uid() = user_id);$f$, t);
  END LOOP;
END $$;

-- profiles: usuario le/edita o proprio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- families / family_invitations: leitura para autenticados, escrita pelo dono/criador
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "families_select_auth" ON families FOR SELECT TO authenticated USING (true);
CREATE POLICY "families_insert_owner" ON families FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "families_update_owner" ON families FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "families_delete_owner" ON families FOR DELETE USING (auth.uid() = owner_id);

ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_auth" ON family_invitations FOR SELECT TO authenticated USING (true);
CREATE POLICY "invites_insert_creator" ON family_invitations FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "invites_update_auth" ON family_invitations FOR UPDATE TO authenticated USING (true);

-- ==============================================================
-- 12. STORAGE: bucket de avatares
-- ==============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================
-- 13. Trigger: cria 1 profile automaticamente ao registrar usuario
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
