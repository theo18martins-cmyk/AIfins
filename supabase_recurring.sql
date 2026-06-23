-- ==============================================================
-- FinAI - Recorrências (salário, aluguel, assinaturas, etc)
-- Rode TUDO de uma vez no SQL Editor do Supabase.
--
-- O que isso faz:
--   1. Tabela recurring_transactions (as regras: "salário 5000 todo dia 5")
--   2. Função que materializa as recorrências do dia em `transactions`
--   3. pg_cron rodando essa função todo dia de manhã (auto)
-- ==============================================================

-- 1. TABELA --------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description          TEXT NOT NULL,
  category             TEXT NOT NULL DEFAULT 'Outros',
  value                NUMERIC NOT NULL,          -- assinado: receita > 0, despesa < 0
  type                 TEXT NOT NULL DEFAULT 'Despesa', -- 'Despesa' | 'Receita' (p/ exibição)
  day_of_month         INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  status               TEXT NOT NULL DEFAULT 'Pago',
  active               BOOLEAN NOT NULL DEFAULT true,
  last_inserted_month  TEXT,                       -- 'YYYY-MM' p/ não duplicar
  created_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON recurring_transactions(user_id);

-- RLS (cada usuário só vê/mexe nas próprias)
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rec_select_own" ON recurring_transactions;
DROP POLICY IF EXISTS "rec_insert_own" ON recurring_transactions;
DROP POLICY IF EXISTS "rec_update_own" ON recurring_transactions;
DROP POLICY IF EXISTS "rec_delete_own" ON recurring_transactions;
CREATE POLICY "rec_select_own" ON recurring_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "rec_insert_own" ON recurring_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "rec_update_own" ON recurring_transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "rec_delete_own" ON recurring_transactions FOR DELETE USING (auth.uid() = user_id);

-- 2. FUNÇÃO QUE MATERIALIZA AS RECORRÊNCIAS DO DIA -----------
CREATE OR REPLACE FUNCTION process_recurring_transactions()
RETURNS integer AS $$
DECLARE
  today      DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  today_day  INT  := EXTRACT(DAY FROM today);
  last_day   INT  := EXTRACT(DAY FROM (date_trunc('month', today) + INTERVAL '1 month - 1 day'));
  cur_month  TEXT := to_char(today, 'YYYY-MM');
  r          RECORD;
  inserted   INT  := 0;
BEGIN
  FOR r IN
    SELECT * FROM recurring_transactions
    WHERE active = true
      AND COALESCE(last_inserted_month, '') <> cur_month
      AND (
            day_of_month = today_day
            -- borda: dia 29/30/31 em mês mais curto -> cai no último dia do mês
            OR (day_of_month > last_day AND today_day = last_day)
          )
  LOOP
    INSERT INTO transactions (user_id, date, description, category, account, value, status)
    VALUES (r.user_id, today, r.description, r.category, 'Recorrente', r.value, r.status);

    UPDATE recurring_transactions SET last_inserted_month = cur_month WHERE id = r.id;
    inserted := inserted + 1;
  END LOOP;

  RETURN inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. AGENDAMENTO (pg_cron) -----------------------------------
-- Habilita a extensão (idempotente).
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove agendamento anterior (se existir) para não duplicar.
SELECT cron.unschedule('finai-recurring')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'finai-recurring');

-- Roda todo dia às 12:00 UTC = 09:00 horário de Brasília.
SELECT cron.schedule(
  'finai-recurring',
  '0 12 * * *',
  $$ SELECT process_recurring_transactions(); $$
);

-- ==============================================================
-- (Opcional) Rodar agora manualmente para testar:
--   SELECT process_recurring_transactions();
-- Ver os agendamentos ativos:
--   SELECT jobname, schedule, active FROM cron.job;
-- ==============================================================
