// =============================================================
// FinAI - Bot do Telegram (gastos/receitas, método, cartões, recorrências)
// Edge Function (Deno). Webhook do Telegram.
//
// Entende, por linguagem natural:
//   - Gasto/receita avulso: "gastei 45 no ifood", "recebi 300 de freela"
//   - Método: crédito / débito / pix / dinheiro (pergunta se não disser)
//   - Vínculo: "no nubank", "crédito do itaú" -> conta ou cartão
//   - Recorrência: "salário 5000 todo dia 5"
//   - Correção: "não é gasto, é salário"
//   - Pagar fatura: "paguei a fatura do nubank pf"
//   - Comandos: /contas /cartoes /recorrentes /remover /desfazer /ajuda
//
// Secrets: TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, ALLOWED_CHAT_ID, FINAI_USER_ID, WEBHOOK_SECRET
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente)
// =============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;
const ALLOWED_CHAT_ID = Deno.env.get("ALLOWED_CHAT_ID")!;
const FINAI_USER_ID = Deno.env.get("FINAI_USER_ID")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CATEGORIES = [
  "Alimentação", "Transporte", "Lazer", "Saúde",
  "Educação", "Moradia", "Assinaturas", "Compras", "Outros",
];

// ---------- Telegram helpers ----------
async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}
async function sendButtons(chatId: string, text: string, rows: any[]) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown", reply_markup: { inline_keyboard: rows } }),
  });
}
async function answerCallback(id: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: id }),
  });
}

// ---------- utils ----------
function todayBR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}
function brDate(iso: string): string {
  return iso.split("-").reverse().join("/");
}
function norm(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
const signed = (v: number, type: string) => type === "receita" ? Math.abs(v) : -Math.abs(v);

// escolhe 1 item da lista pelo nome citado (exato primeiro; senão fuzzy único)
function pickMatch(list: any[], mention: string) {
  if (!mention || !list?.length) return null;
  const m = norm(mention);
  const exact = list.filter((x) => norm(x.name) === m);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;
  const fuzzy = list.filter((x) => { const n = norm(x.name); return n.includes(m) || m.includes(n); });
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

async function listAccounts() {
  const { data } = await supabase.from("bank_accounts").select("id, name, balance").eq("user_id", FINAI_USER_ID).order("name");
  return data || [];
}
async function listCards() {
  const { data } = await supabase.from("credit_cards").select("id, name, bill, closed_bill, closing_day, due_day, bank_account_id").eq("user_id", FINAI_USER_ID).order("name");
  return data || [];
}
function nameFromLabel(label: string): string | null {
  const m = label && label.match(/^(.+)\s*\((Crédito|Débito)\)$/);
  return m ? m[1].trim() : null;
}

// ---------- estado pendente (perguntar método) ----------
async function setPending(chatId: string, payload: any, method: string | null) {
  await supabase.from("telegram_pending").upsert({
    chat_id: chatId, payload, method, created_at: new Date().toISOString(),
  });
}
async function getPending(chatId: string) {
  const { data } = await supabase.from("telegram_pending").select("*").eq("chat_id", chatId).maybeSingle();
  return data;
}
async function clearPending(chatId: string) {
  await supabase.from("telegram_pending").delete().eq("chat_id", chatId);
}

// última transação (para correção / desfazer)
async function getLastTransaction() {
  const { data } = await supabase
    .from("transactions")
    .select("id, description, category, value, account")
    .eq("user_id", FINAI_USER_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

// ---------- Gemini ----------
type Intent = "lancar" | "recorrente" | "corrigir" | "pagar_fatura" | "desconhecido";
interface Parsed {
  intent: Intent;
  value: number;
  type: "despesa" | "receita";
  category: string;
  description: string;
  date: string;
  day_of_month: number;
  bank: string;             // conta OU cartão citado
  method: "credito" | "debito" | "pix" | "dinheiro" | "";
}

async function parseMessage(text: string): Promise<Parsed | null> {
  const hoje = todayBR();
  const prompt = `Você interpreta mensagens financeiras em português brasileiro.
Hoje é ${hoje} (America/Sao_Paulo). Categorias: ${CATEGORIES.join(", ")}.

"intent":
- "lancar": um gasto/receita. Ex: "gastei 45 no ifood", "recebi 300".
- "recorrente": repete todo mês. Ex: "salário 5000 todo dia 5".
- "corrigir": ajustar o ÚLTIMO lançamento. Ex: "não é gasto, é salário", "muda pra 700".
- "pagar_fatura": pagar a fatura de um cartão. Ex: "paguei a fatura do nubank", "quitar cartão itau".
- "desconhecido": saudação/pergunta vaga.

Campos:
- "value": número POSITIVO em reais; 0 se não houver. "5 mil"=5000.
- "type": "receita" (salário, recebi, ganhei, freela, pix recebido, caiu na conta) ou "despesa". Na dúvida: "despesa".
- "category": melhor da lista; senão "Outros".
- "description": curta ("iFood", "Uber", "Salário").
- "date": resolva hoje/ontem; sem data => ${hoje}.
- "day_of_month": se recorrente, 1..31; senão 0.
- "bank": nome do banco OU cartão citado ("pelo nubank"->"nubank", "crédito do itaú"->"itaú", "nubank pf"->"nubank pf"). "" se nenhum.
- "method": forma de pagamento. "crédito"/"no cartão"/"parcelado"->"credito"; "débito"->"debito"; "pix"/"transferência"/"ted"/"doc"->"pix"; "dinheiro"/"espécie"->"dinheiro"; se não disser, "".

Responda APENAS JSON, sem markdown:
{"intent":"lancar","value":0,"type":"despesa","category":"Outros","description":"","date":"${hoje}","day_of_month":0,"bank":"","method":""}

Mensagem: "${text}"`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
    },
  );
  if (!res.ok) { console.error("Gemini erro:", res.status, await res.text()); return null; }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const p = JSON.parse(raw.replace(/```json|```/g, "").trim());
    if (!["lancar", "recorrente", "corrigir", "pagar_fatura", "desconhecido"].includes(p.intent)) p.intent = "desconhecido";
    p.value = Number(p.value) || 0;
    if (p.type !== "receita") p.type = "despesa";
    if (!CATEGORIES.includes(p.category)) p.category = "Outros";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) p.date = hoje;
    if (!p.description) p.description = p.category;
    p.day_of_month = Number(p.day_of_month) || 0;
    if (p.day_of_month < 0 || p.day_of_month > 31) p.day_of_month = 0;
    p.bank = typeof p.bank === "string" ? p.bank.trim() : "";
    if (!["credito", "debito", "pix", "dinheiro"].includes(p.method)) p.method = "";
    return p as Parsed;
  } catch (e) {
    console.error("JSON parse falhou:", raw, e);
    return null;
  }
}

// ---------- completar lançamento ----------
async function completeCredit(chatId: string, payload: any, card: any) {
  const amount = Math.abs(payload.value); // crédito = despesa
  await supabase.from("transactions").insert({
    user_id: FINAI_USER_ID, date: payload.date, description: payload.description,
    category: payload.category, account: `${card.name} (Crédito)`, value: -amount, status: "Pago",
  });
  const newBill = Number(card.bill) + amount;
  await supabase.from("credit_cards").update({ bill: newBill }).eq("id", card.id);
  await sendTelegram(chatId,
    `✅ *Gasto no crédito!*\n💳 ${card.name}\n📂 ${payload.category} — ${payload.description}\n💵 R$ ${amount.toFixed(2)}\n🧾 Fatura agora: R$ ${newBill.toFixed(2)}`);
}
async function completeAccount(chatId: string, payload: any, acc: any, method: string) {
  const value = payload.value; // assinado
  const label = value < 0 ? "Débito" : "Crédito";
  await supabase.from("transactions").insert({
    user_id: FINAI_USER_ID, date: payload.date, description: payload.description,
    category: payload.category, account: `${acc.name} (${label})`, value, status: "Pago",
  });
  const novo = Number(acc.balance) + value;
  await supabase.from("bank_accounts").update({ balance: novo }).eq("id", acc.id);
  const metodoTxt = method === "pix" ? "Pix" : "Débito";
  await sendTelegram(chatId,
    `✅ *${value < 0 ? "Gasto" : "Receita"} (${metodoTxt})!*\n${value < 0 ? "💸" : "💰"} ${payload.description}\n📂 ${payload.category}\n💵 R$ ${Math.abs(value).toFixed(2)}\n🏦 ${acc.name} → R$ ${novo.toFixed(2)}`);
}
async function completeCash(chatId: string, payload: any) {
  const value = payload.value;
  await supabase.from("transactions").insert({
    user_id: FINAI_USER_ID, date: payload.date, description: payload.description,
    category: payload.category, account: "Dinheiro", value, status: "Pago",
  });
  await sendTelegram(chatId,
    `✅ *${value < 0 ? "Gasto" : "Receita"} (Dinheiro)!*\n${value < 0 ? "💵" : "💰"} ${payload.description}\n📂 ${payload.category}\n💵 R$ ${Math.abs(value).toFixed(2)}`);
}

// resolve o destino (cartão/conta) e completa, ou pergunta com botões
async function resolveAndComplete(chatId: string, payload: any, method: string, mention: string) {
  if (method === "dinheiro") { await completeCash(chatId, payload); await clearPending(chatId); return; }

  if (method === "credito") {
    const cards = await listCards();
    let card = pickMatch(cards, mention);
    if (!card && cards.length === 1) card = cards[0];
    if (!card) {
      if (!cards.length) { await sendTelegram(chatId, "💳 Você não tem cartões cadastrados. Adicione na aba *Bancos* do app."); await clearPending(chatId); return; }
      await setPending(chatId, payload, "credito");
      await sendButtons(chatId, "💳 Qual cartão?", cards.map((c: any) => [{ text: c.name, callback_data: "card:" + c.id }]));
      return;
    }
    await completeCredit(chatId, payload, card); await clearPending(chatId); return;
  }

  // debito ou pix
  const accs = await listAccounts();
  let acc = pickMatch(accs, mention);
  if (!acc && accs.length === 1) acc = accs[0];
  if (!acc) {
    if (!accs.length) { await sendTelegram(chatId, "🏦 Você não tem contas cadastradas. Adicione na aba *Bancos* do app."); await clearPending(chatId); return; }
    await setPending(chatId, payload, method);
    await sendButtons(chatId, "🏦 Qual conta?", accs.map((a: any) => [{ text: a.name, callback_data: "acc:" + a.id }]));
    return;
  }
  await completeAccount(chatId, payload, acc, method); await clearPending(chatId); return;
}

// ---------- pagar fatura ----------
async function payFatura(chatId: string, card: any, amountSpec: number) {
  const closed = Number(card.closed_bill) || 0; // fatura fechada (a que venceu)
  const open = Number(card.bill) || 0;          // fatura aberta (ciclo atual)
  const totalDevido = closed + open;
  if (totalDevido <= 0) { await sendTelegram(chatId, `🧾 A fatura do *${card.name}* já está zerada.`); await clearPending(chatId); return; }

  // padrão: paga a fechada (a que venceu); se não houver, paga a aberta
  const alvoDefault = closed > 0 ? closed : open;
  const amount = amountSpec > 0 ? Math.min(amountSpec, totalDevido) : alvoDefault;

  // abate primeiro da fechada, depois da aberta
  let restante = amount;
  const pagoClosed = Math.min(restante, closed); restante -= pagoClosed;
  const pagoOpen = Math.min(restante, open); restante -= pagoOpen;
  const newClosed = closed - pagoClosed;
  const newOpen = open - pagoOpen;
  await supabase.from("credit_cards").update({ closed_bill: newClosed, bill: newOpen }).eq("id", card.id);

  let contaTxt = "";
  if (card.bank_account_id) {
    const { data: acc } = await supabase.from("bank_accounts").select("id, name, balance").eq("id", card.bank_account_id).maybeSingle();
    if (acc) {
      const novo = Number(acc.balance) - amount;
      await supabase.from("bank_accounts").update({ balance: novo }).eq("id", acc.id);
      await supabase.from("transactions").insert({
        user_id: FINAI_USER_ID, date: todayBR(), description: `Fatura ${card.name}`,
        category: "Outros", account: `${acc.name} (Débito)`, value: -amount, status: "Pago",
      });
      contaTxt = `\n🏦 ${acc.name} → R$ ${novo.toFixed(2)}`;
    }
  } else {
    contaTxt = `\n⚠️ Cartão sem conta vinculada — não debitei nenhuma conta. Vincule no app.`;
  }
  await clearPending(chatId);
  const restanteTxt = (newClosed + newOpen) > 0 ? `\nRestante: R$ ${(newClosed + newOpen).toFixed(2)} (fechada ${newClosed.toFixed(2)} + aberta ${newOpen.toFixed(2)})` : "\n✅ Tudo quitado!";
  await sendTelegram(chatId, `🧾 *Fatura paga!*\n💳 ${card.name}\n💵 R$ ${amount.toFixed(2)}${restanteTxt}${contaTxt}`);
}

// ---------- callback (botões) ----------
async function handleCallback(cb: any) {
  await answerCallback(cb.id);
  const chatId = String(cb.message?.chat?.id);
  if (chatId !== ALLOWED_CHAT_ID) return;
  const data: string = cb.data || "";
  const pending = await getPending(chatId);

  if (data.startsWith("m:")) {
    if (!pending) { await sendTelegram(chatId, "⌛ Esse lançamento expirou, manda de novo."); return; }
    await resolveAndComplete(chatId, pending.payload, data.slice(2), pending.payload.bank || "");
    return;
  }
  if (data.startsWith("card:")) {
    if (!pending) { await sendTelegram(chatId, "⌛ Expirou, manda de novo."); return; }
    const card = (await listCards()).find((c: any) => c.id === data.slice(5));
    if (!card) { await sendTelegram(chatId, "Cartão não encontrado."); return; }
    await completeCredit(chatId, pending.payload, card); await clearPending(chatId); return;
  }
  if (data.startsWith("acc:")) {
    if (!pending) { await sendTelegram(chatId, "⌛ Expirou, manda de novo."); return; }
    const acc = (await listAccounts()).find((a: any) => a.id === data.slice(4));
    if (!acc) { await sendTelegram(chatId, "Conta não encontrada."); return; }
    await completeAccount(chatId, pending.payload, acc, pending.method || "debito"); await clearPending(chatId); return;
  }
  if (data.startsWith("paycard:")) {
    const card = (await listCards()).find((c: any) => c.id === data.slice(8));
    if (!card) { await sendTelegram(chatId, "Cartão não encontrado."); return; }
    await payFatura(chatId, card, 0); return;
  }
}

// ---------- servidor ----------
Deno.serve(async (req) => {
  if (req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  let update: any;
  try { update = await req.json(); } catch { return new Response("ok"); }

  if (update?.callback_query) { await handleCallback(update.callback_query); return new Response("ok"); }

  const msg = update?.message;
  if (!msg?.text) return new Response("ok");
  const chatId = String(msg.chat.id);
  if (chatId !== ALLOWED_CHAT_ID) {
    await sendTelegram(chatId, `🚫 Acesso não autorizado.\nSeu chat_id: \`${chatId}\``);
    return new Response("ok");
  }
  const text = String(msg.text).trim();
  const low = text.toLowerCase();

  // ----- comandos -----
  if (low === "/start" || low === "/ajuda" || low === "/help") {
    await sendTelegram(chatId,
      "👋 *FinAI Bot*\nManda teu gasto ou receita.\n\n" +
      "*Com método e conta:*\n• `gastei 200 no crédito do nubank pf`\n• `paguei 50 no pix do itaú`\n• `recebi 5000 no nubank`\n_(se não disser o método, eu pergunto)_\n\n" +
      "*Recorrência:*\n• `salário 5000 todo dia 5`\n\n" +
      "*Pagar fatura:*\n• `paguei a fatura do nubank pf`\n\n" +
      "*Corrigir o último:*\n• `não é gasto, é salário`\n\n" +
      "*Comandos:*\n• `/contas` • `/cartoes` • `/recorrentes`\n• `/remover <nome>` • `/desfazer`");
    return new Response("ok");
  }
  if (low === "/id") { await sendTelegram(chatId, `Seu chat_id: \`${chatId}\``); return new Response("ok"); }
  if (low === "/contas") {
    const accs = await listAccounts();
    if (!accs.length) { await sendTelegram(chatId, "🏦 Sem contas. Adicione na aba *Bancos* do app."); return new Response("ok"); }
    await sendTelegram(chatId, "🏦 *Suas contas:*\n" + accs.map((b: any) => `• *${b.name}* — R$ ${Number(b.balance).toFixed(2)}`).join("\n"));
    return new Response("ok");
  }
  if (low === "/cartoes" || low === "/cartões") {
    const cards = await listCards();
    if (!cards.length) { await sendTelegram(chatId, "💳 Sem cartões. Adicione na aba *Bancos* do app."); return new Response("ok"); }
    const linhas = cards.map((c: any) => {
      const closed = Number(c.closed_bill) || 0;
      const open = Number(c.bill) || 0;
      let s = `💳 *${c.name}*`;
      if (closed > 0) s += `\n   🔴 Fechada (a pagar): R$ ${closed.toFixed(2)}`;
      s += `\n   🟢 Aberta (atual): R$ ${open.toFixed(2)}`;
      if (c.closing_day || c.due_day) {
        const partes = [];
        if (c.closing_day) partes.push(`fecha dia ${c.closing_day}`);
        if (c.due_day) partes.push(`vence dia ${c.due_day}`);
        s += `\n   📅 ${partes.join(" · ")}`;
      }
      return s;
    });
    await sendTelegram(chatId, "💳 *Seus cartões:*\n" + linhas.join("\n\n"));
    return new Response("ok");
  }
  if (low === "/desfazer") {
    const last = await getLastTransaction();
    if (!last) { await sendTelegram(chatId, "🤷 Nada recente pra desfazer."); return new Response("ok"); }
    const name = nameFromLabel(last.account);
    let extra = "";
    if (name) {
      const accs = await listAccounts();
      const bank = accs.find((a: any) => norm(a.name) === norm(name));
      if (bank) {
        await supabase.from("bank_accounts").update({ balance: Number(bank.balance) - Number(last.value) }).eq("id", bank.id);
        extra = `\n🏦 Saldo de ${bank.name} restaurado.`;
      } else if (last.account.includes("Crédito")) {
        const cards = await listCards();
        const card = cards.find((c: any) => norm(c.name) === norm(name));
        if (card) {
          await supabase.from("credit_cards").update({ bill: Math.max(0, Number(card.bill) - Math.abs(Number(last.value))) }).eq("id", card.id);
          extra = `\n💳 Fatura de ${card.name} restaurada.`;
        }
      }
    }
    await supabase.from("transactions").delete().eq("id", last.id);
    await sendTelegram(chatId, `🗑️ Desfeito: *${last.description}* (R$ ${Math.abs(Number(last.value)).toFixed(2)})${extra}`);
    return new Response("ok");
  }
  if (low === "/recorrentes") {
    const { data } = await supabase.from("recurring_transactions").select("description, value, day_of_month")
      .eq("user_id", FINAI_USER_ID).eq("active", true).order("day_of_month");
    if (!data || !data.length) { await sendTelegram(chatId, "📭 Sem recorrências. Crie: `salário 5000 todo dia 5`"); return new Response("ok"); }
    await sendTelegram(chatId, "🔁 *Recorrências:*\n" + data.map((r: any) => `${r.value < 0 ? "💸" : "💰"} *${r.description}* — R$ ${Math.abs(r.value).toFixed(2)} (dia ${r.day_of_month})`).join("\n"));
    return new Response("ok");
  }
  if (low.startsWith("/remover")) {
    const termo = text.slice("/remover".length).trim();
    if (!termo) { await sendTelegram(chatId, "Uso: `/remover <nome>`"); return new Response("ok"); }
    const { data } = await supabase.from("recurring_transactions").update({ active: false })
      .eq("user_id", FINAI_USER_ID).eq("active", true).ilike("description", `%${termo}%`).select("description");
    if (!data || !data.length) { await sendTelegram(chatId, `🤷 Não achei "${termo}". Veja /recorrentes`); return new Response("ok"); }
    await sendTelegram(chatId, `🗑️ Removida: *${data.map((d: any) => d.description).join(", ")}*`);
    return new Response("ok");
  }

  // ----- interpretação -----
  const p = await parseMessage(text);
  if (!p || p.intent === "desconhecido") {
    await sendTelegram(chatId, '🤔 Não entendi. Ex:\n• `gastei 45 no ifood`\n• `paguei 200 no crédito do nubank`\n\nOu corrija: `não é gasto, é salário`');
    return new Response("ok");
  }

  // ----- PAGAR FATURA -----
  if (p.intent === "pagar_fatura") {
    const cards = await listCards();
    let card = pickMatch(cards, p.bank);
    if (!card && cards.length === 1) card = cards[0];
    if (!card) {
      if (!cards.length) { await sendTelegram(chatId, "💳 Você não tem cartões cadastrados."); return new Response("ok"); }
      await sendButtons(chatId, "🧾 Qual cartão pagar?", cards.map((c: any) => [{ text: `${c.name} (R$ ${Number(c.bill).toFixed(2)})`, callback_data: "paycard:" + c.id }]));
      return new Response("ok");
    }
    await payFatura(chatId, card, p.value);
    return new Response("ok");
  }

  // ----- CORRIGIR -----
  if (p.intent === "corrigir") {
    const last = await getLastTransaction();
    if (!last) { await sendTelegram(chatId, "🤷 Nada recente pra corrigir."); return new Response("ok"); }
    const mag = p.value > 0 ? p.value : Math.abs(Number(last.value));
    const newValue = signed(mag, p.type);
    const newDesc = p.description && p.description !== p.category ? p.description : last.description;
    const newCat = p.category !== "Outros" ? p.category : last.category;
    let newAccount = last.account;
    const lm = typeof last.account === "string" && last.account.match(/^(.+)\s*\((Crédito|Débito)\)$/);
    if (lm) newAccount = `${lm[1].trim()} (${newValue < 0 ? "Débito" : "Crédito"})`;
    await supabase.from("transactions").update({ value: newValue, description: newDesc, category: newCat, account: newAccount }).eq("id", last.id);
    // ajustar saldo se vinculada a conta
    const name = nameFromLabel(last.account);
    let contaC = "";
    if (name) {
      const accs = await listAccounts();
      const bank = accs.find((a: any) => norm(a.name) === norm(name));
      if (bank) {
        const novo = Number(bank.balance) + (newValue - Number(last.value));
        await supabase.from("bank_accounts").update({ balance: novo }).eq("id", bank.id);
        contaC = `\n🏦 ${bank.name} → R$ ${novo.toFixed(2)}`;
      }
    }
    await sendTelegram(chatId, `✏️ *Corrigido!*\n${newValue < 0 ? "💸" : "💰"} ${newDesc}\n📂 ${newCat}\n💵 R$ ${Math.abs(newValue).toFixed(2)} _(${newValue < 0 ? "Gasto" : "Receita"})_${contaC}`);
    return new Response("ok");
  }

  // ----- RECORRÊNCIA -----
  if (p.intent === "recorrente") {
    if (p.value <= 0) { await sendTelegram(chatId, "💵 Qual o valor? Ex: `salário 5000 todo dia 5`"); return new Response("ok"); }
    if (!p.day_of_month) { await sendTelegram(chatId, "📅 Em que dia do mês repete?"); return new Response("ok"); }
    const value = signed(p.value, p.type);
    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: FINAI_USER_ID, description: p.description, category: p.category,
      value, type: p.type === "receita" ? "Receita" : "Despesa",
      day_of_month: p.day_of_month, status: "Pago", active: true,
    });
    if (error) { console.error(error); await sendTelegram(chatId, "🙈 Não consegui criar a recorrência."); return new Response("ok"); }
    await sendTelegram(chatId, `🔁 *Recorrência criada!*\n${value < 0 ? "💸" : "💰"} ${p.description}\n📂 ${p.category}\n💵 R$ ${Math.abs(value).toFixed(2)}\n📅 Todo dia ${p.day_of_month}`);
    return new Response("ok");
  }

  // ----- LANÇAR AVULSO -----
  if (p.value <= 0) { await sendTelegram(chatId, "💵 Não peguei o valor. Ex: `gastei 45 no ifood`"); return new Response("ok"); }
  const value = signed(p.value, p.type);
  const payload = { value, description: p.description, category: p.category, date: p.date, type: p.type, bank: p.bank };

  if (!p.method) {
    await setPending(chatId, payload, null);
    await sendButtons(chatId, `💳 R$ ${Math.abs(value).toFixed(2)} — ${p.description}\nComo foi?`, [
      [{ text: "💳 Crédito", callback_data: "m:credito" }, { text: "🏦 Débito", callback_data: "m:debito" }],
      [{ text: "📲 Pix", callback_data: "m:pix" }, { text: "💵 Dinheiro", callback_data: "m:dinheiro" }],
    ]);
    return new Response("ok");
  }
  await resolveAndComplete(chatId, payload, p.method, p.bank);
  return new Response("ok");
});
