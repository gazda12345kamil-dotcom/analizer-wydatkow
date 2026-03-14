import Dexie, { type EntityTable } from 'dexie';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'expense' | 'income';
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  categoryId: string;
  date: Date;
  description: string;
  type: 'expense' | 'income';
}

const db = new Dexie('ExpenseAppDB') as Dexie & {
  categories: EntityTable<Category, 'id'>;
  transactions: EntityTable<Transaction, 'id'>;
};

db.version(1).stores({
  categories: 'id, name, isDefault',
  transactions: 'id, amount, categoryId, date, type' 
});

// Wersja 2 – dodanie type do kategorii i nowe kategorie przychodów
db.version(2).stores({
  categories: 'id, name, type, isDefault',
  transactions: 'id, amount, categoryId, date, type'
}).upgrade(tx => {
  // Migracja istniejących kategorii – dodanie pola type
  return tx.table('categories').toCollection().modify(cat => {
    if (cat.id === 'cat_salary') {
      cat.type = 'income';
    } else {
      cat.type = cat.type || 'expense';
    }
  });
});

// Seed początkowych danych dla kategorii (jeśli baza jest pusta)
db.on('populate', async () => {
  await db.categories.bulkAdd([
    // Wydatki
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
});

export { db };
