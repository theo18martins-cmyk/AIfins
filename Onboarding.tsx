import React, { useState } from 'react';

interface OnboardingProps {
    onComplete: () => void;
    userName?: string;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, userName }) => {
    const [step, setStep] = useState(1);
    const totalSteps = 4;

    const steps = [
        {
            title: `Bem-vindo ao FinAI, ${userName || 'Investidor'}! ✨`,
            description: "Sua jornada para a liberdade financeira começa aqui. Vamos configurar seu painel em 1 minuto?",
            icon: "🚀",
            color: "from-blue-600 to-blue-400"
        },
        {
            title: "Contas e Cartões 💳",
            description: "O primeiro passo é cadastrar de onde vem e para onde vai seu dinheiro. Adicione seus bancos e cartões para ter uma visão real do seu saldo.",
            icon: "🏦",
            color: "from-purple-600 to-purple-400"
        },
        {
            title: "Transações Inteligentes 📊",
            description: "Registre seus gastos e ganhos. Nossa IA categoriza tudo automaticamente para você entender para onde cada centavo está indo.",
            icon: "📈",
            color: "from-emerald-600 to-emerald-400"
        },
        {
            title: "Seu Assistente Pessoal (IA) 🤖",
            description: "Use o chat flutuante para perguntar qualquer coisa: 'Posso comprar um iPhone este mês?' ou 'Qual minha maior despesa?'. No início, seus dados estarão zerados até você começar a registrar!",
            icon: "✨",
            color: "from-amber-500 to-orange-400"
        }
    ];

    const currentStepData = steps[step - 1];

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden relative">
                {/* HEAD DECORATION */}
                <div className={`h-40 bg-gradient-to-br ${currentStepData.color} flex items-center justify-center relative transition-all duration-500`}>
                    <span className="text-7xl animate-bounce">{currentStepData.icon}</span>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                        <div
                            className="h-full bg-white transition-all duration-500"
                            style={{ width: `${(step / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>

                <div className="p-10 text-center">
                    <div className="mb-8">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4 block">
                            Passo {step} de {totalSteps}
                        </span>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-4 leading-tight transition-all duration-300">
                            {currentStepData.title}
                        </h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            {currentStepData.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-12">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-8 py-4 text-slate-400 font-bold hover:text-slate-600 transition-all"
                            >
                                Voltar
                            </button>
                        ) : (
                            <div></div>
                        )}

                        <button
                            onClick={handleNext}
                            className={`px-12 py-5 bg-gradient-to-r ${currentStepData.color} text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all`}
                        >
                            {step === totalSteps ? 'Começar Agora!' : 'Próximo'}
                        </button>
                    </div>
                </div>

                {/* SKIP BUTTON */}
                <button
                    onClick={onComplete}
                    className="absolute top-6 right-8 text-white/50 hover:text-white font-bold text-xs uppercase tracking-widest transition-all"
                >
                    Pular Tutorial
                </button>
            </div>
        </div>
    );
};

export default Onboarding;
