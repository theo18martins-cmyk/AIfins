// =============================================================
// FinAI - Bot do Telegram (lançar gastos/receitas por linguagem natural)
// Edge Function (Deno) - roda no Supabase, de graça.
//
// Entende:
//   - Gasto avulso:    "gastei 45 no ifood", "uber 23,50"
//   - Receita avulsa:  "recebi 300 de freela", "salário 5000"
//   - Recorrência:     "salário 5000 todo dia 5", "aluguel 1200 recorrente dia 10"
//   - Correção:        "não é gasto, é salário", "era receita", "muda pra 700"
//   - Comandos:        /recorrentes, /remover <nome>, /desfazer, /ajuda
//
// Secrets (Dashboard -> Edge Functions -> Secrets):
//   TELEGRAM_BOT_TOKEN, GEMINI_API_KEY, ALLOWED_CHAT_ID, FINAI_USER_ID, WEBHOOK_SECRET
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

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}

// Data de hoje no fuso de São Paulo (YYYY-MM-DD)
function todayBR(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

function brDate(iso: string): string {
  return iso.split("-").reverse().join("/");
}

// Última transação (para correção / desfazer)
async function getLastBotTransaction() {
  const { data } = await supabase
    .from("transactions")
    .select("id, description, category, value, status, date, account")
    .eq("user_id", FINAI_USER_ID)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

type Intent = "lancar" | "recorrente" | "corrigir" | "desconhecido";

interface Parsed {
  intent: Intent;
  value: number;          // positivo; 0 se não informado
  type: "despesa" | "receita";
  category: string;
  description: string;
  date: string;           // YYYY-MM-DD
  day_of_month: number;   // 1..31 quando recorrente; senão 0
  bank: string;           // conta/banco mencionado ("nubank", "itau"); "" se nenhum
}

// normaliza para comparar nomes de conta (sem acento, minúsculo)
function norm(s: string): string {
  return (s || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

// acha a conta bancária que casa com o que foi mencionado na frase
async function matchBankAccount(mention: string) {
  if (!mention) return null;
  const { data } = await supabase
    .from("bank_accounts")
    .select("id, name, balance")
    .eq("user_id", FINAI_USER_ID);
  if (!data || data.length === 0) return null;
  const m = norm(mention);
  return data.find((b: any) => {
    const n = norm(b.name);
    return n === m || n.includes(m) || m.includes(n);
  }) || null;
}

// extrai a conta a partir de um rótulo tipo "Nubank (Débito)"
async function bankFromAccountLabel(label: string) {
  const m = label && label.match(/^(.+)\s*\((Crédito|Débito)\)$/);
  if (!m) return null;
  return await matchBankAccount(m[1].trim());
}

async function parseMessage(text: string): Promise<Parsed | null> {
  const hoje = todayBR();
  const prompt = `Você interpreta mensagens financeiras em português brasileiro de um app de finanças pessoais.
Hoje é ${hoje} (fuso America/Sao_Paulo).
Categorias permitidas: ${CATEGORIES.join(", ")}.

Classifique a mensagem em "intent":
- "lancar": registrar UM gasto ou receita. Ex: "gastei 45 no ifood", "recebi 300 de freela", "salário 5000".
- "recorrente": algo que repete todo mês. Ex: "salário 5000 todo dia 5", "aluguel 1200 recorrente dia 10", "mensal".
- "corrigir": corrigir/ajustar o ÚLTIMO lançamento. Ex: "não é gasto, é salário", "era receita", "isso é entrada", "muda pra 700", "na verdade foi no mercado".
- "desconhecido": não dá pra entender como transação (saudação, pergunta vaga, "desse que passou" sem valor claro).

Campos:
- "value": número POSITIVO em reais (sem sinal). 0 se não houver. "5 mil"=5000, "2,5 mil"=2500. Se houver número de 4+ dígitos seguido de "mil" (ex "7000mil"), trate como o próprio número (7000).
- "type": "receita" para entradas (salário, recebi, ganhei, freela, pix recebido, vendi, caiu na conta, entrou); "despesa" para saídas (gastei, paguei, comprei, conta, fatura). Na dúvida em "lancar", use "despesa".
- "category": a mais adequada da lista; senão "Outros".
- "description": curta (ex: "iFood", "Uber", "Salário", "Aluguel").
- "date": resolva "hoje/ontem/anteontem" relativo a ${hoje}. Sem data => ${hoje}.
- "day_of_month": se intent="recorrente", o dia (1..31). Senão 0.
- "bank": nome do banco/conta mencionado, se houver. Ex: "pelo nubank"->"nubank", "no itaú"->"itaú", "débito do inter"->"inter", "caiu no bradesco"->"bradesco". Se nenhum banco for citado, "".

Responda APENAS JSON válido, sem markdown:
{"intent":"lancar","value":0,"type":"despesa","category":"Outros","description":"","date":"${hoje}","day_of_month":0,"bank":""}

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

  if (!res.ok) {
    console.error("Gemini erro:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  try {
    const p = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const intents = ["lancar", "recorrente", "corrigir", "desconhecido"];
    if (!intents.includes(p.intent)) p.intent = "desconhecido";
    p.value = Number(p.value) || 0;
    if (p.type !== "receita") p.type = "despesa";
    if (!CATEGORIES.includes(p.category)) p.category = "Outros";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.date)) p.date = hoje;
    if (!p.description) p.description = p.category;
    p.day_of_month = Number(p.day_of_month) || 0;
    if (p.day_of_month < 0 || p.day_of_month > 31) p.day_of_month = 0;
    p.bank = typeof p.bank === "string" ? p.bank.trim() : "";
    return p as Parsed;
  } catch (e) {
    console.error("JSON parse falhou:", raw, e);
    return null;
  }
}

Deno.serve(async (req) => {
  // 1. valida o secret do webhook
  if (req.headers.get("x-telegram-bot-api-secret-token") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }

  let update: any;
  try { update = await req.json(); } catch { return new Response("ok"); }

  const msg = update?.message;
  if (!msg?.text) return new Response("ok");

  const chatId = String(msg.chat.id);
  if (chatId !== ALLOWED_CHAT_ID) {
    await sendTelegram(chatId, `🚫 Acesso não autorizado.\nSeu chat_id: \`${chatId}\``);
    return new Response("ok");
  }

  const text = String(msg.text).trim();
  const low = text.toLowerCase();

  // ---------- COMANDOS ----------
  if (low === "/start" || low === "/ajuda" || low === "/help") {
    await sendTelegram(
      chatId,
      "👋 *FinAI Bot*\nManda teu gasto ou receita que eu lanço.\n\n" +
        "*Avulso:*\n• `gastei 45 no ifood`\n• `recebi 300 de freela`\n• `salário 5000`\n\n" +
        "*Vincular a uma conta:* cite o banco na frase\n• `gastei 50 no mercado pelo nubank`\n• `recebi 5000 no itaú`\n_(atualiza o saldo da conta automaticamente)_\n\n" +
        "*Recorrência (todo mês):*\n• `salário 5000 todo dia 5`\n• `aluguel 1200 recorrente dia 10`\n\n" +
        "*Corrigir o último:*\n• `não é gasto, é salário`\n• `muda pra 700`\n\n" +
        "*Comandos:*\n• `/contas` — lista suas contas e saldos\n• `/recorrentes` — lista recorrências\n• `/remover <nome>` — desativa recorrência\n• `/desfazer` — apaga o último lançamento",
    );
    return new Response("ok");
  }
  if (low === "/id") {
    await sendTelegram(chatId, `Seu chat_id: \`${chatId}\``);
    return new Response("ok");
  }
  if (low === "/desfazer") {
    const last = await getLastBotTransaction();
    if (!last) {
      await sendTelegram(chatId, "🤷 Não há lançamento recente pra desfazer.");
      return new Response("ok");
    }
    // reverter saldo se estava vinculada a uma conta
    const linked = await bankFromAccountLabel(last.account);
    if (linked) {
      await supabase.from("bank_accounts")
        .update({ balance: Number(linked.balance) - Number(last.value) })
        .eq("id", linked.id);
    }
    await supabase.from("transactions").delete().eq("id", last.id);
    const extra = linked ? `\n🏦 Saldo de ${linked.name} restaurado.` : "";
    await sendTelegram(chatId, `🗑️ Desfeito: *${last.description}* (R$ ${Math.abs(last.value).toFixed(2)})${extra}`);
    return new Response("ok");
  }
  if (low === "/contas") {
    const { data } = await supabase
      .from("bank_accounts")
      .select("name, balance")
      .eq("user_id", FINAI_USER_ID).order("name");
    if (!data || data.length === 0) {
      await sendTelegram(chatId, "🏦 Você não tem contas cadastradas. Adicione na aba *Bancos* do app.");
      return new Response("ok");
    }
    const linhas = data.map((b: any) => `• *${b.name}* — R$ ${Number(b.balance).toFixed(2)}`);
    await sendTelegram(chatId, "🏦 *Suas contas:*\n" + linhas.join("\n") + "\n\n_Use citando na frase: \"gastei 50 no nubank\"._");
    return new Response("ok");
  }
  if (low === "/recorrentes") {
    const { data } = await supabase
      .from("recurring_transactions")
      .select("description, value, day_of_month")
      .eq("user_id", FINAI_USER_ID).eq("active", true).order("day_of_month");
    if (!data || data.length === 0) {
      await sendTelegram(chatId, "📭 Sem recorrências ativas.\nCrie: `salário 5000 todo dia 5`");
      return new Response("ok");
    }
    const linhas = data.map((r: any) =>
      `${r.value < 0 ? "💸" : "💰"} *${r.description}* — R$ ${Math.abs(r.value).toFixed(2)} (dia ${r.day_of_month})`);
    await sendTelegram(chatId, "🔁 *Suas recorrências:*\n" + linhas.join("\n"));
    return new Response("ok");
  }
  if (low.startsWith("/remover")) {
    const termo = text.slice("/remover".length).trim();
    if (!termo) {
      await sendTelegram(chatId, "Uso: `/remover <nome>`  (ex: `/remover salário`)");
      return new Response("ok");
    }
    const { data } = await supabase
      .from("recurring_transactions")
      .update({ active: false })
      .eq("user_id", FINAI_USER_ID).eq("active", true)
      .ilike("description", `%${termo}%`).select("description");
    if (!data || data.length === 0) {
      await sendTelegram(chatId, `🤷 Não achei recorrência com "${termo}". Veja /recorrentes`);
      return new Response("ok");
    }
    await sendTelegram(chatId, `🗑️ Removida: *${data.map((d: any) => d.description).join(", ")}*`);
    return new Response("ok");
  }

  // ---------- INTERPRETAÇÃO ----------
  const p = await parseMessage(text);
  if (!p || p.intent === "desconhecido") {
    await sendTelegram(chatId, '🤔 Não entendi. Tenta numa frase só, ex:\n• `gastei 45 no ifood`\n• `salário 5000`\n\nOu corrija o último: `não é gasto, é salário`');
    return new Response("ok");
  }

  const signed = (v: number, type: string) => type === "receita" ? Math.abs(v) : -Math.abs(v);

  // ---------- CORRIGIR O ÚLTIMO ----------
  if (p.intent === "corrigir") {
    const last = await getLastBotTransaction();
    if (!last) {
      await sendTelegram(chatId, "🤷 Não há lançamento recente pra corrigir.");
      return new Response("ok");
    }
    // magnitude: novo valor se informado, senão mantém o atual
    const mag = p.value > 0 ? p.value : Math.abs(last.value);
    const newValue = signed(mag, p.type);
    const newDesc = p.description && p.description !== p.category ? p.description : last.description;
    const newCat = p.category !== "Outros" ? p.category : last.category;
    // se mudar tipo (despesa<->receita), corrige o sufixo do rótulo da conta
    let newAccount = last.account;
    const labelMatch = typeof last.account === "string" && last.account.match(/^(.+)\s*\((Crédito|Débito)\)$/);
    if (labelMatch) newAccount = `${labelMatch[1].trim()} (${newValue < 0 ? "Débito" : "Crédito"})`;
    await supabase.from("transactions")
      .update({ value: newValue, description: newDesc, category: newCat, account: newAccount })
      .eq("id", last.id);
    // ajustar saldo da conta vinculada pela diferença
    const linkedC = await bankFromAccountLabel(last.account);
    if (linkedC) {
      const delta = newValue - Number(last.value);
      await supabase.from("bank_accounts")
        .update({ balance: Number(linkedC.balance) + delta })
        .eq("id", linkedC.id);
    }
    const emoji = newValue < 0 ? "💸" : "💰";
    const contaC = linkedC ? `\n🏦 ${linkedC.name} → saldo R$ ${(Number(linkedC.balance) + (newValue - Number(last.value))).toFixed(2)}` : "";
    await sendTelegram(
      chatId,
      `✏️ *Corrigido!*\n${emoji} ${newDesc}\n📂 ${newCat}\n💵 R$ ${Math.abs(newValue).toFixed(2)}\n_(${newValue < 0 ? "Gasto" : "Receita"})_${contaC}`,
    );
    return new Response("ok");
  }

  const value = signed(p.value, p.type);

  // ---------- RECORRÊNCIA ----------
  if (p.intent === "recorrente") {
    if (p.value <= 0) {
      await sendTelegram(chatId, "💵 Qual o valor? Ex: `salário 5000 todo dia 5`");
      return new Response("ok");
    }
    if (!p.day_of_month) {
      await sendTelegram(chatId, "📅 Em que dia do mês repete? Ex: `salário 5000 todo dia 5`");
      return new Response("ok");
    }
    const { error } = await supabase.from("recurring_transactions").insert({
      user_id: FINAI_USER_ID, description: p.description, category: p.category,
      value, type: p.type === "receita" ? "Receita" : "Despesa",
      day_of_month: p.day_of_month, status: "Pago", active: true,
    });
    if (error) {
      console.error("Insert recorrência:", error);
      await sendTelegram(chatId, "🙈 Não consegui criar a recorrência. Tenta de novo.");
      return new Response("ok");
    }
    await sendTelegram(
      chatId,
      `🔁 *Recorrência criada!*\n${value < 0 ? "💸" : "💰"} ${p.description}\n📂 ${p.category}\n💵 R$ ${Math.abs(value).toFixed(2)}\n📅 Todo dia ${p.day_of_month}\n\n_Lançada automaticamente todo mês._`,
    );
    return new Response("ok");
  }

  // ---------- LANÇAR AVULSO ----------
  if (p.value <= 0) {
    await sendTelegram(chatId, "💵 Não peguei o valor. Ex: `gastei 45 no ifood`");
    return new Response("ok");
  }

  // Vincular a uma conta bancária se foi mencionada na frase
  const bankAcc = await matchBankAccount(p.bank);
  let accountLabel = "Telegram";
  let aviso = "";
  if (bankAcc) {
    accountLabel = `${bankAcc.name} (${value < 0 ? "Débito" : "Crédito"})`;
  } else if (p.bank) {
    // mencionou um banco que não bate com nenhuma conta cadastrada
    aviso = `\n\n⚠️ Não achei a conta "${p.bank}" — lancei sem vincular. Veja /contas`;
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: FINAI_USER_ID, date: p.date, description: p.description,
    category: p.category, account: accountLabel, value, status: "Pago",
  });
  if (error) {
    console.error("Insert transação:", error);
    await sendTelegram(chatId, "🙈 Tive um problema ao salvar. Tenta de novo.");
    return new Response("ok");
  }

  // Atualizar o saldo da conta (gasto diminui, receita aumenta)
  if (bankAcc) {
    const novoSaldo = Number(bankAcc.balance) + value;
    const { error: balErr } = await supabase
      .from("bank_accounts")
      .update({ balance: novoSaldo })
      .eq("id", bankAcc.id);
    if (balErr) console.error("Update saldo:", balErr);
  }

  const emoji = value < 0 ? "💸" : "💰";
  const tipo = value < 0 ? "Gasto" : "Receita";
  const contaMsg = bankAcc
    ? `\n🏦 ${bankAcc.name} → saldo R$ ${(Number(bankAcc.balance) + value).toFixed(2)}`
    : "";
  await sendTelegram(
    chatId,
    `✅ *${tipo} lançado!*\n${emoji} ${p.description}\n📂 ${p.category}\n💵 R$ ${Math.abs(value).toFixed(2)}\n📅 ${brDate(p.date)}${contaMsg}${aviso}\n\n_Errado? Manda \`/desfazer\` ou \"é receita\"._`,
  );
  return new Response("ok");
});
