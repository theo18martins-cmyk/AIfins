-- ==============================================================
-- FinAI - Fechamento automático de fatura de cartão
-- Rode TUDO no SQL Editor do Supabase.
--
-- Modelo:
--   bill        = fatura ABERTA (compras do ciclo atual)
--   closed_bill = fatura FECHADA (fechou, aguardando pagamento)
--   closing_day = dia que a fatura fecha (vira)
--   due_day     = dia que vence (pagar)
--
-- Todo dia o cron verifica: se hoje é o dia de fechamento do cartão,
-- move bill -> closed_bill e zera bill (começa novo ciclo).
-- ==============================================================

ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS closing_day        INTEGER,
  ADD COLUMN IF NOT EXISTS due_day            INTEGER,
  ADD COLUMN IF NOT EXISTS closed_bill        NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_closed_month  TEXT;

CREATE OR REPLACE FUNCTION close_credit_card_invoices()
RETURNS integer AS $$
DECLARE
  today     DATE := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  today_day INT  := EXTRACT(DAY FROM today);
  last_day  INT  := EXTRACT(DAY FROM (date_trunc('month', today) + INTERVAL '1 month - 1 day'));
  cur_month TEXT := to_char(today, 'YYYY-MM');
  r         RECORD;
  n         INT  := 0;
BEGIN
  FOR r IN
    SELECT * FROM credit_cards
    WHERE closing_day IS NOT NULL
      AND COALESCE(last_closed_month, '') <> cur_month
      AND (
            closing_day = today_day
            OR (closing_day > last_day AND today_day = last_day) -- fechamento 29/30/31 em mês curto
          )
  LOOP
    UPDATE credit_cards
      SET closed_bill       = COALESCE(closed_bill, 0) + COALESCE(bill, 0),
          bill              = 0,
          last_closed_month = cur_month
      WHERE id = r.id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendamento diário: 12:10 UTC = 09:10 BRT (logo após as recorrências)
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule('finai-close-invoices')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'finai-close-invoices');
SELECT cron.schedule('finai-close-invoices', '10 12 * * *', $$ SELECT close_credit_card_invoices(); $$);
