-- ==============================================================
-- FinAI - Vínculo cartão↔conta + estado de conversa do bot
-- Rode TUDO no SQL Editor do Supabase.
-- ==============================================================

-- 1. Vincular cada cartão a uma conta bancária (a fatura sai dela)
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;

-- 2. Estado pendente do bot (para "perguntar o método" e aguardar resposta)
--    1 pendência por chat; é sobrescrita a cada nova pergunta.
CREATE TABLE IF NOT EXISTS telegram_pending (
  chat_id     TEXT PRIMARY KEY,
  payload     JSONB NOT NULL,        -- { value, type, category, description, date, bank }
  method      TEXT,                  -- 'credito' | 'debito' | 'pix' | null (ainda perguntando)
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Só a service_role (Edge Function) acessa; RLS liga sem policies públicas.
ALTER TABLE telegram_pending ENABLE ROW LEVEL SECURITY;
