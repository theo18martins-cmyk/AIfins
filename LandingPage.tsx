import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

// --- SCROLL ANIMATION HOOK ---
function useScrollAnimation(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// --- ANIMATED COUNTER ---
function AnimatedCounter({ target, suffix = '', duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString('pt-BR')}{suffix}</span>;
}

// --- ICONS ---
const LPIcons = {
  Sparkles: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4M4 19h4m9-15v4m-2-2h4m-5 15l-3-8 10-2-7 10z" /></svg>,
  Investments: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" /></svg>,
  Budget: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Target: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2"/><circle cx="12" cy="12" r="6" strokeWidth="2"/><circle cx="12" cy="12" r="2" strokeWidth="2"/></svg>,
  Bell: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Chart: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  Check: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>,
  ChevronDown: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>,
  Star: () => <svg className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  Quote: () => <svg className="w-10 h-10 text-blue-500/30" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
};

// --- FAQ ITEM ---
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left bg-slate-900 hover:bg-slate-800/80 transition-colors"
      >
        <span className="text-base font-bold text-white pr-4">{question}</span>
        <span className={`transform transition-transform duration-300 text-slate-400 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
          <LPIcons.ChevronDown />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="p-6 pt-0 text-sm font-medium text-slate-400 leading-relaxed bg-slate-900">{answer}</p>
      </div>
    </div>
  );
}

// --- ANIMATION WRAPPER ---
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// --- DATA ---
const testimonials = [
  { name: 'Mariana Costa', role: 'Empreendedora', avatar: 'MC', quote: 'O FinAi mudou completamente a forma como eu enxergo minhas finanças. Em 2 meses, consegui economizar 30% do que eu gastava sem perceber.', stars: 5 },
  { name: 'Ricardo Almeida', role: 'Desenvolvedor Sênior', avatar: 'RA', quote: 'A integração com a B3 é incrível. Acompanho minha carteira, recebo alertas e a IA ainda sugere diversificação. Nunca foi tão fácil investir.', stars: 5 },
  { name: 'Juliana Ferreira', role: 'Médica', avatar: 'JF', quote: 'Eu odiava planilhas financeiras. Com o FinAi, basta conectar minhas contas e tudo é organizado automaticamente. A IA é como ter um consultor pessoal.', stars: 5 },
];

const faqs = [
  { question: 'O FinAi é realmente gratuito?', answer: 'Sim! Oferecemos um plano gratuito completo com todas as funcionalidades essenciais. Sem período de teste, sem truques. Você pode usar o FinAi sem pagar nada e sem cadastrar cartão de crédito.' },
  { question: 'Meus dados financeiros estão seguros?', answer: 'Absolutamente. Utilizamos criptografia AES-256, a mesma usada por bancos. Seus dados são armazenados em servidores seguros e nunca compartilhamos informações com terceiros. Somos LGPD compliant.' },
  { question: 'Quais bancos e corretoras são suportados?', answer: 'Você pode cadastrar qualquer banco ou corretora manualmente. Para investimentos, temos integração nativa com a B3 via Brapi API, cobrindo ações, FIIs, criptos e renda fixa em tempo real.' },
  { question: 'Preciso instalar algum aplicativo?', answer: 'Não! O FinAi é 100% web e funciona direto no navegador do celular ou computador. Nenhuma instalação necessária — basta acessar e começar a usar.' },
  { question: 'Posso cancelar a qualquer momento?', answer: 'Sim, sem compromisso. Se algum dia decidir parar de usar, basta desativar sua conta. Sem taxas de cancelamento, sem burocracia, sem perguntas.' },
];

const features = [
  { icon: LPIcons.Sparkles, title: 'Inteligência Artificial', desc: 'Converse com a IA para classificar transações, receber dicas automáticas de economia e analisar picos de gastos anormais no sistema.', color: 'indigo', popular: false },
  { icon: LPIcons.Investments, title: 'Investimentos B3 (Tempo Real)', desc: 'Acompanhe Ações, FIIs, Criptos e Renda Fixa. Integração nativa com Brapi para consolidar cotas, rentabilidade da carteira e diversificação.', color: 'green', popular: true },
  { icon: LPIcons.Budget, title: 'Múltiplos Bancos e Cartões', desc: 'Cadastre inúmeras contas, entenda o limite total dos cartões de crédito, fatura aberta e o impacto deles sobre seu patrimônio líquido.', color: 'blue', popular: false },
  { icon: LPIcons.Target, title: 'Orçamento Inteligente', desc: 'Defina metas por categoria, acompanhe o progresso em tempo real e receba alertas quando estiver perto de estourar. Controle total sem esforço.', color: 'amber', popular: false },
  { icon: LPIcons.Bell, title: 'Alertas Personalizados', desc: 'Configure notificações para gastos incomuns, vencimento de faturas, metas atingidas e oportunidades de economia detectadas pela IA.', color: 'rose', popular: false },
  { icon: LPIcons.Chart, title: 'Relatórios Automáticos', desc: 'Dashboards e gráficos gerados automaticamente. Evolução patrimonial, despesas por categoria, comparativos mensais — tudo visual e intuitivo.', color: 'purple', popular: false },
];

const colorMap: Record<string, { bg: string; text: string; glow: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', glow: 'bg-indigo-500/10', badge: 'bg-indigo-500' },
  green: { bg: 'bg-green-500/10', text: 'text-green-400', glow: 'bg-green-500/10', badge: 'bg-green-500' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'bg-blue-500/10', badge: 'bg-blue-500' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', glow: 'bg-amber-500/10', badge: 'bg-amber-500' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', glow: 'bg-rose-500/10', badge: 'bg-rose-500' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', glow: 'bg-purple-500/10', badge: 'bg-purple-500' },
};

// --- MAIN COMPONENT ---
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 selection:bg-blue-500/30 overflow-x-hidden">
      <Helmet>
        <title>FinAi | Inteligência Artificial para o seu Dinheiro</title>
        <meta name="description" content="Tome o controle da sua vida financeira com análises impulsionadas por IA, gráficos em tempo real, acompanhamento de investimentos e consolidação de contas. FinAi é o seu copiloto financeiro." />
        <meta name="keywords" content="finanças pessoais, inteligência artificial, controle de gastos, investimentos brapi, gestão financeira, financas ia" />
        <meta property="og:title" content="FinAi | Inteligência Artificial para o seu Dinheiro" />
        <meta property="og:description" content="Controle gastos, rastreie investimentos e converse com sua IA financeira pessoal. Tudo em um só lugar." />
        <meta property="og:type" content="website" />
        <meta property="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* ====== HEADER / NAVBAR ====== */}
      <header className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black italic text-lg">F</span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">FinAI</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-bold text-slate-400">
            <button onClick={() => scrollTo('features')} className="hover:text-white transition-colors">Recursos</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-white transition-colors">Como Funciona</button>
            <button onClick={() => scrollTo('testimonials')} className="hover:text-white transition-colors">Depoimentos</button>
            <button onClick={() => scrollTo('faq')} className="hover:text-white transition-colors">FAQ</button>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-blue-600/30"
            >
              Entrar
            </button>
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2"
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>
          </div>
        </div>
        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900/95 backdrop-blur-md border-t border-white/5 px-6 py-4 space-y-3">
            <button onClick={() => scrollTo('features')} className="block w-full text-left text-sm font-bold text-slate-300 hover:text-white py-2">Recursos</button>
            <button onClick={() => scrollTo('how-it-works')} className="block w-full text-left text-sm font-bold text-slate-300 hover:text-white py-2">Como Funciona</button>
            <button onClick={() => scrollTo('testimonials')} className="block w-full text-left text-sm font-bold text-slate-300 hover:text-white py-2">Depoimentos</button>
            <button onClick={() => scrollTo('faq')} className="block w-full text-left text-sm font-bold text-slate-300 hover:text-white py-2">FAQ</button>
          </div>
        )}
      </header>

      {/* ====== HERO SECTION ====== */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-1/4 w-[800px] h-[400px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Social Proof Badge */}
          <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-500/20 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-300">+2.500 pessoas já usam o FinAi</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-8 bg-gradient-to-br from-white via-slate-200 to-slate-500 text-transparent bg-clip-text">
            Pare de perder dinheiro<br />sem perceber.
          </h1>

          <p className="text-lg md:text-xl font-medium text-slate-400 mb-6 max-w-2xl leading-relaxed">
            O FinAi usa Inteligência Artificial para analisar seus gastos, rastrear investimentos e te mostrar <strong className="text-white">exatamente</strong> onde seu dinheiro está indo — tudo em um dashboard único e inteligente.
          </p>

          {/* Trust micro-copy */}
          <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-10">
            <span className="flex items-center gap-1"><LPIcons.Check /> Grátis</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="flex items-center gap-1"><LPIcons.Check /> Sem cartão</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="flex items-center gap-1"><LPIcons.Check /> 2min de setup</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.4)] relative group"
            >
              <span className="relative z-10">Comece Gratuitamente</span>
              <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100"></div>
            </button>
            <button
              onClick={() => scrollTo('features')}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-10 py-5 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all"
            >
              Ver Recursos
            </button>
          </div>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="relative w-full max-w-6xl mx-auto mt-20 z-20 perspective-[2000px]">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
          <div className="shadow-2xl rounded-[2rem] border border-white/10 bg-slate-800 p-2 overflow-hidden mx-4">
            <div className="w-full flex items-center space-x-2 px-4 py-3 bg-slate-800/80 rounded-t-[1.5rem] border-b border-white/5">
              <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
            </div>
            <div className="p-4 grid grid-cols-12 gap-4 opacity-80 h-[400px] overflow-hidden bg-slate-950/50 rounded-b-[1.5rem]">
               <div className="col-span-3 space-y-4">
                 <div className="h-6 w-1/2 bg-white/5 rounded-full"></div>
                 <div className="h-4 w-full bg-white/5 rounded-full mt-8"></div>
                 <div className="h-4 w-full bg-white/5 rounded-full"></div>
                 <div className="h-4 w-5/6 bg-white/5 rounded-full"></div>
                 <div className="h-4 w-full bg-white/5 rounded-full"></div>
               </div>
               <div className="col-span-9 space-y-6">
                 <div className="flex gap-4">
                   <div className="h-24 flex-1 bg-gradient-to-br from-blue-600/20 to-transparent border border-blue-500/20 rounded-2xl"></div>
                   <div className="h-24 flex-1 bg-gradient-to-br from-green-500/20 to-transparent border border-green-500/20 rounded-2xl"></div>
                   <div className="h-24 flex-1 bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/20 rounded-2xl"></div>
                 </div>
                 <div className="h-64 w-full bg-white/5 border border-white/5 rounded-2xl overflow-hidden relative">
                    <div className="absolute bottom-0 w-full h-1/2 bg-blue-600/10 blur-xl"></div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SOCIAL PROOF NUMBERS ====== */}
      <section className="py-16 bg-slate-950 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 2500, suffix: '+', label: 'Usuários Ativos' },
              { value: 12, suffix: 'M+', label: 'R$ Monitorados' },
              { value: 49, suffix: '', label: '★ Avaliação (5.0)', displayPrefix: '4.' },
              { value: 999, suffix: '%', label: 'Uptime', displayPrefix: '99.' },
            ].map((stat, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="space-y-2">
                  <div className="text-3xl md:text-4xl font-black text-white tracking-tight">
                    {stat.displayPrefix || ''}<AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FEATURES SECTION ====== */}
      <section id="features" className="py-24 relative bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-20">
            <div className="inline-block bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Recursos
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">Tudo em um só lugar.</h2>
            <p className="text-slate-400 font-medium text-lg max-w-2xl mx-auto">
              Desenvolvido para eliminar ferramentas fragmentadas e concentrar todo seu poder financeiro numa interface limpa, rápida e inteligente.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const colors = colorMap[feature.color];
              return (
                <AnimatedSection key={i} delay={i * 0.08}>
                  <div className={`relative bg-slate-800/50 border border-white/5 p-10 rounded-[2.5rem] hover:bg-slate-800/80 hover:border-white/10 transition-all group h-full ${feature.popular ? 'ring-1 ring-green-500/30' : ''}`}>
                    {feature.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg shadow-green-500/30">
                        Mais Popular
                      </div>
                    )}
                    {feature.popular && <div className={`absolute top-0 right-0 w-32 h-32 ${colors.glow} rounded-full blur-2xl -mr-10 -mt-10`}></div>}
                    <div className={`w-14 h-14 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform relative z-10`}>
                      <feature.icon />
                    </div>
                    <h3 className="text-xl font-black mb-4 relative z-10">{feature.title}</h3>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed relative z-10">{feature.desc}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="how-it-works" className="py-24 bg-slate-950 relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-20">
            <div className="inline-block bg-green-500/10 text-green-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Simples assim
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">Como funciona?</h2>
            <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto">
              3 passos. 2 minutos. Zero complicação.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Line (desktop only) */}
            <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-blue-500/30 via-blue-500/60 to-blue-500/30"></div>

            {[
              { step: '01', title: 'Crie sua conta', desc: 'Cadastro rápido, sem burocracia. Sem cartão de crédito. Comece a usar em segundos.', color: 'blue' },
              { step: '02', title: 'Cadastre suas contas', desc: 'Adicione bancos, cartões e investimentos. A IA começa a organizar tudo automaticamente.', color: 'indigo' },
              { step: '03', title: 'Receba insights', desc: 'Dashboards inteligentes, alertas e sugestões personalizadas de economia aparecem em tempo real.', color: 'green' },
            ].map((item, i) => (
              <AnimatedSection key={i} delay={i * 0.15}>
                <div className="text-center relative">
                  <div className="w-14 h-14 rounded-full bg-blue-600 text-white text-lg font-black flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg shadow-blue-600/30">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-black mb-3">{item.title}</h3>
                  <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* CTA after steps */}
          <AnimatedSection className="text-center mt-16" delay={0.4}>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-[0_0_40px_rgba(37,99,235,0.3)]"
            >
              Começar Agora — É Grátis
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* ====== TESTIMONIALS ====== */}
      <section id="testimonials" className="py-24 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <AnimatedSection className="text-center mb-20">
            <div className="inline-block bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Depoimentos
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">Quem usa, recomenda.</h2>
            <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto">
              Veja o que nossos usuários estão dizendo sobre o FinAi.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <AnimatedSection key={i} delay={i * 0.1}>
                <div className="bg-slate-800/50 border border-white/5 rounded-[2rem] p-8 hover:border-white/10 transition-all h-full flex flex-col">
                  <div className="mb-4"><LPIcons.Quote /></div>
                  <p className="text-sm font-medium text-slate-300 leading-relaxed flex-grow mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: t.stars }).map((_, j) => <LPIcons.Star key={j} />)}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">{t.name}</div>
                      <div className="text-xs font-bold text-slate-500">{t.role}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FAQ SECTION ====== */}
      <section id="faq" className="py-24 bg-slate-950">
        <div className="max-w-3xl mx-auto px-6">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-block bg-purple-500/10 text-purple-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
              Dúvidas
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-6">Perguntas frequentes.</h2>
            <p className="text-slate-400 font-medium text-lg">
              Tudo que você precisa saber antes de começar.
            </p>
          </AnimatedSection>

          <AnimatedSection className="space-y-3">
            {faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.question} answer={faq.answer} />
            ))}
          </AnimatedSection>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700"></div>
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')" }}></div>

        <AnimatedSection className="max-w-4xl mx-auto px-6 text-center relative z-10 text-white">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 leading-tight">
            Seu dinheiro merece<br />inteligência artificial.
          </h2>
          <p className="text-lg md:text-xl font-medium text-blue-100 mb-8 opacity-90 max-w-2xl mx-auto">
            Junte-se a mais de 2.500 pessoas que pararam de perder dinheiro e tomaram o controle real das suas finanças com o FinAi.
          </p>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-6 text-[11px] font-bold text-blue-200/70 uppercase tracking-widest mb-12">
            <span className="flex items-center gap-1.5"><LPIcons.Shield /> Dados criptografados</span>
            <span className="flex items-center gap-1.5"><LPIcons.Lock /> LGPD Compliant</span>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="bg-white text-blue-900 px-12 py-6 rounded-full text-sm font-black uppercase tracking-[0.2em] transition-all hover:scale-105 shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] mb-6"
          >
            Criar Minha Conta Grátis
          </button>
          <p className="text-sm font-medium text-blue-200/60">
            Sem cartão de crédito • Cancele quando quiser
          </p>
        </AnimatedSection>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="bg-slate-950 border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                  <span className="text-white italic text-xs font-black">F</span>
                </div>
                <span className="text-lg font-black tracking-tighter">FinAI</span>
              </div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">
                Inteligência artificial para transformar a forma como você cuida do seu dinheiro.
              </p>
            </div>
            {/* Produto */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Produto</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo('features')} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Recursos</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Como Funciona</button></li>
                <li><button onClick={() => scrollTo('faq')} className="text-xs font-medium text-slate-500 hover:text-white transition-colors">FAQ</button></li>
              </ul>
            </div>
            {/* Empresa */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Empresa</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Sobre nós</a></li>
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Contato</a></li>
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            {/* Legal */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Privacidade</a></li>
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-xs font-medium text-slate-500 hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            <span>© {new Date().getFullYear()} FinAi. Todos os direitos reservados.</span>
            <div className="flex items-center gap-2 mt-3 md:mt-0 text-slate-500">
              <LPIcons.Shield />
              <span>Dados protegidos com criptografia AES-256</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
