import Dexie, { type EntityTable } from 'dexie';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
}

export interface Wallet {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'cash' | 'bank' | 'savings';
  initialBalance: number;
  isDefault?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  walletId: string;
  date: Date;
  description: string;
  type: 'expense' | 'income';
  tagIds?: string[];
}

const db = new Dexie('ExpenseAppDB') as Dexie & {
  categories: EntityTable<Category, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
  wallets: EntityTable<Wallet, 'id'>;
  tags: EntityTable<Tag, 'id'>;
};

db.version(1).stores({
  categories: 'id, name, isDefault',
  transactions: 'id, amount, categoryId, date, type' 
});

db.version(2).stores({
  categories: 'id, name, type, isDefault',
  transactions: 'id, amount, categoryId, date, type'
});

// Wersja 3 - Dodanie portfeli, tagów i powiązanie ich z transakcjami
db.version(3).stores({
  categories: 'id, name, type, isDefault',
  transactions: 'id, amount, categoryId, walletId, date, type, *tagIds',
  wallets: 'id, name, type, isDefault',
  tags: 'id, name'
}).upgrade(tx => {
  // Migracja: Każda istniejąca transakcja musi otrzymać domyślny portfel
  return tx.table('transactions').toCollection().modify(transaction => {
    transaction.walletId = transaction.walletId || 'wallet_main';
    transaction.tagIds = transaction.tagIds || [];
  });
});

db.on('populate', async () => {
  // Seed kategorii wydatków
  await db.categories.bulkAdd([
    { id: 'cat_food', name: 'Jedzenie', color: '#f87171', icon: 'Utensils', type: 'expense', isDefault: true },
    { id: 'cat_transport', name: 'Transport', color: '#60a5fa', icon: 'Car', type: 'expense', isDefault: true },
    { id: 'cat_housing', name: 'Dom i Rachunki', color: '#34d399', icon: 'Home', type: 'expense', isDefault: true },
    { id: 'cat_entertainment', name: 'Rozrywka', color: '#c084fc', icon: 'Tv', type: 'expense', isDefault: true },
    { id: 'cat_health', name: 'Zdrowie', color: '#f472b6', icon: 'HeartPulse', type: 'expense', isDefault: true },
    { id: 'cat_shopping', name: 'Zakupy', color: '#fb923c', icon: 'ShoppingCart', type: 'expense', isDefault: true },
    { id: 'cat_education', name: 'Edukacja', color: '#38bdf8', icon: 'GraduationCap', type: 'expense', isDefault: true },
    { id: 'cat_other_exp', name: 'Inne wydatki', color: '#9ca3af', icon: 'MoreHorizontal', type: 'expense', isDefault: true },
    // Przychody
    { id: 'cat_salary', name: 'Wypłata', color: '#10b981', icon: 'Briefcase', type: 'income', isDefault: true },
    { id: 'cat_freelance', name: 'Freelance', color: '#06b6d4', icon: 'Laptop', type: 'income', isDefault: true },
    { id: 'cat_investments', name: 'Inwestycje', color: '#a855f7', icon: 'TrendingUp', type: 'income', isDefault: true },
    { id: 'cat_gift', name: 'Prezent', color: '#ec4899', icon: 'Gift', type: 'income', isDefault: true },
    { id: 'cat_other_inc', name: 'Inne przychody', color: '#14b8a6', icon: 'Coins', type: 'income', isDefault: true },
  ]);

  // Seed początkowych portfeli
  await db.wallets.bulkAdd([
    { id: 'wallet_main', name: 'Konto Główne', color: '#3b82f6', icon: 'Landmark', type: 'bank', initialBalance: 0, isDefault: true },
    { id: 'wallet_cash', name: 'Gotówka', color: '#10b981', icon: 'Banknote', type: 'cash', initialBalance: 0 },
    { id: 'wallet_savings', name: 'Oszczędności', color: '#8b5cf6', icon: 'PiggyBank', type: 'savings', initialBalance: 0 },
  ]);
});

export { db };
