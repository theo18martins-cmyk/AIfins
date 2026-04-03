
export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  card?: string;
  user: string;
  value: number;
  status: 'Pago' | 'Pendente';
}

export interface Budget {
  category: string;
  planned: number;
  realized: number;
  icon: string;
}

export interface Debt {
  id: string;
  name: string;
  total: number;
  remaining: number;
  dueDate: string;
  bank: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  deadline: string;
  imageUrl: string;
}

export interface BankAccount {
  id: string;
  name: string;
  type: 'Conta Corrente' | 'Poupança' | 'Investimento' | 'Outros';
  balance: number;
  color: string;
  bankCode?: string;
}

export interface Investment {
  id: string;
  user_id?: string;
  type: string;
  ticker: string;
  name: string;
  quantity: number;
  average_price: number;
  current_value: number;
  date: string;
}

export enum AnalysisMode {
  DASHBOARD = 'DASHBOARD',
  TRANSACTIONS = 'TRANSACTIONS',
  BUDGET = 'BUDGET',
  DEBTS = 'DEBTS',
  GOALS = 'GOALS',
  INVESTMENTS = 'INVESTMENTS',
  FAMILY = 'FAMILY',
  WHATSAPP = 'WHATSAPP',
  PROFILE = 'PROFILE',
  BANKS = 'BANKS',
  REPORTS = 'REPORTS',
  AUDIT = 'AUDIT',
  PREDICTION = 'PREDICTION',
  CONSULTING = 'CONSULTING'
}
