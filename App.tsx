import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Line, LineChart
} from 'recharts';
import { AnalysisMode, BankAccount } from './types';
import { GeminiService } from './services/geminiService';
import { supabase } from './supabaseClient';
import Login from './Login';
import Onboarding from './Onboarding';
import { User } from '@supabase/supabase-js';

// Ícones
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Transactions: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012 2h2a2 2 0 012-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Budget: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  Debts: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Goals: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Family: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Whatsapp: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.675 1.438 5.662 1.439h.005c6.552 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>,
  User: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Settings: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Calendar: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  TrendingUp: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  Close: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  Pencil: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Banknote: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  ArrowDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
  CreditCard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>,
  Sparkles: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4M4 19h4m9-15v4m-2-2h4m-5 15l-3-8 10-2-7 10z" /></svg>,
  Send: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  Bank: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  Shield: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
};

// Componente Modal Dinâmico
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
          <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-white rounded-full transition-all shadow-sm hover:shadow-md"><Icons.Close /></button>
        </div>
        <div className="p-8 max-h-[80vh] overflow-y-auto no-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const gemini = useMemo(() => new GeminiService(), []);
  const [activeTab, setActiveTab] = useState<AnalysisMode>(AnalysisMode.DASHBOARD);
  const [dateRange, setDateRange] = useState({ from: '2025-10-01', to: '2026-01-31' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estado para modal de confirmação de exclusão
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

  // Chat Flutuante
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([
    { role: 'model', parts: [{ text: "Olá! Sou o FinAI Assistant. Como posso ajudar com suas finanças hoje?" }] }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isTyping]);

  // Estados dos Dados
  const [categories, setCategories] = useState(['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Outros']);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingBankId, setEditingBankId] = useState<string | null>(null);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingBudgetName, setEditingBudgetName] = useState<string | null>(null);
  const [editingDebtId, setEditingDebtId] = useState<string | null>(null);
  const [partialPaymentDebtId, setPartialPaymentDebtId] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null);
  const [withdrawalGoalId, setWithdrawalGoalId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Autenticação e Onboarding
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [invitePermissions, setInvitePermissions] = useState({
    view_all: true,
    edit_transactions: true,
    edit_banks: true,
    is_admin: false
  });
  const [generatedInviteLink, setGeneratedInviteLink] = useState('');
  const [inviteToAccept, setInviteToAccept] = useState<{ code: string, familyName: string, inviterName: string } | null>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [isFamilySettingsOpen, setIsFamilySettingsOpen] = useState(false);
  const [editingFamilyName, setEditingFamilyName] = useState('');
  const [deleteVerificationInput, setDeleteVerificationInput] = useState('');
  const [selectedMemberForPermissions, setSelectedMemberForPermissions] = useState<any>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [memberPermissionsBuffer, setMemberPermissionsBuffer] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [manualInviteCode, setManualInviteCode] = useState('');
  const [goals, setGoals] = useState<any[]>([]);

  // Foto de Perfil
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);

  // Helper para verificar permissões
  const hasPermission = (permission: string) => {
    if (!userProfile) return false;
    // Usuários sem família têm permissão total sobre seus próprios dados
    if (!userProfile.family_id) return true;
    // Admins de família têm todas as permissões
    if (userProfile.family_role === 'admin') return true;
    if (permission === 'is_admin') return userProfile.family_role === 'admin';
    return userProfile.family_permissions?.[permission] === true;
  };

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }
      setAuthLoading(false);
    });

    // Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        setShowOnboarding(false);
        setUserProfile(null);
      }
    });

    // Capturar convite da URL e salvar no sessionStorage para persistência
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite');
    if (inviteCode) {
      sessionStorage.setItem('pendingInvite', inviteCode);
    }

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && userProfile) {
      handleAcceptInvite();
      fetchAllData();
      if (userProfile.family_id) {
        fetchFamilyMembers(userProfile.family_id);
      }
    }
  }, [user, userProfile]);

  const fetchAllData = async () => {
    if (!user || !userProfile) return;

    try {
      const familyId = userProfile.family_id;
      let queryUserIds = [user.id];

      if (familyId) {
        const { data: members } = await supabase
          .from('profiles')
          .select('id')
          .eq('family_id', familyId);
        if (members) queryUserIds = members.map(m => m.id);
      }

      // Fetch Transactions
      const { data: txs } = await supabase.from('transactions').select('*').in('user_id', queryUserIds).order('date', { ascending: false });
      setTransactions(txs?.map(t => ({
        id: t.id,
        user_id: t.user_id,
        date: new Date(t.date).toLocaleDateString('pt-BR'),
        desc: t.description,
        cat: t.category,
        acc: t.account || 'N/A',
        user: familyMembers.find(m => m.id === t.user_id)?.name || 'Membro',
        val: Number(t.value),
        status: t.status
      })) || []);

      // Fetch Bank Accounts
      const { data: banks } = await supabase.from('bank_accounts').select('*').in('user_id', queryUserIds);
      setBankAccounts(banks?.map(b => ({
        id: b.id,
        name: b.name,
        type: b.type,
        balance: Number(b.balance),
        color: b.color || 'bg-blue-600'
      })) || []);

      // Fetch Credit Cards
      const { data: cards } = await supabase.from('credit_cards').select('*').in('user_id', queryUserIds);
      setCreditCards(cards?.map(c => ({
        id: c.id,
        name: c.name,
        bank: c.name, // Use name as bank since bank column doesn't exist
        limit: Number(c.credit_limit) || 0,
        bill: Number(c.bill) || 0,
        paid: Number(c.paid) || 0,
        color: c.color || 'bg-slate-600'
      })) || []);

      // Fetch Budgets
      const { data: bgs } = await supabase.from('budgets').select('*').in('user_id', queryUserIds);
      setBudgets(bgs?.map(b => ({
        id: b.id,
        category: b.category,
        planned: Number(b.planned),
        realized: Number(b.realized),
        icon: b.icon || '📊',
        color: b.color || 'bg-slate-500'
      })) || []);

      // Fetch Debts
      const { data: dts } = await supabase.from('debts').select('*').in('user_id', queryUserIds);
      setDebts(dts?.map(d => ({
        id: d.id,
        name: d.name,
        bank: d.bank,
        total: Number(d.total),
        remaining: Number(d.remaining),
        dueDate: new Date(d.due_date).toLocaleDateString('pt-BR'),
        status: d.status,
        color: d.color || 'bg-blue-500',
        totalInstallments: d.total_installments || 1,
        paidInstallments: d.paid_installments || 0
      })) || []);

      // Fetch Goals
      const { data: gls } = await supabase.from('goals').select('*').in('user_id', queryUserIds);
      setGoals(gls?.map(g => ({
        id: g.id,
        title: g.title,
        target: Number(g.target),
        current: Number(g.current),
        img: g.image_url || 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2071&auto=format&fit=crop'
      })) || []);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
  };



  const handleAcceptInvite = async () => {
    const params = new URLSearchParams(window.location.search);
    const inviteCode = params.get('invite') || sessionStorage.getItem('pendingInvite');
    if (inviteCode && user) {
      validateAndShowInvite(inviteCode);
    }
  };

  const validateAndShowInvite = async (inviteCode: string) => {
    if (!user) return;
    try {
      const { data: invite, error: iError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (iError || !invite) {
        showToast("Convite inválido ou expirado.", "error");
        sessionStorage.removeItem('pendingInvite');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (userProfile?.family_id === invite.family_id) {
        showToast("Você já faz parte desta família!", "info");
        sessionStorage.removeItem('pendingInvite');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      const { data: family } = await supabase.from('families').select('name').eq('id', invite.family_id).single();
      const { data: inviter } = await supabase.from('profiles').select('name').eq('id', invite.created_by).single();

      setInviteToAccept({
        code: inviteCode,
        familyName: family?.name || 'Família sem nome',
        inviterName: inviter?.name || 'Um familiar'
      });
    } catch (err) {
      console.error(err);
      showToast('Erro ao validar convite', 'error');
    }
  };

  const handleManualJoin = () => {
    if (!manualInviteCode.trim()) {
      showToast("Digite o código do convite", "info");
      return;
    }
    validateAndShowInvite(manualInviteCode.trim().toUpperCase());
    setManualInviteCode('');
  };

  const confirmAcceptInvite = async () => {
    if (!inviteToAccept || !user) return;

    try {
      const { data: invite, error: iError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('invite_code', inviteToAccept.code)
        .eq('status', 'pending')
        .single();

      if (iError || !invite) throw new Error('Convite inválido');

      // Vincular usuário à família com as permissões do convite
      await supabase
        .from('profiles')
        .update({
          family_id: invite.family_id,
          family_role: 'member',
          family_permissions: invite.permissions
        })
        .eq('id', user.id);

      // Marcar convite como usado
      await supabase
        .from('family_invitations')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      setInviteToAccept(null);
      sessionStorage.removeItem('pendingInvite');
      showToast("Bem-vindo à nova família!", "success");

      // Limpar URL e recarregar dados
      window.history.replaceState({}, document.title, window.location.pathname);
      fetchAllData();
      if (invite.family_id) fetchFamilyMembers(invite.family_id);
    } catch (err) {
      console.error(err);
      showToast('Erro ao aceitar convite', 'error');
    }
  };

  const fetchFamilyMembers = async (familyId: string) => {
    try {
      const { data: family, error: fError } = await supabase
        .from('families')
        .select('name')
        .eq('id', familyId)
        .single();

      if (family) setFamilyName(family.name);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('family_id', familyId);

      if (error) throw error;
      setFamilyMembers(data || []);
    } catch (err) {
      console.error("Erro ao buscar membros da família:", err);
    }
  };

  const handleUpdateFamilyName = async () => {
    if (!userProfile?.family_id || !editingFamilyName.trim()) return;

    try {
      const { error } = await supabase
        .from('families')
        .update({ name: editingFamilyName.trim() })
        .eq('id', userProfile.family_id);

      if (error) throw error;

      setFamilyName(editingFamilyName.trim());
      setIsFamilySettingsOpen(false);
      showToast("Família atualizada com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar família.", "error");
    }
  };

  const handleDeleteFamily = async () => {
    if (!userProfile?.family_id) return;

    if (deleteVerificationInput !== 'EXCLUIR') {
      showToast("Digite EXCLUIR para confirmar", "error");
      return;
    }

    showDeleteConfirmation(
      "Excluir Família",
      "Isso removerá todos os membros do grupo e apagará o registro da família. Os dados individuais serão mantidos. Deseja continuar?",
      async () => {
        try {
          const familyId = userProfile.family_id;

          // 1. Remover vínculo de todos os membros
          const { error: pError } = await supabase
            .from('profiles')
            .update({
              family_id: null,
              family_role: null,
              family_permissions: null
            })
            .eq('family_id', familyId);

          if (pError) throw pError;

          // 2. Deletar a família
          const { error: fError } = await supabase
            .from('families')
            .delete()
            .eq('id', familyId);

          if (fError) throw fError;

          // 3. Limpar estado local
          setUserProfile({ ...userProfile, family_id: null, family_role: null, family_permissions: null });
          setFamilyMembers([]);
          setFamilyName('');
          setIsFamilySettingsOpen(false);
          showToast("Família excluída com sucesso!", "success");
          fetchAllData();
        } catch (err) {
          console.error(err);
          showToast("Erro ao excluir família.", "error");
        }
      }
    );
  };

  const handleUpdateMemberPermissions = async () => {
    if (!selectedMemberForPermissions) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          family_role: memberPermissionsBuffer.role,
          family_permissions: {
            view_all: memberPermissionsBuffer.view_all,
            edit_transactions: memberPermissionsBuffer.edit_transactions,
            edit_banks: memberPermissionsBuffer.edit_banks
          }
        })
        .eq('id', selectedMemberForPermissions.id);

      if (error) throw error;

      showToast(`Permissões de ${selectedMemberForPermissions.name} atualizadas!`, "success");
      setIsPermissionsModalOpen(false);
      fetchFamilyMembers(userProfile.family_id);
    } catch (err) {
      console.error(err);
      showToast("Erro ao atualizar permissões", "error");
    }
  };

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
        if (!data.has_completed_onboarding) {
          setShowOnboarding(true);
        }
      }
    } catch (err) {
      console.error("Erro ao verificar onboarding:", err);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true })
        .eq('id', user.id);

      if (!error) {
        setShowOnboarding(false);
        showToast("Bem-vindo ao FinAI! Seu perfil foi configurado.");
      }
    } catch (err) {
      console.error("Erro ao completar onboarding:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Função para salvar alterações do perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    const profileNameInput = document.getElementById('profileName') as HTMLInputElement;
    const newName = profileNameInput?.value?.trim();

    if (!newName) {
      showToast("Por favor, informe um nome de exibição.", "error");
      return;
    }

    if (!user) {
      showToast("Usuário não autenticado.", "error");
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ name: newName })
        .eq('id', user.id);

      if (error) {
        console.error("Erro ao salvar perfil:", error);
        showToast("Erro ao salvar alterações. Tente novamente.", "error");
        return;
      }

      // Atualiza o estado local
      setUserProfile((prev: any) => ({ ...prev, name: newName }));
      showToast("Perfil atualizado com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      showToast("Erro ao salvar alterações. Tente novamente.", "error");
    }
  };

  // Função de upload de foto de perfil
  const handleProfilePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validação de tipo e tamanho
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast("Formato inválido. Use JPG, PNG, WebP ou GIF.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 5MB.", "error");
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        showToast("Erro ao enviar imagem. Verifique se o bucket 'avatars' existe.", "error");
        return;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar perfil no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error("Erro ao atualizar perfil:", updateError);
        showToast("Erro ao salvar foto no perfil.", "error");
        return;
      }

      // Atualizar estado local
      setUserProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));
      showToast("Foto de perfil atualizada com sucesso!", "success");

    } catch (err) {
      console.error("Erro no upload de foto:", err);
      showToast("Erro inesperado ao enviar foto.", "error");
    } finally {
      setIsUploadingPhoto(false);
      // Limpar input para permitir reenvio do mesmo arquivo
      if (profilePhotoInputRef.current) {
        profilePhotoInputRef.current.value = '';
      }
    }
  };

  // Formulário do Modal
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    category: 'Alimentação',
    status: 'Pago',
    type: 'Despesa',
    paymentMethod: 'Dinheiro',
    selectedCardId: '',
    selectedBankAccountId: '',
    cardUsageType: 'Crédito',
    budgetMeta: '',
    budgetReal: '',
    debtTotal: '',
    debtRemaining: '',
    debtDueDate: '',
    debtBank: '',
    paymentAmount: '',
    goalTarget: '',
    goalContribution: '',
    goalWithdrawal: '',
    goalImageUrl: '',
    cardLimit: '',
    cardBill: '',
    cardPaid: '',
    cardColor: 'bg-blue-600',
    bankType: 'Conta Corrente' as BankAccount['type'],
    bankBalance: '',
    bankColor: 'bg-blue-600',
    installments: '1'
  });

  // Função para obter imagem temática baseada no título da meta
  const getGoalImageByTitle = (title: string): string => {
    const titleLower = title.toLowerCase();
    const themeImages: { keywords: string[], url: string }[] = [
      { keywords: ['carro', 'veículo', 'automóvel', 'moto', 'motocicleta'], url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400' },
      { keywords: ['casa', 'apartamento', 'imóvel', 'moradia', 'lar'], url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400' },
      { keywords: ['viagem', 'férias', 'passeio', 'turismo', 'praia'], url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400' },
      { keywords: ['celular', 'iphone', 'smartphone', 'telefone'], url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
      { keywords: ['notebook', 'computador', 'laptop', 'pc', 'macbook'], url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400' },
      { keywords: ['faculdade', 'curso', 'estudo', 'educação', 'formação'], url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400' },
      { keywords: ['casamento', 'festa', 'noiva', 'noivo'], url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400' },
      { keywords: ['reserva', 'emergência', 'segurança', 'poupança'], url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400' },
      { keywords: ['investimento', 'ações', 'bolsa', 'renda'], url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400' },
      { keywords: ['roupa', 'vestuário', 'moda', 'tênis', 'sapato'], url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400' },
      { keywords: ['reforma', 'decoração', 'móveis', 'móvel'], url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400' },
      { keywords: ['negócio', 'empresa', 'empreendimento', 'loja'], url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400' },
    ];

    for (const theme of themeImages) {
      if (theme.keywords.some(keyword => titleLower.includes(keyword))) {
        return theme.url;
      }
    }

    // Imagem padrão genérica de finanças/metas
    return 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400';
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Funções de Chat
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    const newHistory: any = [...chatMessages, { role: 'user', parts: [{ text: userMsg }] }];
    setChatMessages(newHistory);
    setIsTyping(true);

    try {
      // Calcular resumos financeiros para dar contexto à IA
      const totalBankBalance = bankAccounts.reduce((acc, b) => acc + b.balance, 0);
      const totalCreditLimit = creditCards.reduce((acc, c) => acc + c.limit, 0);
      const totalCreditBill = creditCards.reduce((acc, c) => acc + c.bill, 0);
      const creditUsagePercent = totalCreditLimit > 0 ? ((totalCreditBill / totalCreditLimit) * 100).toFixed(1) : '0';

      const totalIncome = transactions.filter(t => t.val > 0).reduce((acc, t) => acc + t.val, 0);
      const totalExpenses = Math.abs(transactions.filter(t => t.val < 0).reduce((acc, t) => acc + t.val, 0));
      const monthlyBalance = totalIncome - totalExpenses;

      const totalDebtRemaining = debts.reduce((acc, d) => acc + d.remaining, 0);
      const goalsProgress = goals.map(g => ({
        title: g.title,
        current: g.current,
        target: g.target,
        percent: g.target > 0 ? ((g.current / g.target) * 100).toFixed(0) : '0'
      }));

      // Agrupar transações por categoria para análise
      const expensesByCategory: { [key: string]: number } = {};
      transactions.filter(t => t.val < 0).forEach(t => {
        const cat = t.cat || 'Outros';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(t.val);
      });

      const dataContext = `
📊 RESUMO FINANCEIRO DO USUÁRIO:

💰 SALDO E CONTAS:
- Saldo total em contas: R$ ${totalBankBalance.toLocaleString('pt-BR')}
- Contas bancárias: ${bankAccounts.map(b => `${b.name}: R$ ${b.balance.toLocaleString('pt-BR')}`).join(', ') || 'Nenhuma'}

💳 CARTÕES DE CRÉDITO:
- Limite total: R$ ${totalCreditLimit.toLocaleString('pt-BR')}
- Fatura atual: R$ ${totalCreditBill.toLocaleString('pt-BR')} (${creditUsagePercent}% do limite)
- Cartões: ${creditCards.map(c => `${c.name}: R$ ${c.bill.toLocaleString('pt-BR')} / R$ ${c.limit.toLocaleString('pt-BR')}`).join(', ') || 'Nenhum'}

📈 FLUXO DO PERÍODO:
- Receitas: R$ ${totalIncome.toLocaleString('pt-BR')}
- Despesas: R$ ${totalExpenses.toLocaleString('pt-BR')}
- Saldo do período: R$ ${monthlyBalance.toLocaleString('pt-BR')} ${monthlyBalance >= 0 ? '✅' : '⚠️'}

📉 GASTOS POR CATEGORIA:
${Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => `- ${cat}: R$ ${val.toLocaleString('pt-BR')}`).join('\n') || '- Nenhuma despesa registrada'}

📋 DÍVIDAS:
- Total em aberto: R$ ${totalDebtRemaining.toLocaleString('pt-BR')}
- Dívidas: ${debts.map(d => `${d.name}: R$ ${d.remaining.toLocaleString('pt-BR')} (vence ${d.dueDate})`).join(', ') || 'Nenhuma'}

🎯 METAS:
${goalsProgress.map(g => `- ${g.title}: R$ ${g.current.toLocaleString('pt-BR')} / R$ ${g.target.toLocaleString('pt-BR')} (${g.percent}%)`).join('\n') || '- Nenhuma meta definida'}

📝 ÚLTIMAS TRANSAÇÕES:
${transactions.slice(0, 10).map(t => `- ${t.date}: ${t.desc} (${t.cat}) - R$ ${t.val.toLocaleString('pt-BR')}`).join('\n') || '- Nenhuma transação'}
      `;

      const response = await gemini.sendMessage(newHistory, dataContext);
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error?.message === 'RATE_LIMIT_REACHED'
        ? "Ops! 😅 Estou um pouco ocupado agora. Tente novamente em alguns segundos!"
        : "Desculpe, tive um probleminha aqui. 🙈 Pode tentar de novo?";
      setChatMessages(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Funções de Ação
  const handleCancelTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Identificar se a transação estava vinculada a uma conta bancária
    // O formato do acc é "NomeDoBanco (Crédito)" ou "NomeDoBanco (Débito)"
    const accMatch = transaction.acc.match(/^(.+)\s*\((Crédito|Débito)\)$/);
    if (accMatch) {
      const bankName = accMatch[1].trim();
      const bank = bankAccounts.find(b => b.name === bankName);

      if (bank) {
        // Reverter o saldo: se foi despesa (negativo), adicionar de volta; se foi receita (positivo), subtrair
        setBankAccounts(prev => prev.map(b =>
          b.id === bank.id ? { ...b, balance: b.balance - transaction.val } : b
        ));
      }
    }

    // Remover a transação da lista
    setTransactions(prev => prev.filter(t => t.id !== transactionId));
    showToast("Transação cancelada com sucesso!");
  };

  const handleEditTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;

    // Determinar o tipo de transação
    const isExpense = transaction.val < 0;

    // Tentar identificar o método de pagamento e conta/cartão
    let paymentMethod = 'Dinheiro';
    let selectedCardId = '';
    let selectedBankAccountId = '';
    let cardUsageType = 'Crédito';

    const accMatch = transaction.acc.match(/^(.+)\s*\((Crédito|Débito)\)$/);
    if (accMatch) {
      const accountName = accMatch[1].trim();
      const usageType = accMatch[2];

      // Verificar se é um cartão
      const card = creditCards.find(c => c.name === accountName);
      if (card) {
        paymentMethod = 'Cartão';
        selectedCardId = card.id;
        cardUsageType = usageType;
      } else {
        // Verificar se é uma conta bancária
        const bank = bankAccounts.find(b => b.name === accountName);
        if (bank) {
          paymentMethod = 'Dinheiro';
          selectedBankAccountId = bank.id;
        }
      }
    }

    setFormData({
      ...formData,
      name: transaction.desc,
      value: Math.abs(transaction.val).toString(),
      category: transaction.cat,
      status: transaction.status,
      type: isExpense ? 'Despesa' : 'Receita',
      paymentMethod,
      selectedCardId,
      selectedBankAccountId,
      cardUsageType: cardUsageType as 'Crédito' | 'Débito'
    });

    setEditingTransactionId(transactionId);
    setIsModalOpen(true);
  };

  const handlePayDebt = (id: string) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, remaining: 0, status: 'Em dia' } : d));
    showToast("Dívida marcada como paga com sucesso!");
  };

  const handlePayInstallment = async (debt: typeof debts[0]) => {
    if (!debt.totalInstallments || debt.totalInstallments <= 1) return;

    const installmentValue = debt.total / debt.totalInstallments;
    const newRemaining = Math.max(0, debt.remaining - installmentValue);
    const newPaidInstallments = (debt.paidInstallments || 0) + 1;
    const newStatus = newRemaining === 0 ? 'Em dia' : debt.status;

    const { error } = await supabase
      .from('debts')
      .update({
        remaining: newRemaining,
        paid_installments: newPaidInstallments,
        status: newStatus
      })
      .eq('id', debt.id);

    if (error) {
      console.error("Erro ao pagar parcela:", error);
      showToast("Erro ao pagar parcela.", "error");
      return;
    }

    setDebts(prev => prev.map(d => d.id === debt.id ? {
      ...d,
      remaining: newRemaining,
      paidInstallments: newPaidInstallments,
      status: newStatus
    } : d));

    showToast(`Parcela ${newPaidInstallments}/${debt.totalInstallments} paga! (R$ ${installmentValue.toFixed(2)})`, "success");
  };

  // Helper para abrir modal de confirmação
  const showDeleteConfirmation = (title: string, message: string, onConfirm: () => void) => {
    setDeleteConfirmation({ isOpen: true, title, message, onConfirm });
  };

  // Funções de exclusão
  const handleDeleteCard = (cardId: string) => {
    const card = creditCards.find(c => c.id === cardId);
    showDeleteConfirmation(
      "Excluir Cartão",
      `Tem certeza que deseja excluir o cartão "${card?.name}"? Esta ação não pode ser desfeita.`,
      () => {
        setCreditCards(prev => prev.filter(c => c.id !== cardId));
        showToast("Cartão excluído com sucesso!");
      }
    );
  };

  const handleDeleteBank = (bankId: string) => {
    const bank = bankAccounts.find(b => b.id === bankId);
    showDeleteConfirmation(
      "Excluir Conta",
      `Tem certeza que deseja excluir a conta "${bank?.name}"? Esta ação não pode ser desfeita.`,
      () => {
        setBankAccounts(prev => prev.filter(b => b.id !== bankId));
        showToast("Conta excluída com sucesso!");
      }
    );
  };

  const handleDeleteBudget = (category: string) => {
    showDeleteConfirmation(
      "Excluir Orçamento",
      `Tem certeza que deseja excluir o orçamento "${category}"? Esta ação não pode ser desfeita.`,
      () => {
        setBudgets(prev => prev.filter(b => b.category !== category));
        showToast("Orçamento excluído com sucesso!");
      }
    );
  };

  const handleDeleteDebt = (debtId: string) => {
    const debt = debts.find(d => d.id === debtId);
    showDeleteConfirmation(
      "Excluir Dívida",
      `Tem certeza que deseja excluir a dívida "${debt?.name}"? Esta ação não pode ser desfeita.`,
      async () => {
        const { error } = await supabase.from('debts').delete().eq('id', debtId);
        if (error) {
          console.error("Erro ao excluir dívida:", error);
          showToast("Erro ao excluir dívida.", "error");
          return;
        }
        setDebts(prev => prev.filter(d => d.id !== debtId));
        showToast("Dívida excluída com sucesso!");
      }
    );
  };

  const handleDeleteGoal = (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    showDeleteConfirmation(
      "Excluir Meta",
      `Tem certeza que deseja excluir a meta "${goal?.title}"? Esta ação não pode ser desfeita.`,
      async () => {
        const { error } = await supabase.from('goals').delete().eq('id', goalId);
        if (error) {
          console.error("Erro ao excluir meta:", error);
          showToast("Erro ao excluir meta.", "error");
          return;
        }
        setGoals(prev => prev.filter(g => g.id !== goalId));
        showToast("Meta excluída com sucesso!");
      }
    );
  };

  // Atualizar handleCancelTransaction para usar confirmação
  const handleCancelTransactionWithConfirmation = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId);
    showDeleteConfirmation(
      "Cancelar Transação",
      `Tem certeza que deseja cancelar a transação "${transaction?.desc}"? O saldo será revertido.`,
      () => handleCancelTransaction(transactionId)
    );
  };



  const handleConnectWhatsapp = () => {
    showToast("Tentando conexão com WhatsApp...");
    setTimeout(() => showToast("Conectado com sucesso ao FinAI Intelligence!"), 1500);
  };

  const handleSendMessage = () => {
    window.open('https://wa.me/5511938522287', '_blank');
    showToast("Abrindo conversa com FinAI Agent...", "info");
  };

  const handleInviteFamily = () => {
    setIsInviteModalOpen(true);
  };

  const generateInvite = async () => {
    if (!user) return;

    try {
      let familyId = userProfile?.family_id;

      // Se não tem família, cria uma
      if (!familyId) {
        const { data: family, error: fError } = await supabase
          .from('families')
          .insert({
            name: `Família de ${userProfile?.name || user.email}`,
            owner_id: user.id
          })
          .select()
          .single();

        if (fError) throw fError;
        familyId = family.id;

        // Atualiza perfil como admin da nova família
        await supabase
          .from('profiles')
          .update({ family_id: familyId, family_role: 'admin' })
          .eq('id', user.id);

        // Atualiza estado local
        setUserProfile({ ...userProfile, family_id: familyId, family_role: 'admin' });
      }

      // Gerar código único
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data: invite, error: iError } = await supabase
        .from('family_invitations')
        .insert({
          family_id: familyId,
          invite_code: inviteCode,
          created_by: user.id,
          permissions: invitePermissions
        })
        .select()
        .single();

      if (iError) throw iError;

      const link = `${window.location.origin}?invite=${inviteCode}`;
      setGeneratedInviteLink(link);
      navigator.clipboard.writeText(link);

      // Atualizar lista de membros para incluir o criador agora admin
      if (familyId) fetchFamilyMembers(familyId);

      showToast("Link de convite gerado e copiado!", "success");
    } catch (err) {
      console.error("Erro ao gerar convite:", err);
      showToast("Erro ao criar convite.", "error");
    }
  };

  const handleEditBudget = (budget: typeof budgets[0]) => {
    setEditingBudgetName(budget.category);
    setFormData({
      ...formData,
      name: budget.category,
      budgetMeta: budget.planned.toString(),
      budgetReal: budget.realized.toString()
    });
    setIsModalOpen(true);
  };

  const handleEditDebt = (debt: typeof debts[0]) => {
    setEditingDebtId(debt.id);
    setFormData({
      ...formData,
      name: debt.name,
      debtBank: debt.bank,
      debtTotal: debt.total.toString(),
      debtRemaining: debt.remaining.toString(),
      debtDueDate: debt.dueDate
    });
    setIsModalOpen(true);
  };

  const handleOpenPartialPayment = (debt: typeof debts[0]) => {
    setPartialPaymentDebtId(debt.id);
    setFormData({
      ...formData,
      paymentAmount: ''
    });
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal: typeof goals[0]) => {
    setEditingGoalId(goal.id);
    setFormData({
      ...formData,
      name: goal.title,
      goalTarget: goal.target.toString()
    });
    setIsModalOpen(true);
  };

  const handleOpenContribution = (goal: typeof goals[0]) => {
    setContributionGoalId(goal.id);
    setFormData({
      ...formData,
      goalContribution: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenWithdrawal = (goal: typeof goals[0]) => {
    setWithdrawalGoalId(goal.id);
    setFormData({
      ...formData,
      goalWithdrawal: ''
    });
    setIsModalOpen(true);
  };

  const handleEditCard = (card: typeof creditCards[0]) => {
    setEditingCardId(card.id);
    setFormData({
      ...formData,
      name: card.name,
      cardLimit: card.limit.toString(),
      cardBill: card.bill.toString(),
      cardPaid: card.paid.toString(),
      cardColor: card.color
    });
    setIsModalOpen(true);
  };

  const handleEditBank = (bank: BankAccount) => {
    setEditingBankId(bank.id);
    setFormData({
      ...formData,
      name: bank.name,
      bankType: bank.type,
      bankBalance: bank.balance.toString(),
      bankColor: bank.color
    });
    setIsModalOpen(true);
  };

  // Lógica de Adição do Modal
  const handleModalSubmit = async () => {
    if (editingCardId) {
      if (!formData.name || !formData.cardLimit) {
        showToast("Por favor, preencha o nome e o limite do cartão.");
        return;
      }
      const updatedCard = {
        name: formData.name,
        credit_limit: parseFloat(formData.cardLimit) || 0,
        bill: parseFloat(formData.cardBill) || 0,
        color: formData.cardColor
      };
      const { error } = await supabase.from('credit_cards').update(updatedCard).eq('id', editingCardId);
      if (error) { showToast("Erro ao atualizar cartão.", "error"); return; }
      setCreditCards(prev => prev.map(c => c.id === editingCardId ? { ...c, name: updatedCard.name, limit: updatedCard.credit_limit, bill: updatedCard.bill, color: updatedCard.color } : c));
      showToast("Cartão atualizado com sucesso!", "success");
    } else if (isAddingCard) {
      if (!formData.name || !formData.cardLimit) {
        showToast("Por favor, preencha o nome e o limite do cartão.");
        return;
      }
      const newCard = {
        user_id: user?.id,
        name: formData.name,
        credit_limit: parseFloat(formData.cardLimit) || 0,
        bill: parseFloat(formData.cardBill) || 0,
        color: formData.cardColor
      };
      const { data, error } = await supabase.from('credit_cards').insert(newCard).select().single();
      if (error) { showToast("Erro ao adicionar cartão.", "error"); return; }
      setCreditCards([...creditCards, { id: data.id, name: data.name, bank: data.name, limit: data.credit_limit, bill: data.bill, paid: data.paid || 0, color: data.color }]);
      showToast("Cartão adicionado com sucesso!", "success");
    } else if (editingBankId) {
      const updatedBank = {
        name: formData.name,
        type: formData.bankType,
        balance: parseFloat(formData.bankBalance) || 0,
        color: formData.bankColor
      };
      const { error } = await supabase.from('bank_accounts').update(updatedBank).eq('id', editingBankId);
      if (error) { showToast("Erro ao atualizar conta.", "error"); return; }
      setBankAccounts(prev => prev.map(b => b.id === editingBankId ? { ...b, ...updatedBank } : b));
      showToast("Conta bancária atualizada!", "success");
    } else if (isAddingBank) {
      const newBank = {
        user_id: user?.id,
        name: formData.name,
        type: formData.bankType,
        balance: parseFloat(formData.bankBalance) || 0,
        color: formData.bankColor
      };
      const { data, error } = await supabase.from('bank_accounts').insert(newBank).select().single();
      if (error) { showToast("Erro ao adicionar conta.", "error"); return; }
      setBankAccounts([...bankAccounts, { id: data.id, name: data.name, type: data.type, balance: data.balance, color: data.color }]);
      showToast("Conta bancária adicionada!", "success");
    } else if (activeTab === AnalysisMode.BUDGET) {
      if (!formData.name || !formData.budgetMeta) {
        showToast("Por favor, preencha o nome e a meta do orçamento.");
        return;
      }
    } else if (activeTab === AnalysisMode.DEBTS) {
      if (partialPaymentDebtId) {
        const amount = parseFloat(formData.paymentAmount);
        if (isNaN(amount) || amount <= 0) {
          showToast("Informe um valor válido para o pagamento.");
          return;
        }
        const debt = debts.find(d => d.id === partialPaymentDebtId);
        if (debt) {
          const newRemaining = Math.max(0, debt.remaining - amount);
          const newStatus = newRemaining === 0 ? 'Em dia' : debt.status;
          const { error } = await supabase.from('debts').update({ remaining: newRemaining, status: newStatus }).eq('id', partialPaymentDebtId);
          if (error) { showToast("Erro ao registrar pagamento.", "error"); return; }
          setDebts(prev => prev.map(d => d.id === partialPaymentDebtId ? { ...d, remaining: newRemaining, status: newStatus } : d));
          showToast("Pagamento registrado com sucesso!", "success");
        }
      } else if (editingDebtId) {
        // Converter data de DD/MM/YYYY para YYYY-MM-DD se necessário
        let dueDateFormatted = formData.debtDueDate;
        if (formData.debtDueDate && formData.debtDueDate.includes('/')) {
          const parts = formData.debtDueDate.split('/');
          if (parts.length === 3) {
            dueDateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        const updatedDebt = {
          name: formData.name,
          bank: formData.debtBank,
          total: parseFloat(formData.debtTotal),
          remaining: parseFloat(formData.debtRemaining),
          due_date: dueDateFormatted,
          status: parseFloat(formData.debtRemaining) === 0 ? 'Em dia' : 'Pendente'
        };
        const { error } = await supabase.from('debts').update(updatedDebt).eq('id', editingDebtId);
        if (error) { console.error("Erro ao atualizar dívida:", error); showToast("Erro ao atualizar dívida.", "error"); return; }
        setDebts(prev => prev.map(d => d.id === editingDebtId ? { ...d, ...updatedDebt, dueDate: new Date(dueDateFormatted).toLocaleDateString('pt-BR') } : d));
        showToast("Dívida atualizada!", "success");
      } else {
        const installmentInfo = parseInt(formData.installments) > 1 ? ` (${formData.installments}x)` : '';
        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        let dueDateFormatted = formData.debtDueDate;
        if (formData.debtDueDate && formData.debtDueDate.includes('/')) {
          const parts = formData.debtDueDate.split('/');
          if (parts.length === 3) {
            dueDateFormatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
        }
        const totalInstallments = parseInt(formData.installments) || 1;
        const newDebt = {
          user_id: user?.id,
          name: formData.name + installmentInfo,
          type: 'Diversos',
          bank: formData.debtBank,
          total: parseFloat(formData.debtTotal) || 0,
          remaining: parseFloat(formData.debtRemaining) || 0,
          due_date: dueDateFormatted,
          status: 'Em dia',
          color: 'bg-blue-500',
          total_installments: totalInstallments,
          paid_installments: 0
        };
        const { data, error } = await supabase.from('debts').insert(newDebt).select().single();
        if (error) { console.error("Erro ao registrar dívida:", error); showToast("Erro ao registrar dívida.", "error"); return; }
        setDebts([...debts, { id: data.id, name: data.name, type: data.type, bank: data.bank, total: data.total, remaining: data.remaining, dueDate: data.due_date, status: data.status, color: data.color, totalInstallments: data.total_installments, paidInstallments: data.paid_installments }]);
        showToast("Dívida registrada!", "success");
      }
    } else if (activeTab === AnalysisMode.GOALS) {
      if (contributionGoalId) {
        const amount = parseFloat(formData.goalContribution);
        if (isNaN(amount) || amount <= 0) {
          showToast("Informe um valor válido para o aporte.");
          return;
        }
        const goal = goals.find(g => g.id === contributionGoalId);
        if (goal) {
          const newCurrent = Math.min(goal.target, goal.current + amount);
          const { error } = await supabase.from('goals').update({ current: newCurrent }).eq('id', contributionGoalId);
          if (error) { showToast("Erro ao realizar aporte.", "error"); return; }
          setGoals(prev => prev.map(g => g.id === contributionGoalId ? { ...g, current: newCurrent } : g));
          showToast(`Aporte de R$ ${amount} realizado na meta!`, "success");
        }
      } else if (withdrawalGoalId) {
        const amount = parseFloat(formData.goalWithdrawal);
        if (isNaN(amount) || amount <= 0) {
          showToast("Informe um valor válido para o resgate.");
          return;
        }
        const goal = goals.find(g => g.id === withdrawalGoalId);
        if (goal) {
          const newCurrent = Math.max(0, goal.current - amount);
          const { error } = await supabase.from('goals').update({ current: newCurrent }).eq('id', withdrawalGoalId);
          if (error) { showToast("Erro ao realizar resgate.", "error"); return; }
          setGoals(prev => prev.map(g => g.id === withdrawalGoalId ? { ...g, current: newCurrent } : g));
          showToast(`Resgate de R$ ${amount} realizado com sucesso!`, "success");
        }
      } else if (editingGoalId) {
        const updatedGoal = { title: formData.name, target: parseFloat(formData.goalTarget) || 0 };
        const { error } = await supabase.from('goals').update(updatedGoal).eq('id', editingGoalId);
        if (error) { showToast("Erro ao atualizar meta.", "error"); return; }
        setGoals(prev => prev.map(g => g.id === editingGoalId ? { ...g, ...updatedGoal } : g));
        showToast("Meta atualizada!", "success");
      } else {
        // Validação de campos obrigatórios
        if (!formData.name || !formData.goalTarget) {
          showToast("Por favor, preencha o título e o valor alvo da meta.");
          return;
        }
        // Usa URL personalizada se fornecida, senão usa imagem temática baseada no título
        const imageUrl = formData.goalImageUrl.trim() || getGoalImageByTitle(formData.name);
        const newGoal = {
          user_id: user?.id,
          title: formData.name,
          target: parseFloat(formData.goalTarget) || 0,
          current: 0,
          image_url: imageUrl
        };
        const { data, error } = await supabase.from('goals').insert(newGoal).select().single();
        if (error) { console.error("Erro ao criar meta:", error); showToast("Erro ao criar meta.", "error"); return; }
        setGoals([...goals, { id: data.id, title: data.title, target: data.target, current: data.current, img: data.image_url }]);
        showToast("Nova meta estabelecida!", "success");
      }
    } else if (!formData.name && !isAddingCard && !editingCardId && !isAddingBank && !editingBankId) {
      showToast("Por favor, preencha todos os campos.");
      return;
    }

    if (!isAddingCard && !editingCardId && !isAddingBank && !editingBankId && !contributionGoalId && !withdrawalGoalId && !partialPaymentDebtId) {
      const val = parseFloat(formData.value);
      const isExpense = formData.type === 'Despesa';
      let finalCategory = formData.category;

      if (isAddingNewCategory) {
        if (!newCategoryInput) {
          showToast("Digite o nome da nova categoria.");
          return;
        }
        finalCategory = newCategoryInput;
        if (!categories.includes(finalCategory)) {
          setCategories([...categories, finalCategory]);
        }
      }

      if (activeTab === AnalysisMode.TRANSACTIONS || activeTab === AnalysisMode.DASHBOARD) {
        const finalValue = isExpense ? val * -1 : val;

        // Se estamos editando, primeiro reverter o efeito da transação antiga
        if (editingTransactionId) {
          const oldTransaction = transactions.find(t => t.id === editingTransactionId);
          if (oldTransaction) {
            const oldAccMatch = oldTransaction.acc.match(/^(.+)\s*\((Crédito|Débito)\)$/);
            if (oldAccMatch) {
              const oldBankName = oldAccMatch[1].trim();
              const oldBank = bankAccounts.find(b => b.name === oldBankName);
              if (oldBank) {
                setBankAccounts(prev => prev.map(b =>
                  b.id === oldBank.id ? { ...b, balance: b.balance - oldTransaction.val } : b
                ));
              }
            }
          }
        }

        let paymentMethodLabel = 'Dinheiro';
        if (isExpense && formData.paymentMethod === 'Cartão' && formData.selectedCardId) {
          const card = creditCards.find(c => c.id === formData.selectedCardId);
          paymentMethodLabel = card ? `${card.name} (${formData.cardUsageType})` : `Cartão (${formData.cardUsageType})`;

          if (formData.cardUsageType === 'Crédito') {
            setCreditCards(prev => prev.map(c =>
              c.id === formData.selectedCardId ? { ...c, bill: c.bill + val } : c
            ));
          }
        } else if (!isExpense && formData.selectedBankAccountId) {
          // Para Receita: adicionar ao saldo da conta selecionada
          const bank = bankAccounts.find(b => b.id === formData.selectedBankAccountId);
          paymentMethodLabel = bank ? `${bank.name} (Crédito)` : 'Crédito';

          // Atualizar saldo do banco (somando o valor)
          setBankAccounts(prev => prev.map(b =>
            b.id === formData.selectedBankAccountId ? { ...b, balance: b.balance + val } : b
          ));
        } else if (formData.paymentMethod === 'Dinheiro' && formData.selectedBankAccountId) {
          const bank = bankAccounts.find(b => b.id === formData.selectedBankAccountId);
          paymentMethodLabel = bank ? `${bank.name} (Débito)` : 'Dinheiro';

          // Atualizar saldo do banco
          setBankAccounts(prev => prev.map(b =>
            b.id === formData.selectedBankAccountId ? { ...b, balance: b.balance + finalValue } : b
          ));
        }

        if (editingTransactionId) {
          // Atualizar transação existente no Supabase
          const updatedTx = {
            description: formData.name,
            category: finalCategory,
            account: paymentMethodLabel,
            value: finalValue,
            status: formData.status
          };
          const { error } = await supabase.from('transactions').update(updatedTx).eq('id', editingTransactionId);
          if (error) { showToast("Erro ao atualizar transação.", "error"); return; }
          setTransactions(prev => prev.map(t =>
            t.id === editingTransactionId
              ? { ...t, desc: formData.name, cat: finalCategory, acc: paymentMethodLabel, val: finalValue, status: formData.status as 'Pago' | 'Pendente' }
              : t
          ));
          showToast("Transação atualizada!", "success");
        } else {
          const installmentInfo = (isExpense && formData.paymentMethod === 'Cartão' && formData.cardUsageType === 'Crédito' && parseInt(formData.installments) > 1)
            ? ` (1/${formData.installments}x)`
            : '';

          const newTxForDb = {
            user_id: user?.id,
            date: new Date().toISOString().split('T')[0],
            description: formData.name + installmentInfo,
            category: finalCategory,
            account: paymentMethodLabel,
            value: finalValue,
            status: formData.status
          };
          const { data, error } = await supabase.from('transactions').insert(newTxForDb).select().single();
          if (error) { showToast("Erro ao adicionar transação.", "error"); return; }

          // Sync card bill if credit
          if (isExpense && formData.paymentMethod === 'Cartão' && formData.cardUsageType === 'Crédito' && formData.selectedCardId) {
            const card = creditCards.find(c => c.id === formData.selectedCardId);
            if (card) {
              await supabase.from('credit_cards').update({ bill: card.bill + val }).eq('id', formData.selectedCardId);
            }
          }
          // Sync bank balance if debit or income
          if (formData.selectedBankAccountId) {
            const bank = bankAccounts.find(b => b.id === formData.selectedBankAccountId);
            if (bank) {
              const newBalance = isExpense ? bank.balance + finalValue : bank.balance + val;
              await supabase.from('bank_accounts').update({ balance: newBalance }).eq('id', formData.selectedBankAccountId);
            }
          }

          setTransactions([{ id: data.id, date: new Date(data.date).toLocaleDateString('pt-BR'), desc: data.description, cat: data.category, acc: data.account, user: userProfile?.name || 'Membro', val: data.value, status: data.status }, ...transactions]);
          showToast("Transação adicionada!", "success");
        }
      } else if (activeTab === AnalysisMode.BUDGET) {
        if (editingBudgetName) {
          const oldBudget = budgets.find(b => b.category === editingBudgetName);
          if (oldBudget) {
            const updatedBudget = { category: formData.name, planned: parseFloat(formData.budgetMeta) || 0, realized: parseFloat(formData.budgetReal) || 0 };
            const { error } = await supabase.from('budgets').update(updatedBudget).eq('id', oldBudget.id);
            if (error) { showToast("Erro ao atualizar orçamento.", "error"); return; }
            setBudgets(prev => prev.map(b => b.category === editingBudgetName ? { ...b, ...updatedBudget } : b));
            showToast("Orçamento atualizado!", "success");
          }
        } else {
          const newBudget = {
            user_id: user?.id,
            category: formData.name,
            planned: parseFloat(formData.budgetMeta) || 0,
            realized: parseFloat(formData.budgetReal) || 0,
            icon: '📊',
            color: 'bg-slate-500'
          };
          const { data, error } = await supabase.from('budgets').insert(newBudget).select().single();
          if (error) { showToast("Erro ao criar orçamento.", "error"); return; }
          setBudgets([...budgets, { id: data.id, category: data.category, planned: data.planned, realized: data.realized, icon: data.icon, color: data.color }]);
          showToast("Orçamento planejado!", "success");
        }
      }
    }

    setFormData({
      name: '',
      value: '',
      category: 'Alimentação',
      status: 'Pago',
      type: 'Despesa',
      paymentMethod: 'Dinheiro',
      selectedCardId: '',
      selectedBankAccountId: '',
      cardUsageType: 'Crédito',
      budgetMeta: '',
      budgetReal: '',
      debtTotal: '',
      debtRemaining: '',
      debtDueDate: '',
      debtBank: '',
      paymentAmount: '',
      goalTarget: '',
      goalContribution: '',
      goalWithdrawal: '',
      goalImageUrl: '',
      cardLimit: '',
      cardBill: '',
      cardPaid: '',
      cardColor: 'bg-blue-600',
      bankType: 'Conta Corrente',
      bankBalance: '',
      bankColor: 'bg-blue-600',
      installments: '1'
    });
    setEditingBudgetName(null);
    setEditingDebtId(null);
    setPartialPaymentDebtId(null);
    setEditingGoalId(null);
    setContributionGoalId(null);
    setWithdrawalGoalId(null);
    setEditingTransactionId(null);
    setEditingCardId(null);
    setEditingBankId(null);
    setIsAddingNewCategory(false);
    setIsAddingCard(false);
    setIsAddingBank(false);
    setNewCategoryInput('');
    setIsModalOpen(false);
  };

  // Filtragem de Transações
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t =>
      t.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.cat.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const menuItems = [
    { id: AnalysisMode.DASHBOARD, label: 'Dashboard', icon: Icons.Dashboard },
    { id: AnalysisMode.TRANSACTIONS, label: 'Transações', icon: Icons.Transactions },
    { id: AnalysisMode.BANKS, label: 'Bancos', icon: Icons.Bank },
    { id: AnalysisMode.BUDGET, label: 'Orçamentos', icon: Icons.Budget },
    { id: AnalysisMode.DEBTS, label: 'Dívidas', icon: Icons.Debts },
    { id: AnalysisMode.GOALS, label: 'Metas', icon: Icons.Goals },
    { id: AnalysisMode.FAMILY, label: 'Família', icon: Icons.Family },
    { id: AnalysisMode.WHATSAPP, label: 'WhatsApp', icon: Icons.Whatsapp },
    { id: AnalysisMode.PROFILE, label: 'Perfil', icon: Icons.User },
  ];

  // Fluxo de Caixa Mensal - Dados calculados das transações reais filtradas pelo período
  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Filtrar transações pelo período selecionado
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    // Agrupar transações por mês/ano
    const monthlyData: { [key: string]: { receita: number; despesa: number; sortKey: number } } = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    transactions.forEach(t => {
      // Converter data do formato 'DD/MM/YYYY' para Date
      const parts = t.date.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const txDate = new Date(year, month, day);

        // Filtrar pelo período selecionado
        if (txDate >= fromDate && txDate <= toDate) {
          const monthName = monthNames[month];
          const key = `${monthName}/${year.toString().slice(-2)}`; // Ex: "Out/25"
          const sortKey = year * 100 + month; // Para ordenação cronológica

          if (!monthlyData[key]) {
            monthlyData[key] = { receita: 0, despesa: 0, sortKey };
          }

          if (t.val > 0) {
            monthlyData[key].receita += t.val;
          } else {
            monthlyData[key].despesa += Math.abs(t.val);
          }
        }
      }
    });

    // Converter para array e ordenar cronologicamente
    return Object.entries(monthlyData)
      .sort(([, a], [, b]) => a.sortKey - b.sortKey)
      .map(([name, data]) => ({
        name,
        receita: data.receita,
        despesa: data.despesa
      }));
  }, [transactions, dateRange]);

  // Composição de Gastos - Dados calculados por categoria (filtrados pelo período)
  const pieData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Filtrar transações pelo período selecionado
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);

    // Cores para cada categoria
    const categoryColors: { [key: string]: string } = {
      'Alimentação': '#ef4444',
      'Transporte': '#f97316',
      'Lazer': '#8b5cf6',
      'Saúde': '#10b981',
      'Educação': '#3b82f6',
      'Moradia': '#6366f1',
      'Compras': '#ec4899',
      'Serviços': '#14b8a6',
      'Salário': '#22c55e',
      'Outros': '#64748b'
    };

    // Agrupar despesas por categoria
    const categoryData: { [key: string]: number } = {};

    transactions.forEach(t => {
      // Converter data do formato 'DD/MM/YYYY' para Date
      const parts = t.date.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const txDate = new Date(year, month, day);

        // Filtrar pelo período selecionado e apenas despesas
        if (txDate >= fromDate && txDate <= toDate && t.val < 0) {
          const category = t.cat || 'Outros';
          if (!categoryData[category]) {
            categoryData[category] = 0;
          }
          categoryData[category] += Math.abs(t.val);
        }
      }
    });

    // Converter para array e ordenar por valor (maior para menor)
    return Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: categoryColors[name] || '#64748b'
      }));
  }, [transactions, dateRange]);

  const comparisonData = useMemo(() => {
    if (chartData.length < 2) {
      return { current: 0, previous: 0, avg3Months: 0, diffPrev: 0, diffAvg: 0 };
    }
    const current = chartData[chartData.length - 1].despesa;
    const previous = chartData[chartData.length - 2].despesa;
    const avg3Months = chartData.slice(-4, -1).reduce((acc, curr) => acc + curr.despesa, 0) / 3;

    return {
      current,
      previous,
      avg3Months,
      diffPrev: previous !== 0 ? ((current - previous) / previous) * 100 : 0,
      diffAvg: avg3Months !== 0 ? ((current - avg3Months) / avg3Months) * 100 : 0
    };
  }, [chartData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onSuccess={() => { }} />;
  }

  return (
    <>
      {/* CONFIGURAÇÕES DA FAMÍLIA */}
      <Modal
        isOpen={isFamilySettingsOpen}
        onClose={() => setIsFamilySettingsOpen(false)}
        title="Configurações da Família"
      >
        <div className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 px-1">Nome da Família</label>
            <input
              type="text"
              value={editingFamilyName}
              onChange={(e) => setEditingFamilyName(e.target.value)}
              className="w-full px-7 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-slate-700 placeholder:text-slate-300 outline-none shadow-sm"
              placeholder="Ex: Família Silva"
            />
            <button
              onClick={handleUpdateFamilyName}
              className="w-full py-5 bg-blue-600 text-white rounded-[1.3rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 active:scale-95 transition-all"
            >
              Salvar Alterações
            </button>
          </div>

          <div className="pt-10 border-t border-slate-100 space-y-6">
            <div className="px-1">
              <h4 className="text-sm font-black text-red-600 uppercase tracking-tight">Zona de Risco</h4>
              <p className="text-[11px] text-slate-400 font-bold mt-1">Digite <span className="text-red-600">EXCLUIR</span> abaixo para confirmar a exclusão.</p>
            </div>

            <input
              type="text"
              value={deleteVerificationInput}
              onChange={(e) => setDeleteVerificationInput(e.target.value.toUpperCase())}
              className="w-full px-7 py-5 bg-red-50/30 border-2 border-red-100 focus:border-red-500/20 focus:bg-white rounded-[1.5rem] transition-all font-bold text-red-700 placeholder:text-red-200 outline-none shadow-sm uppercase"
              placeholder="DIGITE EXCLUIR"
            />

            <button
              onClick={handleDeleteFamily}
              disabled={deleteVerificationInput !== 'EXCLUIR'}
              className={`w-full py-5 rounded-[1.3rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-2 ${deleteVerificationInput === 'EXCLUIR' ? 'bg-red-600 text-white hover:bg-red-700 shadow-xl active:scale-95' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
            >
              <Icons.Trash />
              <span>Excluir Família Permanentemente</span>
            </button>
          </div>
        </div>
      </Modal>

      {showOnboarding && <Onboarding userName={userProfile?.name} onComplete={completeOnboarding} />}
      <div className="flex h-screen bg-[#f3f6f9] flex-col lg:flex-row pb-16 lg:pb-0 overflow-hidden">

        {/* TOAST FEEDBACK */}
        {toast && (
          <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${toast.type === 'error' ? 'bg-red-600 border-red-400' : toast.type === 'info' ? 'bg-blue-600 border-blue-400' : 'bg-green-600 border-green-400'} text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-3 animate-in slide-in-from-top-full duration-500 border`}>
            {toast.type === 'error' ? (
              <div className="bg-white/20 p-1.5 rounded-full text-white"><Icons.Close /></div>
            ) : toast.type === 'info' ? (
              <div className="bg-white/20 p-1.5 rounded-full text-white"><Icons.Sparkles /></div>
            ) : (
              <div className="bg-white/20 p-1.5 rounded-full text-white"><Icons.Check /></div>
            )}
            <span className="text-sm font-black tracking-tight">{toast.message}</span>
          </div>
        )}

        {/* MODAL DE ACEITAÇÃO DE CONVITE */}
        {inviteToAccept && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="relative h-48 bg-blue-600 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <Icons.Family />
                </div>
                <div className="w-24 h-24 bg-white/20 backdrop-blur-lg rounded-[2rem] flex items-center justify-center text-white text-4xl shadow-2xl border border-white/30 transform -rotate-12 animate-bounce">
                  👨‍👩‍👧‍👦
                </div>
              </div>
              <div className="p-12 text-center space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Você foi convidado!</h2>
                  <p className="text-slate-500 font-medium leading-relaxed">
                    <span className="font-black text-blue-600">{inviteToAccept.inviterName}</span> te convidou para fazer parte da <span className="font-black text-slate-800">{inviteToAccept.familyName}</span>.
                  </p>
                </div>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start space-x-4 text-left">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl shrink-0"><Icons.Check /></div>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">Ao aceitar, você poderá compartilhar e visualizar os gastos da família em tempo real.</p>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={() => {
                      setInviteToAccept(null);
                      window.history.pushState({}, '', window.location.pathname);
                    }}
                    className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Agora não
                  </button>
                  <button
                    onClick={confirmAcceptInvite}
                    className="flex-1 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:shadow-blue-500/30 transition-all active:scale-95"
                  >
                    Aceitar e Entrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE GESTÃO DE PERMISSÕES */}
        <Modal
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          title={`Permissões: ${selectedMemberForPermissions?.name}`}
        >
          <div className="space-y-8">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Cargo no Círculo</p>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">Define o nível base de autoridade</p>
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setMemberPermissionsBuffer({ ...memberPermissionsBuffer, role: 'member' })}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${memberPermissionsBuffer.role === 'member' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Membro
                </button>
                <button
                  onClick={() => setMemberPermissionsBuffer({ ...memberPermissionsBuffer, role: 'admin' })}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${memberPermissionsBuffer.role === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  Admin
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Acessos Específicos</p>
              {[
                { id: 'view_all', label: 'Visualizar Gastos Consolidados', desc: 'Permite ver transações de outros membros' },
                { id: 'edit_transactions', label: 'Gerenciar Transações', desc: 'Permite criar, editar e excluir despesas/receitas' },
                { id: 'edit_banks', label: 'Gerenciar Bancos e Cartões', desc: 'Permite configurar contas e teto de gastos' }
              ].map((perm: any) => (
                <div key={perm.id} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 hover:bg-blue-50/30 transition-all group">
                  <div className="flex space-x-4 items-center">
                    <div className={`p-3 rounded-2xl transition-all ${memberPermissionsBuffer[perm.id] ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Icons.Shield />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{perm.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{perm.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setMemberPermissionsBuffer({ ...memberPermissionsBuffer, [perm.id]: !memberPermissionsBuffer[perm.id] })}
                    className={`w-12 h-6 rounded-full transition-all relative shrink-0 ${memberPermissionsBuffer[perm.id] ? 'bg-blue-600' : 'bg-slate-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${memberPermissionsBuffer[perm.id] ? 'left-7' : 'left-1'}`}></div>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpdateMemberPermissions}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              Salvar Configurações
            </button>
          </div>
        </Modal>

        {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all">
            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-slate-50 bg-red-50">
                <h3 className="font-black text-red-600 text-lg tracking-tight flex items-center space-x-3">
                  <Icons.Trash />
                  <span>{deleteConfirmation.title}</span>
                </h3>
              </div>
              <div className="p-8">
                <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8">{deleteConfirmation.message}</p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setDeleteConfirmation({ ...deleteConfirmation, isOpen: false })}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      deleteConfirmation.onConfirm();
                      setDeleteConfirmation({ ...deleteConfirmation, isOpen: false });
                    }}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl hover:shadow-red-500/30 transition-all"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOATING CHAT WIDGET */}
        {user && (
          <div className="fixed bottom-24 right-6 lg:bottom-12 lg:right-12 z-[100] flex flex-col items-end">
            {isChatOpen && (
              <div className="w-[320px] sm:w-[400px] h-[500px] bg-white rounded-[2.5rem] shadow-2xl mb-4 flex flex-col overflow-hidden border border-slate-100 animate-in slide-in-from-bottom-5 fade-in duration-300">
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/20">AI</div>
                    <div>
                      <h4 className="font-black text-sm tracking-tight">FinAI Assistant</h4>
                      <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-[10px] font-bold text-slate-400">Sempre Online</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-slate-400">
                    <Icons.Close />
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto space-y-4 no-scrollbar bg-slate-50/50">
                  {chatMessages.map((msg, idx) => {
                    // Função para formatar a mensagem com markdown básico
                    const formatMessage = (text: string) => {
                      return text
                        .split('\n')
                        .map((line, i) => {
                          let formattedLine = line;

                          // Processar headers ### ## #
                          if (formattedLine.trim().startsWith('### ')) {
                            formattedLine = `<span class="font-bold text-slate-800">${formattedLine.replace(/^###\s*/, '')}</span>`;
                          } else if (formattedLine.trim().startsWith('## ')) {
                            formattedLine = `<span class="font-bold text-lg text-slate-800">${formattedLine.replace(/^##\s*/, '')}</span>`;
                          } else if (formattedLine.trim().startsWith('# ')) {
                            formattedLine = `<span class="font-bold text-xl text-slate-800">${formattedLine.replace(/^#\s*/, '')}</span>`;
                          }

                          // Processar negrito **texto**
                          formattedLine = formattedLine.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

                          // Processar bullets - e *
                          if (formattedLine.trim().startsWith('- ') || formattedLine.trim().startsWith('* ')) {
                            formattedLine = `<span class="flex items-start"><span class="mr-2">•</span><span>${formattedLine.slice(formattedLine.indexOf(' ') + 1)}</span></span>`;
                          }

                          // Processar listas numeradas (1. 2. 3. etc)
                          const numberedMatch = formattedLine.match(/^(\d+)\.\s+(.*)$/);
                          if (numberedMatch) {
                            formattedLine = `<span class="flex items-start"><span class="mr-2 font-semibold">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></span>`;
                          }

                          return formattedLine;
                        })
                        .join('<br/>');
                    };

                    return (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed ${msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10'
                          : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm shadow-black/5'
                          }`}>
                          <div
                            className="whitespace-pre-wrap [&>strong]:font-bold [&>br]:block [&>br]:mb-1"
                            dangerouslySetInnerHTML={{ __html: formatMessage(msg.parts[0].text) }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-100"></div>
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative flex items-center">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      placeholder="Pergunte sobre suas finanças..."
                      className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isTyping}
                      className="absolute right-2 p-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
                    >
                      <Icons.Send />
                    </button>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-5 rounded-3xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group flex items-center space-x-3 ${isChatOpen ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                }`}
            >
              <Icons.Sparkles />
              {!isChatOpen && <span className="text-xs font-black uppercase tracking-widest px-1">Falar com IA</span>}
            </button>
          </div>
        )}

        {/* MODAL DINÂMICO */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setIsAddingNewCategory(false);
            setIsAddingCard(false);
            setIsAddingBank(false);
            setEditingCardId(null);
            setEditingBankId(null);
            setEditingBudgetName(null);
            setEditingDebtId(null);
            setPartialPaymentDebtId(null);
            setEditingGoalId(null);
            setContributionGoalId(null);
            setWithdrawalGoalId(null);
            setEditingTransactionId(null);
            setFormData({
              name: '',
              value: '',
              category: 'Alimentação',
              status: 'Pago',
              type: 'Despesa',
              paymentMethod: 'Dinheiro',
              selectedCardId: '',
              selectedBankAccountId: '',
              cardUsageType: 'Crédito',
              budgetMeta: '',
              budgetReal: '',
              debtTotal: '',
              debtRemaining: '',
              debtDueDate: '',
              debtBank: '',
              paymentAmount: '',
              goalTarget: '',
              goalContribution: '',
              goalWithdrawal: '',
              cardLimit: '',
              cardBill: '',
              cardPaid: '',
              cardColor: 'bg-blue-600',
              bankType: 'Conta Corrente',
              bankBalance: '',
              bankColor: 'bg-blue-600',
              installments: '1'
            });
          }}
          title={
            editingCardId ? "Editar Cartão ✏️" :
              isAddingCard ? "Novo Cartão 💳" :
                editingBankId ? "Editar Conta ✏️" :
                  isAddingBank ? "Nova Conta Bancária 🏦" :
                    editingTransactionId ? "Editar Transação ✏️" :
                      activeTab === AnalysisMode.TRANSACTIONS ? "Nova Transação 💸" :
                        activeTab === AnalysisMode.BUDGET ? (editingBudgetName ? "Editar Orçamento ✏️" : "Novo Orçamento 📊") :
                          activeTab === AnalysisMode.DEBTS ? (partialPaymentDebtId ? "Registrar Pagamento 💸" : editingDebtId ? "Editar Dívida ✏️" : "Nova Dívida 💳") :
                            activeTab === AnalysisMode.GOALS ? (contributionGoalId ? "Aportar Capital 🎯" : withdrawalGoalId ? "Resgatar Capital 💸" : editingGoalId ? "Editar Meta ✏️" : "Nova Meta 🎯") : "Configurar ⚙️"
          }
        >
          <div className="space-y-5">
            {(isAddingCard || editingCardId) ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome do Cartão</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="Ex: Nubank, Inter..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Limite Total</label>
                    <input type="number" value={formData.cardLimit} onChange={(e) => setFormData({ ...formData, cardLimit: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fatura Atual</label>
                    <input type="number" value={formData.cardBill} onChange={(e) => setFormData({ ...formData, cardBill: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Já Pago</label>
                  <input type="number" value={formData.cardPaid} onChange={(e) => setFormData({ ...formData, cardPaid: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cor do Cartão</label>
                  <div className="flex gap-2">
                    {['bg-blue-600', 'bg-purple-600', 'bg-orange-500', 'bg-slate-900', 'bg-green-600'].map(color => (
                      <button key={color} onClick={() => setFormData({ ...formData, cardColor: color })} className={`w-8 h-8 rounded-full ${color} ${formData.cardColor === color ? 'ring-4 ring-offset-2 ring-blue-200' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (isAddingBank || editingBankId) ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome do Banco / Instituição</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="Ex: Nubank, Itaú, BB..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo de Conta</label>
                  <select value={formData.bankType} onChange={(e) => setFormData({ ...formData, bankType: e.target.value as any })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none appearance-none">
                    <option value="Conta Corrente">Conta Corrente</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Investimento">Investimento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldo Atual</label>
                  <input type="number" value={formData.bankBalance} onChange={(e) => setFormData({ ...formData, bankBalance: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cor de Destaque</label>
                  <div className="flex gap-2">
                    {['bg-blue-600', 'bg-purple-600', 'bg-orange-600', 'bg-yellow-500', 'bg-emerald-600'].map(color => (
                      <button key={color} onClick={() => setFormData({ ...formData, bankColor: color })} className={`w-8 h-8 rounded-full ${color} ${formData.bankColor === color ? 'ring-4 ring-offset-2 ring-blue-200' : ''}`} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {(activeTab === AnalysisMode.TRANSACTIONS || activeTab === AnalysisMode.DASHBOARD) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo de Transação</label>
                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-3xl border border-slate-100">
                        <button
                          onClick={() => setFormData({ ...formData, type: 'Despesa' })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.type === 'Despesa' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400'}`}
                        >
                          Gasto
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, type: 'Receita' })}
                          className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.type === 'Receita' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400'}`}
                        >
                          Recebimento
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      {/* Método de Pagamento - apenas para Despesas */}
                      {formData.type === 'Despesa' && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Método de Pagamento</label>
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-3xl border border-slate-100">
                            <button
                              onClick={() => setFormData({ ...formData, paymentMethod: 'Dinheiro' })}
                              className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.paymentMethod === 'Dinheiro' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              Banco / Dinheiro
                            </button>
                            <button
                              onClick={() => setFormData({ ...formData, paymentMethod: 'Cartão' })}
                              className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.paymentMethod === 'Cartão' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}
                            >
                              Cartão
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Para Receita: sempre mostra seleção de conta bancária */}
                      {formData.type === 'Receita' ? (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Conta de Destino</label>
                          <select
                            value={formData.selectedBankAccountId}
                            onChange={(e) => setFormData({ ...formData, selectedBankAccountId: e.target.value })}
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                          >
                            <option value="">Selecione uma conta...</option>
                            {bankAccounts.map(bank => (
                              <option key={bank.id} value={bank.id}>{bank.name} (Saldo: R$ {bank.balance.toLocaleString()})</option>
                            ))}
                          </select>
                        </div>
                      ) : formData.paymentMethod === 'Dinheiro' ? (
                        <div className="space-y-2 animate-in slide-in-from-top-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selecionar Conta Bancária</label>
                          <select
                            value={formData.selectedBankAccountId}
                            onChange={(e) => setFormData({ ...formData, selectedBankAccountId: e.target.value })}
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                          >
                            <option value="">Espécie / Dinheiro Vivo</option>
                            {bankAccounts.map(bank => (
                              <option key={bank.id} value={bank.id}>{bank.name} (Saldo: R$ {bank.balance.toLocaleString()})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Selecionar Cartão</label>
                            <select
                              value={formData.selectedCardId}
                              onChange={(e) => setFormData({ ...formData, selectedCardId: e.target.value })}
                              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                            >
                              <option value="">Selecione um cartão...</option>
                              {creditCards.map(card => (
                                <option key={card.id} value={card.id}>{card.name} (Fatura: R$ {card.bill.toLocaleString()})</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forma de Uso</label>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-3xl border border-slate-100">
                              <button
                                onClick={() => setFormData({ ...formData, cardUsageType: 'Crédito' })}
                                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.cardUsageType === 'Crédito' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                              >
                                Crédito
                              </button>
                              <button
                                onClick={() => setFormData({ ...formData, cardUsageType: 'Débito' })}
                                className={`py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${formData.cardUsageType === 'Débito' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                              >
                                Débito
                              </button>
                            </div>
                          </div>

                          {formData.cardUsageType === 'Crédito' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Número de Parcelas</label>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="number"
                                  min="1"
                                  max="48"
                                  value={formData.installments}
                                  onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                                  className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                  placeholder="1"
                                />
                                <div className="px-5 py-5 bg-blue-50 text-blue-600 rounded-3xl font-black text-xs uppercase whitespace-nowrap">
                                  {formData.installments}x
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === AnalysisMode.GOALS && contributionGoalId ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor do Aporte</label>
                    <input
                      value={formData.goalContribution}
                      onChange={(e) => setFormData({ ...formData, goalContribution: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      type="number"
                      placeholder="R$ 0,00"
                    />
                  </div>
                ) : activeTab === AnalysisMode.GOALS && withdrawalGoalId ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor do Resgate</label>
                    <input
                      value={formData.goalWithdrawal}
                      onChange={(e) => setFormData({ ...formData, goalWithdrawal: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      type="number"
                      placeholder="R$ 0,00"
                    />
                  </div>
                ) : activeTab === AnalysisMode.GOALS && (editingGoalId || !contributionGoalId && !withdrawalGoalId) ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Título da Meta</label>
                      <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="Ex: Viagem, Carro..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Alvo</label>
                      <input type="number" value={formData.goalTarget} onChange={(e) => setFormData({ ...formData, goalTarget: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                    </div>
                    {!editingGoalId && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">URL da Imagem (Opcional)</label>
                        <input
                          value={formData.goalImageUrl}
                          onChange={(e) => setFormData({ ...formData, goalImageUrl: e.target.value })}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none"
                          placeholder="https://..."
                        />
                        <p className="text-[10px] text-slate-400 ml-1">💡 Deixe vazio para usar imagem automática baseada no título</p>
                      </div>
                    )}
                  </div>
                ) : activeTab === AnalysisMode.DEBTS && partialPaymentDebtId ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor a Pagar</label>
                    <input
                      value={formData.paymentAmount}
                      onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      type="number"
                      placeholder="R$ 0,00"
                    />
                  </div>
                ) : (activeTab === AnalysisMode.DEBTS) ? (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Nome da Dívida</label>
                      <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="Ex: Cartão, Empréstimo..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Banco</label>
                      <input value={formData.debtBank} onChange={(e) => setFormData({ ...formData, debtBank: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="Ex: Nubank, BB..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total</label>
                        <input type="number" value={formData.debtTotal} onChange={(e) => setFormData({ ...formData, debtTotal: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Restante</label>
                        <input type="number" value={formData.debtRemaining} onChange={(e) => setFormData({ ...formData, debtRemaining: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="R$ 0,00" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vencimento</label>
                      <input value={formData.debtDueDate} onChange={(e) => setFormData({ ...formData, debtDueDate: e.target.value })} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none" placeholder="DD/MM/AAAA" />
                    </div>

                    {!editingDebtId && !partialPaymentDebtId && (
                      <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Número de Parcelas</label>
                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="1"
                            max="48"
                            value={formData.installments}
                            onChange={(e) => setFormData({ ...formData, installments: e.target.value })}
                            className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                            placeholder="1"
                          />
                          <div className="px-5 py-5 bg-blue-50 text-blue-600 rounded-3xl font-black text-xs uppercase whitespace-nowrap">
                            {formData.installments}x
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Descrição / Nome</label>
                    <input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      placeholder={activeTab === AnalysisMode.BUDGET ? "Ex: Lazer, Mercado..." : activeTab === AnalysisMode.GOALS ? "Ex: Viagem Paris..." : "Ex: Aluguel, Viagem..."}
                    />
                  </div>
                )}

                {activeTab === AnalysisMode.BUDGET && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Meta</label>
                        <input
                          value={formData.budgetMeta}
                          onChange={(e) => setFormData({ ...formData, budgetMeta: e.target.value })}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                          type="number"
                          placeholder="Planejado"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Real</label>
                        <input
                          value={formData.budgetReal}
                          onChange={(e) => setFormData({ ...formData, budgetReal: e.target.value })}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                          type="number"
                          placeholder="Gasto"
                        />
                      </div>
                    </div>
                  </>
                )}

                {(activeTab !== AnalysisMode.BUDGET && activeTab !== AnalysisMode.DEBTS && activeTab !== AnalysisMode.GOALS) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor</label>
                    <input
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                      type="number"
                      placeholder="R$ 0,00"
                    />
                  </div>
                )}

                {(activeTab === AnalysisMode.TRANSACTIONS || activeTab === AnalysisMode.DASHBOARD) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoria</label>
                      <div className="space-y-3">
                        <select
                          value={isAddingNewCategory ? "NEW_CAT" : formData.category}
                          onChange={(e) => {
                            if (e.target.value === "NEW_CAT") {
                              setIsAddingNewCategory(true);
                            } else {
                              setIsAddingNewCategory(false);
                              setFormData({ ...formData, category: e.target.value });
                            }
                          }}
                          className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="NEW_CAT">+ Adicionar nova categoria...</option>
                        </select>

                        {isAddingNewCategory && (
                          <input
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            className="w-full p-5 bg-blue-50/50 border border-blue-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none animate-in slide-in-from-top-2"
                            placeholder="Nome da nova categoria"
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status do Pagamento</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none"
                      >
                        <option value="Pago">Pago</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </>
                )}
              </>
            )}
            <button
              onClick={handleModalSubmit}
              className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              {editingBudgetName || editingDebtId || partialPaymentDebtId || editingGoalId || contributionGoalId || withdrawalGoalId || isAddingCard || editingCardId || isAddingBank || editingBankId ? "Salvar Alterações" : "Confirmar Registro"}
            </button>
          </div>
        </Modal>

        {/* MODAL DE CONVITE FAMILIAR */}
        {isInviteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tighter">Convidar Membro</h3>
                  <button onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }} className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400">
                    <Icons.Close />
                  </button>
                </div>

                {!generatedInviteLink ? (
                  <div className="space-y-6">
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">
                      Escolha o que o novo membro poderá fazer ao entrar na sua família.
                    </p>

                    <div className="space-y-4">
                      {[
                        { id: 'view_all', label: 'Visualizar Tudo', desc: 'Ver todos os gastos e saldos' },
                        { id: 'edit_transactions', label: 'Gerenciar Transações', desc: 'Adicionar e editar gastos/receitas' },
                        { id: 'edit_banks', label: 'Gerenciar Contas', desc: 'Configurar bancos e cartões' },
                        { id: 'is_admin', label: 'Administrador', desc: 'Controle total da família' }
                      ].map((perm) => (
                        <div key={perm.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl border border-slate-100 transition-all hover:bg-blue-50/50">
                          <div>
                            <p className="text-xs font-black text-slate-800">{perm.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{perm.desc}</p>
                          </div>
                          <button
                            onClick={() => setInvitePermissions(prev => ({ ...prev, [perm.id]: !prev[perm.id as keyof typeof invitePermissions] }))}
                            className={`w-12 h-6 rounded-full transition-all relative ${invitePermissions[perm.id as keyof typeof invitePermissions] ? 'bg-blue-600' : 'bg-slate-200'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${invitePermissions[perm.id as keyof typeof invitePermissions] ? 'left-7' : 'left-1'}`}></div>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={generateInvite}
                      className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all mt-4"
                    >
                      Gerar Link de Convite
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-300">
                    <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Link Gerado com Sucesso</p>
                      <p className="text-xs font-bold text-blue-900 break-all">{generatedInviteLink}</p>
                    </div>
                    <p className="text-slate-500 text-xs font-medium text-center leading-relaxed">
                      O link foi copiado! Envie para o membro da família. Ele terá 7 dias para aceitar o convite.
                    </p>
                    <button
                      onClick={() => { setIsInviteModalOpen(false); setGeneratedInviteLink(''); }}
                      className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all"
                    >
                      Pronto!
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR DESKTOP */}
        <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0">
          <div className="p-8 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-black italic text-lg">F</span>
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">FinAI</span>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-sm transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white font-black shadow-xl shadow-blue-600/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
              >
                <item.icon />
                <span className="tracking-tight">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-6 py-4 rounded-2xl text-sm text-red-500 hover:bg-red-50 transition-all duration-300 font-bold"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Sair da Conta</span>
            </button>
          </div>
        </aside>

        {/* BOTTOM NAV MOBILE */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-around py-4 px-2 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
          {menuItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all ${activeTab === item.id ? 'text-blue-600 bg-blue-50 scale-110 shadow-sm' : 'text-slate-400'}`}
            >
              <item.icon />
            </button>
          ))}
          <button
            onClick={() => setActiveTab(AnalysisMode.PROFILE)}
            className={`flex flex-col items-center space-y-1 p-2 rounded-2xl transition-all ${activeTab === AnalysisMode.PROFILE ? 'text-blue-600 bg-blue-50 scale-110 shadow-sm' : 'text-slate-400'}`}
          >
            <Icons.User />
          </button>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-y-auto relative no-scrollbar">

          <header className="px-6 lg:px-12 pt-8 lg:pt-12 pb-8 bg-white/50 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100/50 mb-10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
              <div>
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tighter">
                  {activeTab === AnalysisMode.DASHBOARD && 'Painel Executivo 📈'}
                  {activeTab === AnalysisMode.TRANSACTIONS && 'Movimentações 💸'}
                  {activeTab === AnalysisMode.BANKS && 'Minhas Contas 🏦'}
                  {activeTab === AnalysisMode.BUDGET && 'Teto de Gastos 📊'}
                  {activeTab === AnalysisMode.DEBTS && 'Gestão de Dívidas 💳'}
                  {activeTab === AnalysisMode.GOALS && 'Objetivos 🎯'}
                  {activeTab === AnalysisMode.FAMILY && 'Membros da Família 👨‍👩‍👧‍👦'}
                  {activeTab === AnalysisMode.WHATSAPP && 'Agente IA 🤖'}
                  {activeTab === AnalysisMode.PROFILE && 'Minha Conta 👤'}
                </h1>
                <p className="hidden sm:block text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
                  Análise Financeira Inteligente
                </p>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* MODERN RANGE CALENDAR SELECTOR - FIXED NUMBERS & WIDTH */}
                <div className="flex items-center bg-white p-1 rounded-2xl sm:rounded-[1.8rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_15px_40px_rgba(0,0,0,0.05)] hover:border-blue-100 w-full sm:w-auto overflow-hidden">
                  <div className="flex items-center px-3 sm:px-4 py-2 sm:py-2.5 space-x-2 sm:space-x-4 group w-full">
                    <div className="hidden xs:block text-blue-600 transition-transform group-hover:rotate-12 duration-300 shrink-0">
                      <Icons.Calendar />
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 text-center sm:text-left">Período Selecionado</span>
                      <div className="flex items-center justify-center sm:justify-start space-x-2">
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                          className="bg-transparent text-xs sm:text-sm font-black text-slate-800 outline-none cursor-pointer hover:text-blue-600 border-none p-0 min-w-[105px] sm:min-w-[120px]"
                        />
                        <div className="text-slate-300 shrink-0"><Icons.ChevronRight /></div>
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                          className="bg-transparent text-xs sm:text-sm font-black text-slate-800 outline-none cursor-pointer hover:text-blue-600 border-none p-0 min-w-[105px] sm:min-w-[120px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {hasPermission('edit_transactions') && (
                  <button
                    onClick={() => {
                      setEditingBudgetName(null);
                      setEditingDebtId(null);
                      setEditingGoalId(null);
                      setPartialPaymentDebtId(null);
                      setContributionGoalId(null);
                      setWithdrawalGoalId(null);
                      setIsAddingCard(false);
                      setIsAddingBank(false);
                      setEditingCardId(null);
                      setEditingBankId(null);
                      setIsModalOpen(true);
                    }}
                    className="bg-blue-600 text-white p-4 sm:p-5 rounded-xl sm:rounded-[1.5rem] shadow-[0_15px_30px_rgba(37,99,235,0.25)] hover:shadow-[0_20px_40px_rgba(37,99,235,0.35)] hover:scale-110 active:scale-90 transition-all shrink-0"
                  >
                    <Icons.Plus />
                  </button>
                )}
              </div>
            </div>
          </header>

          <div className="px-6 lg:px-12 pb-32 lg:pb-16 space-y-12">

            {/* VIEW: DASHBOARD */}
            {activeTab === AnalysisMode.DASHBOARD && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-8">
                  {[
                    { label: 'Saldo Disponível', val: `R$ ${bankAccounts.reduce((acc, b) => acc + b.balance, 0).toLocaleString()}`, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Entradas (Mês)', val: `R$ ${transactions.filter(t => t.val > 0).reduce((acc, t) => acc + t.val, 0).toLocaleString()}`, color: 'text-green-600', bg: 'bg-green-50/50' },
                    { label: 'Saídas (Mês)', val: `R$ ${transactions.filter(t => t.val < 0).reduce((acc, t) => acc + Math.abs(t.val), 0).toLocaleString()}`, color: 'text-red-600', bg: 'bg-red-50/50' },
                    { label: 'Total Guardado', val: `R$ ${bankAccounts.filter(b => b.type === 'Investimento' || b.type === 'Poupança').reduce((acc, b) => acc + b.balance, 0).toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-indigo-50/50' },
                    { label: 'Total em Dívidas', val: `R$ ${debts.reduce((acc, d) => acc + d.remaining, 0).toLocaleString()}`, color: 'text-orange-600', bg: 'bg-orange-50/50' },
                  ].map((c, i) => (
                    <div key={i} className={`card p-7 border-none shadow-[0_15px_40px_rgba(0,0,0,0.02)] ${c.bg} hover:scale-[1.03] transition-transform cursor-pointer`}>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{c.label}</p>
                      <p className={`text-2xl font-black ${c.color} tracking-tighter`}>{c.val}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 card p-8 border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)]">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="font-black text-slate-800 text-lg tracking-tight">Fluxo de Caixa Mensal</h3>
                      <div className="flex space-x-2">
                        <span className="flex items-center text-[10px] font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div> Receitas</span>
                        <span className="flex items-center text-[10px] font-bold text-slate-400"><div className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></div> Despesas</span>
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.15} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                            <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                          <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                          <Area type="monotone" dataKey="receita" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={4} />
                          <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={1} fill="url(#colorDes)" strokeWidth={4} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="card p-8 border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] flex flex-col items-center justify-center">
                    <h3 className="font-black text-slate-800 text-lg mb-8 self-start">Composição de Gastos</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" nameKey="name">
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-4 mt-6 justify-center">
                      {pieData.map((p, i) => (
                        <div key={i} className="flex items-center space-x-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></div>
                          <span className="text-[10px] font-bold text-slate-500">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CREDIT CARD & BANKS SECTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card p-8 border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] rounded-[2.5rem]">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20"><Icons.CreditCard /></div>
                        <h3 className="font-black text-slate-800 text-lg tracking-tight">Gestão de Crédito 💳</h3>
                      </div>
                      {hasPermission('edit_banks') && (
                        <button onClick={() => {
                          setIsAddingCard(true);
                          setIsModalOpen(true);
                        }} className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-all">Novo Cartão</button>
                      )}
                    </div>
                    <div className="space-y-8">
                      {creditCards.map(card => {
                        const usagePercent = (card.bill / card.limit) * 100;
                        return (
                          <div key={card.id} className="group p-1 relative">
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex items-center space-x-4">
                                <div className={`w-3 h-10 rounded-full ${card.color}`}></div>
                                <div>
                                  <h4 className="font-black text-slate-800 text-sm tracking-tight">{card.name}</h4>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite: R$ {card.limit.toLocaleString()}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleEditCard(card)}
                                    className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Editar cartão"
                                  >
                                    <Icons.Pencil />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCard(card.id)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                    title="Excluir cartão"
                                  >
                                    <Icons.Trash />
                                  </button>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-black text-slate-800 tracking-tighter">R$ {card.bill.toLocaleString()}</p>
                                  <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">Pago: R$ {card.paid.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="relative w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ${card.color} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} style={{ width: `${Math.min(100, usagePercent)}%` }}></div>
                              </div>
                              <div className="flex justify-between items-center px-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Uso do Limite: {usagePercent.toFixed(0)}%</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Disponível: R$ {(card.limit - card.bill).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="card p-8 bg-slate-900 border-none shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-[2.5rem] flex flex-col justify-between overflow-hidden relative group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Consolidado Mensal</p>
                      <div className="space-y-10">
                        <div>
                          <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Total em Faturas</p>
                          <p className="text-white text-4xl font-black tracking-tighter">R$ {creditCards.reduce((acc, c) => acc + c.bill, 0).toLocaleString()}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
                            <p className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Total Pago</p>
                            <p className="text-white text-lg font-black tracking-tight">R$ {creditCards.reduce((acc, c) => acc + c.paid, 0).toLocaleString()}</p>
                          </div>
                          <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/5">
                            <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mb-1">Pendente</p>
                            <p className="text-white text-lg font-black tracking-tight">R$ {(creditCards.reduce((acc, c) => acc + c.bill, 0) - creditCards.reduce((acc, c) => acc + c.paid, 0)).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => showToast("Pagamento unificado em breve")} className="mt-12 w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all relative z-10 shadow-2xl shadow-blue-500/20 active:scale-95">Quitar Tudo (Geral)</button>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full -mt-32 -mr-32 blur-3xl group-hover:bg-blue-600/20 transition-all duration-1000"></div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: TRANSAÇÕES */}
            {activeTab === AnalysisMode.TRANSACTIONS && (
              <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card p-5 sm:p-7 border-l-[6px] border-blue-500 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4 rounded-[1.5rem]">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mês Anterior</p>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter">
                          {comparisonData.diffPrev > 0 ? '+' : ''}{comparisonData.diffPrev.toFixed(1)}%
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md inline-block mt-2">Ref: R$ {comparisonData.previous.toFixed(2)}</p>
                      </div>
                      <div className="w-full sm:w-28 h-14 sm:h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ name: 'Nov', v: comparisonData.previous }, { name: 'Dez', v: comparisonData.current }]}>
                            <Tooltip
                              contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}
                              formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                              itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
                              wrapperStyle={{ zIndex: 100 }}
                            />
                            <Bar dataKey="v" radius={[6, 6, 0, 0]}>
                              <Cell fill="#f1f5f9" />
                              <Cell fill="#2563eb" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="card p-5 sm:p-7 border-l-[6px] border-indigo-500 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white gap-4 rounded-[1.5rem]">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Média Trimestral</p>
                        <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter">
                          {comparisonData.diffAvg > 0 ? '+' : ''}{comparisonData.diffAvg.toFixed(1)}%
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded-md inline-block mt-2">Méd: R$ {comparisonData.avg3Months.toFixed(0)}</p>
                      </div>
                      <div className="w-full sm:w-28 h-14 sm:h-16">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData.slice(-4)}>
                            <Tooltip
                              contentStyle={{ background: 'rgba(255,255,255,0.95)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontWeight: 'bold' }}
                              formatter={(value: number) => [`R$ ${value.toLocaleString()}`, '']}
                              labelFormatter={(label, payload) => payload?.[0]?.payload?.name || label}
                              labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                              itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                              wrapperStyle={{ zIndex: 100 }}
                            />
                            <Line type="monotone" dataKey="despesa" stroke="#6366f1" strokeWidth={5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  <div className="card p-6 bg-slate-900 border-none flex items-center justify-between text-white shadow-2xl overflow-hidden relative group">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Monitor IA</p>
                      <p className="text-sm text-slate-100 font-black leading-tight max-w-[150px] tracking-tight">
                        Gastos <span className="text-orange-400 underline decoration-2">12% acima</span> do padrão detectado.
                      </p>
                      <button onClick={() => setActiveTab(AnalysisMode.WHATSAPP)} className="mt-4 text-[9px] font-black uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-all">Ver análise</button>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 relative z-10 animate-pulse">
                      <Icons.TrendingUp />
                    </div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  </div>
                </div>

                {/* Botão Nova Transação */}
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setIsAddingCard(false);
                      setEditingCardId(null);
                      setIsAddingBank(false);
                      setEditingBankId(null);
                      setEditingTransactionId(null);
                    }}
                    className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
                  >
                    <Icons.Plus />
                    Nova Transação
                  </button>
                </div>

                {/* Barra de Pesquisa */}
                <div className="flex bg-white p-2.5 rounded-[1.8rem] border border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)] items-center">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400"><Icons.Search /></div>
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-transparent text-sm font-bold focus:outline-none placeholder:text-slate-300"
                      placeholder="Filtrar por nome, categoria ou valor..."
                    />
                  </div>
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="mr-4 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest">Limpar</button>
                  )}
                </div>

                {/* Tabela */}
                <div className="card border-none shadow-sm overflow-hidden rounded-[2.5rem]">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="bg-slate-50/50 border-b border-slate-50">
                        <tr className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="px-8 py-6">Data</th>
                          <th className="px-8 py-6">Descrição</th>
                          <th className="px-8 py-6">Categoria</th>
                          <th className="px-8 py-6">Método</th>
                          <th className="px-8 py-6">Valor</th>
                          <th className="px-8 py-6">Status</th>
                          <th className="px-8 py-6">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredTransactions.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                            <td className="px-8 py-6 text-xs font-black text-slate-400">{t.date}</td>
                            <td className="px-8 py-6 text-sm font-black text-slate-800 group-hover:translate-x-1 transition-transform">{t.desc}</td>
                            <td className="px-8 py-6">
                              <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{t.cat}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-tight">{t.acc}</span>
                            </td>
                            <td className={`px-8 py-6 text-sm font-black ${t.val < 0 ? 'text-red-500' : 'text-green-600'}`}>R$ {Math.abs(t.val).toFixed(2)}</td>
                            <td className="px-8 py-6">
                              <span className={`status-badge ${t.status === 'Pago' ? 'status-pago' : 'status-pendente'} rounded-xl px-4 py-2`}>{t.status}</span>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center space-x-1">
                                {hasPermission('edit_transactions') && (
                                  <>
                                    <button
                                      onClick={() => handleEditTransaction(t.id)}
                                      className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                      title="Editar transação"
                                    >
                                      <Icons.Pencil />
                                    </button>
                                    <button
                                      onClick={() => handleCancelTransactionWithConfirmation(t.id)}
                                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                      title="Cancelar transação"
                                    >
                                      <Icons.Trash />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTransactions.length === 0 && (
                      <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200"><Icons.Search /></div>
                        <p className="text-slate-400 font-bold">Nenhum registro encontrado para "{searchTerm}"</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: BANCOS */}
            {activeTab === AnalysisMode.BANKS && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="card p-8 bg-blue-600 text-white border-none shadow-xl rounded-[2.5rem] flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Patrimônio Líquido</p>
                      <p className="text-3xl font-black tracking-tighter">R$ {bankAccounts.reduce((acc, b) => acc + b.balance, 0).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] font-bold opacity-60 mt-6 italic">Total consolidado de todas as contas cadastradas.</p>
                  </div>
                  {bankAccounts.map(bank => (
                    <div key={bank.id} className="card p-8 hover:scale-[1.03] transition-all cursor-pointer rounded-[2.5rem] border-none shadow-sm relative group bg-white">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${bank.color}`}>
                          <Icons.Bank />
                        </div>
                        <div className="flex items-center space-x-1">
                          {hasPermission('edit_banks') && (
                            <>
                              <button onClick={() => handleEditBank(bank)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all" title="Editar conta">
                                <Icons.Pencil />
                              </button>
                              <button onClick={() => handleDeleteBank(bank.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Excluir conta">
                                <Icons.Trash />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 text-lg tracking-tight">{bank.name}</h4>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{bank.type}</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tighter">R$ {bank.balance.toLocaleString()}</p>
                      </div>
                      <div className={`absolute bottom-0 left-8 right-8 h-1 rounded-t-full ${bank.color} opacity-20`}></div>
                    </div>
                  ))}
                  <div onClick={() => { setIsAddingBank(true); setIsModalOpen(true); }} className="card p-8 border-dashed border-4 border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-100 cursor-pointer transition-all rounded-[2.5rem] bg-white/30">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm"><Icons.Plus /></div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nova Conta</p>
                  </div>
                </div>

                <div className="card p-10 border-none shadow-sm rounded-[2.5rem] bg-white">
                  <h3 className="font-black text-slate-800 text-xl tracking-tighter mb-8">Histórico de Saldos</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bankAccounts}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" tick={{ fill: '#94a3b8' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                        <Bar dataKey="balance" radius={[8, 8, 0, 0]}>
                          {bankAccounts.map((entry, index) => {
                            const colorMap: Record<string, string> = {
                              'bg-purple-600': '#9333ea',
                              'bg-blue-600': '#2563eb',
                              'bg-orange-600': '#ea580c',
                              'bg-yellow-500': '#eab308',
                              'bg-emerald-600': '#059669',
                              'bg-green-600': '#16a34a',
                              'bg-red-600': '#dc2626',
                              'bg-indigo-600': '#4f46e5',
                              'bg-pink-600': '#db2777',
                              'bg-slate-900': '#0f172a',
                            };
                            return (
                              <Cell key={`cell-${index}`} fill={colorMap[entry.color] || '#2563eb'} />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: ORÇAMENTOS */}
            {activeTab === AnalysisMode.BUDGET && (
              <div className="space-y-12 animate-in fade-in duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 card p-10 flex flex-col justify-center bg-blue-600 text-white border-none shadow-[0_20px_60px_rgba(37,99,235,0.3)] rounded-[2.5rem]">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mb-4">Total Planejado Mensal</p>
                    <p className="text-5xl font-black mb-10 tracking-tighter">R$ {budgets.reduce((acc, b) => acc + b.planned, 0).toLocaleString()}</p>
                    <div className="space-y-6">
                      <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                        <span>Execução</span>
                        <span>{Math.round((budgets.reduce((acc, b) => acc + b.realized, 0) / budgets.reduce((acc, b) => acc + b.planned, 0)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden shadow-inner">
                        <div className="bg-white h-full shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${Math.min(100, (budgets.reduce((acc, b) => acc + b.realized, 0) / budgets.reduce((acc, b) => acc + b.planned, 0)) * 100)}%` }}></div>
                      </div>
                      <p className="text-xs font-bold opacity-80 leading-relaxed italic">Visualize e controle seus limites de gastos por categoria.</p>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {budgets.map((b, i) => {
                      const percent = (b.realized / b.planned) * 100;
                      const isOver = b.realized > b.planned;
                      return (
                        <div key={i} className="card p-7 group transition-all hover:shadow-xl border-l-[6px] rounded-[2rem]" style={{ borderLeftColor: isOver ? '#ef4444' : '#2563eb' }}>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-[1.2rem] bg-slate-50 flex items-center justify-center text-2xl shadow-sm">{b.icon}</div>
                              <div>
                                <h4 className="font-black text-slate-800 text-base tracking-tight">{b.category}</h4>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Margem: R$ {Math.max(0, b.planned - b.realized).toFixed(0)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => handleEditBudget(b)}
                                  className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Editar orçamento"
                                >
                                  <Icons.Pencil />
                                </button>
                                <button
                                  onClick={() => handleDeleteBudget(b.category)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir orçamento"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                              <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${isOver ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
                                {percent.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Real: R$ {b.realized.toFixed(0)}</span>
                              <span>Meta: R$ {b.planned.toFixed(0)}</span>
                            </div>
                            <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden shadow-inner">
                              <div className={`h-full transition-all duration-1000 ${isOver ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.3)]'}`} style={{ width: `${Math.min(100, percent)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="card p-10 bg-slate-50 border-dashed border-2 border-slate-200 text-center py-20 rounded-[2.5rem]">
                  <div className="max-w-sm mx-auto space-y-6">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm text-slate-300 transition-all hover:scale-110 hover:shadow-md cursor-pointer">
                      <Icons.Plus />
                    </div>
                    <h4 className="font-black text-slate-800 text-xl tracking-tight">Expandir Planejamento</h4>
                    <p className="text-sm text-slate-400 font-medium leading-relaxed">Adicione novas categorias ou ajuste seus tetos de gastos para o próximo ciclo financeiro.</p>
                    <button onClick={() => {
                      setEditingBudgetName(null);
                      setIsModalOpen(true);
                    }} className="bg-white border-2 border-slate-100 px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 shadow-sm hover:bg-slate-100 hover:border-slate-200 active:scale-95 transition-all">Configurar Agora</button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: DÍVIDAS */}
            {activeTab === AnalysisMode.DEBTS && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-8 duration-700">
                {debts.map(debt => (
                  <div key={debt.id} className="card p-8 hover:shadow-2xl transition-all border-l-[6px] border-blue-500 rounded-[2rem] bg-white group relative">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h4 className="font-black text-slate-800 text-xl tracking-tighter group-hover:text-blue-600 transition-colors">{debt.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{debt.bank} - {debt.type}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border transition-all ${debt.status === 'Atrasado' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{debt.status}</span>
                        <div className="flex items-center space-x-1">
                          <button onClick={() => handleEditDebt(debt)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all" title="Editar dívida"><Icons.Pencil /></button>
                          <button onClick={() => handleDeleteDebt(debt.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all" title="Excluir dívida"><Icons.Trash /></button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end">
                        <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montante</p><p className="font-black text-slate-700 text-lg">R$ {debt.total.toFixed(2)}</p></div>
                        <div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aberto</p><p className="font-black text-red-500 text-lg">R$ {debt.remaining.toFixed(2)}</p></div>
                      </div>
                      {/* Informações de Parcelas */}
                      {debt.totalInstallments > 1 && (
                        <div className="flex justify-between items-center p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-sm">
                              {debt.paidInstallments}/{debt.totalInstallments}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Parcelas Pagas</p>
                              <p className="text-xs font-bold text-slate-500">Valor da Parcela: R$ {(debt.total / debt.totalInstallments).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase">Restam</p>
                            <p className="font-black text-blue-600">{debt.totalInstallments - debt.paidInstallments}x</p>
                          </div>
                        </div>
                      )}
                      <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden shadow-inner">
                        <div className={`${debt.color} h-full transition-all duration-1000 shadow-md`} style={{ width: `${debt.total > 0 ? (debt.remaining / debt.total) * 100 : 0}%` }}></div>
                      </div>
                      <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-4 items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Vencimento</span>
                          <span className="text-xs font-black text-slate-500">{debt.dueDate}</span>
                        </div>
                        <div className="flex space-x-2">
                          {debt.totalInstallments > 1 && debt.paidInstallments < debt.totalInstallments && (
                            <button
                              onClick={() => handlePayInstallment(debt)}
                              disabled={debt.remaining === 0}
                              className={`flex-1 px-3 py-3 rounded-2xl text-[8px] font-black uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 ${debt.remaining === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-purple-500/30'}`}
                            >
                              1 Parcela
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenPartialPayment(debt)}
                            disabled={debt.remaining === 0}
                            className={`flex-1 px-3 py-3 rounded-2xl text-[8px] font-black uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 ${debt.remaining === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-green-500/30'}`}
                          >
                            {debt.remaining === 0 ? 'Pago' : 'Aportar'}
                          </button>
                          <button
                            onClick={() => handlePayDebt(debt.id)}
                            disabled={debt.remaining === 0}
                            className={`flex-1 px-3 py-3 rounded-2xl text-[8px] font-black uppercase tracking-[0.1em] shadow-lg transition-all active:scale-95 ${debt.remaining === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30'}`}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => {
                  setEditingDebtId(null);
                  setPartialPaymentDebtId(null);
                  setIsModalOpen(true);
                }} className="card p-8 border-dashed border-4 border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-100 cursor-pointer transition-all rounded-[2rem]">
                  <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300"><Icons.Plus /></div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nova Dívida</p>
                </div>
              </div>
            )}

            {/* VIEW: WHATSAPP INTELLIGENCE */}
            {activeTab === AnalysisMode.WHATSAPP && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto animate-in zoom-in-95 duration-700">
                <div className="card p-10 space-y-10 rounded-[2.5rem] border-none shadow-[0_20px_60px_rgba(0,0,0,0.03)] bg-white">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-slate-800 text-xl tracking-tighter flex items-center space-x-3">
                      <Icons.Settings />
                      <span>Conexão Segura</span>
                    </h3>
                    <div className="flex items-center space-x-2 bg-green-50 px-4 py-1.5 rounded-full border border-green-100"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[9px] font-black text-green-600 uppercase tracking-widest">Link Ativo</span></div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Terminal de Entrada</label>
                      <input className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl font-black text-slate-700 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" defaultValue="+55 11 93852-2287" />
                    </div>
                    <div className="p-7 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 relative overflow-hidden group">
                      <p className="text-sm font-black text-blue-900 mb-3 flex items-center">Sincronização em Tempo Real <div className="ml-2 w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div></p>
                      <p className="text-xs text-blue-700/80 leading-relaxed font-bold">O FinAI processa mensagens, notas fiscais e áudios instantaneamente. Envie "Relatório" para um resumo imediato.</p>
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-150 transition-transform"><Icons.Whatsapp /></div>
                    </div>
                    <button onClick={handleConnectWhatsapp} className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-95 transition-all">Sincronizar Dispositivo</button>
                  </div>
                </div>

                <div className="card p-10 bg-slate-900 text-white border-none shadow-[0_30px_80px_rgba(0,0,0,0.15)] rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between">
                  <div className="relative z-10">
                    <div className="flex items-center space-x-5 mb-12">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/40 transform -rotate-6 group-hover:rotate-0 transition-transform"><Icons.Whatsapp /></div>
                      <div>
                        <h4 className="font-black text-2xl tracking-tighter">FinAI Chatbot</h4>
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.3em] mt-1">Sessão Criptografada</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Protocolos de Comando:</p>
                      <div className="space-y-4">
                        <div onClick={handleSendMessage} className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                          <p className="text-xs italic text-slate-300 group-hover:text-white transition-colors">"Anote gasto de 45 reais em almoço no Centro"</p>
                        </div>
                        <div onClick={handleSendMessage} className="bg-white/5 p-5 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group">
                          <p className="text-xs italic text-slate-300 group-hover:text-white transition-colors">"Qual meu saldo disponível para investimentos?"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleSendMessage} className="mt-12 w-full py-5 bg-green-500 hover:bg-green-600 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-green-500/20 active:scale-95">
                    <Icons.Whatsapp />
                    <span>Iniciar Chat IA</span>
                  </button>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-500/5 rounded-full -mb-32 -mr-32 blur-3xl"></div>
                </div>
              </div>
            )}

            {/* VIEW: FAMÍLIA */}
            {activeTab === AnalysisMode.FAMILY && (
              <div className="space-y-12 animate-in slide-in-from-left-8 duration-700">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center space-x-12">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{familyName || 'Círculo Familiar'}</p>
                      <div className="flex items-center space-x-3">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{familyMembers.length.toString().padStart(2, '0')} Membros</p>
                        {userProfile?.family_role === 'admin' && (
                          <button
                            onClick={() => {
                              setEditingFamilyName(familyName);
                              setIsFamilySettingsOpen(true);
                            }}
                            className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                            title="Personalizar Família"
                          >
                            <Icons.Settings />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="hidden sm:block w-px h-12 bg-slate-100"></div>
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gasto Consolidado</p>
                      <p className="text-3xl font-black text-slate-900 tracking-tighter">
                        R$ {(transactions || []).reduce((acc, t) => acc + (t.val < 0 ? Math.abs(t.val) : 0), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {(hasPermission('is_admin') || !userProfile?.family_id) && (
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                      {!userProfile?.family_id && (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={manualInviteCode}
                            onChange={(e) => setManualInviteCode(e.target.value.toUpperCase())}
                            className="w-32 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-500/30 transition-all uppercase"
                            placeholder="CÓDIGO"
                          />
                          <button
                            onClick={handleManualJoin}
                            className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black active:scale-95 transition-all"
                          >
                            Entrar
                          </button>
                        </div>
                      )}
                      <button onClick={handleInviteFamily} className="bg-blue-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-95 transition-all w-full sm:w-auto">Convidar Membro</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {familyMembers.length === 0 ? (
                    <div className="col-span-full py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center text-center space-y-6">
                      <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-4xl transform -rotate-12">👨‍👩‍👧‍👦</div>
                      <div className="max-w-md px-6">
                        <h4 className="font-black text-slate-800 text-2xl tracking-tight mb-3">Sua jornada familiar começa aqui!</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">Convide seus familiares para consolidar gastos, planejar metas em conjunto e ter uma visão clara do patrimônio da família.</p>
                      </div>
                      {!userProfile?.family_id && (
                        <div className="flex flex-col items-center space-y-4 w-full max-w-sm">
                          <button onClick={handleInviteFamily} className="w-full bg-white border-2 border-slate-200 px-8 py-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 shadow-sm hover:bg-blue-50 hover:border-blue-100 transition-all active:scale-95">Começar Círculo Familiar</button>

                          <div className="relative w-full">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                              <div className="w-full border-t border-slate-100"></div>
                            </div>
                            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-widest">
                              <span className="bg-[#fcfdfe] px-4 text-slate-300">Ou use um código</span>
                            </div>
                          </div>

                          <div className="flex space-x-2 w-full">
                            <input
                              type="text"
                              value={manualInviteCode}
                              onChange={(e) => setManualInviteCode(e.target.value.toUpperCase())}
                              className="flex-1 px-6 py-4 bg-white border border-slate-100 rounded-[1.2rem] text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:border-blue-500/30 transition-all uppercase"
                              placeholder="CÓDIGO"
                            />
                            <button
                              onClick={handleManualJoin}
                              className="px-6 py-4 bg-slate-900 text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95"
                            >
                              Entrar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    familyMembers.map((m, i) => {
                      const memberSpend = transactions
                        .filter((t: any) => t.user_id === m.id && t.val < 0)
                        .reduce((acc, t: any) => acc + Math.abs(t.val), 0);

                      return (
                        <div key={m.id} className="card p-8 group hover:shadow-2xl transition-all rounded-[2rem] bg-white border-none shadow-sm">
                          <div className="flex justify-between items-start mb-8">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shadow-inner bg-slate-100 text-slate-600`}>
                              {m.name?.charAt(0) || '?'}
                            </div>
                            {userProfile?.family_role === 'admin' && (
                              <button
                                onClick={() => {
                                  setSelectedMemberForPermissions(m);
                                  setMemberPermissionsBuffer({
                                    role: m.family_role,
                                    view_all: m.family_permissions?.view_all ?? true,
                                    edit_transactions: m.family_permissions?.edit_transactions ?? true,
                                    edit_banks: m.family_permissions?.edit_banks ?? true
                                  });
                                  setIsPermissionsModalOpen(true);
                                }}
                                className="p-3 text-slate-200 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                title="Gerenciar Permissões"
                              >
                                <Icons.Shield />
                              </button>
                            )}
                          </div>
                          <h4 className="font-black text-slate-800 text-xl mb-1 tracking-tight">{m.name}</h4>
                          <span className="text-[9px] font-black px-3 py-1 rounded-lg uppercase bg-slate-50 text-slate-400 tracking-widest border border-slate-100">
                            {m.family_role === 'admin' ? 'Administrador' : 'Membro'}
                          </span>
                          <div className="mt-10 pt-8 border-t border-slate-50 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Soma de Gastos</p>
                              <p className="text-2xl font-black text-slate-700 tracking-tighter">R$ {memberSpend.toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (memberSpend / 10000) * 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* VIEW: METAS */}
            {activeTab === AnalysisMode.GOALS && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-6xl mx-auto animate-in fade-in duration-700">
                {goals.map((goal, i) => (
                  <div key={i} className="card overflow-hidden group hover:shadow-[0_30px_100px_rgba(0,0,0,0.1)] transition-all duration-700 rounded-[3rem] bg-white border-none shadow-sm">
                    <div className="h-60 overflow-hidden relative">
                      <img src={goal.img} alt={goal.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                      <div className="absolute top-4 right-4 z-20 flex space-x-2">
                        <button onClick={() => handleEditGoal(goal)} className="p-3 bg-blue-500/80 hover:bg-blue-600 backdrop-blur-md rounded-full text-white transition-all shadow-xl" title="Editar meta"><Icons.Pencil /></button>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="p-3 bg-red-500/80 hover:bg-red-600 backdrop-blur-md rounded-full text-white transition-all shadow-xl" title="Excluir meta"><Icons.Trash /></button>
                      </div>
                      <div className="absolute bottom-8 left-8">
                        <h4 className="text-white font-black text-3xl tracking-tighter mb-1">{goal.title}</h4>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">Alvo: R$ {goal.target.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="p-10 space-y-8">
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acumulado</span>
                          <span className="text-3xl font-black text-blue-600 tracking-tighter">R$ {goal.current.toLocaleString()}</span>
                        </div>
                        <span className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">{Math.round((goal.current / goal.target) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-50 h-4 rounded-full overflow-hidden shadow-inner p-1">
                        <div className="bg-blue-600 h-full rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-1000 ease-out" style={{ width: `${(goal.current / goal.target) * 100}%` }}></div>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => handleOpenWithdrawal(goal)}
                          disabled={goal.current <= 0}
                          className={`flex-1 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-lg flex items-center justify-center space-x-2 ${goal.current <= 0 ? 'bg-slate-50 text-slate-300 shadow-none' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}
                        >
                          <Icons.ArrowDown />
                          <span>Resgatar</span>
                        </button>
                        <button
                          onClick={() => handleOpenContribution(goal)}
                          disabled={goal.current >= goal.target}
                          className={`flex-1 py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all active:scale-95 shadow-lg flex items-center justify-center space-x-2 ${goal.current >= goal.target ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-black hover:shadow-black/20'}`}
                        >
                          <Icons.Plus />
                          <span>{goal.current >= goal.target ? 'Completo ✅' : 'Aportar'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div onClick={() => {
                  setEditingGoalId(null);
                  setContributionGoalId(null);
                  setWithdrawalGoalId(null);
                  setIsModalOpen(true);
                }} className="card p-10 bg-slate-50 border-dashed border-4 border-slate-200 flex flex-col items-center justify-center text-center space-y-6 hover:border-blue-100 cursor-pointer transition-all rounded-[3rem] min-h-[400px]">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm"><Icons.Plus /></div>
                  <div>
                    <p className="text-xl font-black text-slate-800 tracking-tight">Nova Meta Financeira</p>
                    <p className="text-sm text-slate-400 font-medium">Defina um novo objetivo para seu futuro.</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: PERFIL */}
            {activeTab === AnalysisMode.PROFILE && (
              <div className="max-w-5xl mx-auto space-y-12 animate-in zoom-in-95 duration-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="md:col-span-1 card p-10 flex flex-col items-center text-center space-y-6 rounded-[2.5rem] border-none shadow-sm bg-white">
                    <div className="relative group">
                      {/* Input file oculto */}
                      <input
                        ref={profilePhotoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleProfilePhotoUpload}
                        className="hidden"
                      />

                      {/* Avatar com foto ou inicial */}
                      <div className="w-32 h-32 rounded-full bg-blue-100 text-blue-600 text-4xl font-black flex items-center justify-center border-[6px] border-white shadow-2xl transition-transform group-hover:rotate-12 duration-500 overflow-hidden">
                        {isUploadingPhoto ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                        ) : userProfile?.avatar_url ? (
                          <img
                            src={userProfile.avatar_url}
                            alt="Foto de perfil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userProfile?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>

                      {/* Botão de upload */}
                      <button
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                        className="absolute bottom-0 right-0 p-2.5 bg-slate-900 text-white rounded-full shadow-lg border-2 border-white hover:scale-110 active:scale-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icons.Plus />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-black text-2xl text-slate-800 tracking-tighter">{userProfile?.name || 'Usuário'}</h4>
                      <p className="text-sm text-slate-400 font-bold mt-1">{user?.email || 'email@exemplo.com'}</p>
                    </div>
                    <div className="bg-blue-600 text-white px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20">
                      {userProfile?.family_role === 'admin' ? 'Administrador' : 'Membro Ativo'}
                    </div>
                    <div className="w-full pt-8 border-t border-slate-50 flex justify-around">
                      <div className="text-center"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Transações</p><p className="font-black text-slate-800">{transactions.length}</p></div>
                      <div className="text-center"><p className="text-[10px] font-black text-slate-300 uppercase mb-1">Metas</p><p className="font-black text-slate-800">{goals.length}</p></div>
                    </div>
                  </div>
                  <div className="md:col-span-2 card p-10 space-y-10 rounded-[2.5rem] border-none shadow-sm bg-white">
                    <h3 className="font-black text-slate-800 text-xl flex items-center space-x-3">
                      <Icons.Settings />
                      <span>Configurações do Perfil</span>
                    </h3>
                    <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                        <input id="profileName" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" defaultValue={userProfile?.name || ''} placeholder="Seu nome" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">ID do Usuário</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-400" disabled defaultValue={user?.id?.slice(0, 8)?.toUpperCase() || ''} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                        <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-slate-400" disabled defaultValue={user?.email || ''} />
                      </div>
                      <div className="sm:col-span-2 flex justify-between items-center pt-6">
                        <button type="button" onClick={handleLogout} className="text-red-600 hover:text-red-700 font-black text-xs uppercase tracking-widest hover:underline transition-all">Sair da Conta</button>
                        <button type="submit" className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black hover:shadow-black/20 active:scale-95 transition-all">Salvar Alterações</button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Seção de Troca de Senha */}
                <div className="card p-10 rounded-[2.5rem] border-none shadow-sm bg-white">
                  <h3 className="font-black text-slate-800 text-xl flex items-center space-x-3 mb-8">
                    <Icons.Shield />
                    <span>Alterar Senha</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nova Senha</label>
                      <input
                        id="newPassword"
                        type="password"
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        placeholder="Mínimo 6 caracteres"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                      <input
                        id="confirmPassword"
                        type="password"
                        className="w-full p-5 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                        placeholder="Repita a nova senha"
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={async () => {
                          const newPassword = (document.getElementById('newPassword') as HTMLInputElement)?.value;
                          const confirmPassword = (document.getElementById('confirmPassword') as HTMLInputElement)?.value;

                          if (!newPassword || newPassword.length < 6) {
                            showToast("A senha deve ter pelo menos 6 caracteres.", "error");
                            return;
                          }
                          if (newPassword !== confirmPassword) {
                            showToast("As senhas não coincidem.", "error");
                            return;
                          }

                          const { error } = await supabase.auth.updateUser({ password: newPassword });
                          if (error) {
                            console.error("Erro ao alterar senha:", error);
                            showToast("Erro ao alterar senha. Tente novamente.", "error");
                            return;
                          }

                          showToast("Senha alterada com sucesso!", "success");
                          (document.getElementById('newPassword') as HTMLInputElement).value = '';
                          (document.getElementById('confirmPassword') as HTMLInputElement).value = '';
                        }}
                        className="bg-blue-600 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-700 hover:shadow-blue-500/20 active:scale-95 transition-all"
                      >
                        Alterar Senha
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
};
export default App;
