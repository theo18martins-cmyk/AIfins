import React, { useState } from 'react';
import { supabase } from './supabaseClient';

interface LoginProps {
    onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotSent, setForgotSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/dashboard`,
            });
            if (resetError) throw resetError;
            setForgotSent(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { name }
                    }
                });
                if (signUpError) throw signUpError;
                alert('Verifique seu e-mail para confirmar a conta!');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                onSuccess();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-white overflow-hidden font-sans">
            {/* COLUNA FORMULÁRIO (ESQUERDA NO DESKTOP) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white relative">
                {/* BLOBS DE COR EM MOBILE */}
                <div className="lg:hidden absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-400 blur-[80px] rounded-full"></div>
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-400 blur-[80px] rounded-full"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    {/* LOGO MOBILE */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                            <span className="text-3xl font-black">F</span>
                        </div>
                    </div>

                    <div className="mb-12 text-center">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tighter mb-3 leading-tight">
                            {isSignUp ? 'Comece Agora 🚀' : 'Bem-vindo a FinAI! ✨'}
                        </h2>
                        <p className="text-slate-500 text-base font-medium">
                            {isSignUp ? 'Crie sua conta e transforme sua relação com o dinheiro.' : 'Estamos felizes em ter você conosco.'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-5 sm:space-y-6">
                        {isSignUp && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none shadow-sm"
                                    placeholder="Como quer ser chamado?"
                                    required
                                />
                            </div>
                        )}

                        <div className="animate-in fade-in slide-in-from-top-2 delay-75 duration-300">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Seu Melhor Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none shadow-sm"
                                placeholder="exemplo@finai.com"
                                required
                            />
                        </div>

                        <div className="animate-in fade-in slide-in-from-top-2 delay-150 duration-300">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Sua Senha Mestra</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none shadow-sm"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-5 bg-red-50 text-red-600 rounded-2xl text-[11px] font-black uppercase tracking-wider animate-in slide-in-from-top-2 duration-300 flex items-center space-x-3 border border-red-100">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-blue-500/30 active:scale-[0.98] disabled:opacity-50 mt-4 group"
                        >
                            <span className="flex items-center justify-center space-x-2">
                                <span>{loading ? 'Sincronizando...' : (isSignUp ? 'Criar Minha Conta' : 'Acessar Painel')}</span>
                                {!loading && <span className="group-hover:translate-x-1 transition-transform">→</span>}
                            </span>
                        </button>
                    </form>

                    {!isSignUp && !isForgotPassword && (
                        <div className="mt-4 text-center">
                            <button
                                onClick={() => { setIsForgotPassword(true); setError(null); }}
                                className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-all"
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}

                    {isForgotPassword && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-300">
                            {forgotSent ? (
                                <div className="p-5 bg-emerald-50 text-emerald-700 rounded-2xl text-sm font-bold text-center border border-emerald-200">
                                    ✅ E-mail de recuperação enviado! Verifique sua caixa de entrada.
                                    <button onClick={() => { setIsForgotPassword(false); setForgotSent(false); }} className="block mt-3 mx-auto text-xs text-slate-400 hover:text-blue-600 transition-all">Voltar ao login</button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword} className="space-y-4">
                                    <p className="text-sm text-slate-500 font-bold text-center">Digite seu e-mail para receber o link de recuperação</p>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none shadow-sm" placeholder="seu@email.com" required />
                                    {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                                    <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all shadow-xl disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar Link de Recuperação'}</button>
                                    <button type="button" onClick={() => { setIsForgotPassword(false); setError(null); }} className="w-full text-sm font-bold text-slate-400 hover:text-slate-600 transition-all">← Voltar ao login</button>
                                </form>
                            )}
                        </div>
                    )}

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setIsSignUp(!isSignUp); setIsForgotPassword(false); setError(null); }}
                            className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-all border-b-2 border-transparent hover:border-blue-600 pb-1"
                        >
                            {isSignUp ? 'Já faz parte da elite? Entre aqui' : 'Novo por aqui? Crie seu acesso premium'}
                        </button>
                    </div>
                </div>
            </div>

            {/* COLUNA VISUAL (DIREITA NO DESKTOP) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-transparent to-purple-600/20 z-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&auto=format&fit=crop&q=80"
                    alt="FinAI Dashboard Preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-110 blur-[2px] hover:blur-none hover:scale-100 transition-all duration-1000"
                />
                <div className="relative z-20 flex flex-col justify-center px-20 text-right items-end">
                    <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-12 animate-in slide-in-from-right-10 duration-700">
                        <span className="text-4xl font-black">F</span>
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-6 leading-none animate-in slide-in-from-right-10 delay-150 duration-700">
                        Inteligência <br />
                        <span className="text-blue-500">Financeira</span> <br />
                        Sem Limites.
                    </h1>
                    <p className="text-xl text-slate-400 font-medium max-w-md leading-relaxed animate-in slide-in-from-right-10 delay-300 duration-700">
                        Acompanhe seus gastos, defina metas audaciosas e deixe nossa IA otimizar seu patrimônio em tempo real.
                    </p>
                </div>

                {/* DECORATIVE ELEMENTS */}
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full"></div>
            </div>
        </div>
    );
};
export default Login;
