"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, Wallet, Sparkles, Building2, Banknote, Landmark, PiggyBank, CreditCard } from "lucide-react"
import { AiReportDialog } from "@/components/AiReportDialog"
import { cn } from "@/lib/utils"

// Helper do ikonek
const getIcon = (iconName: string) => {
  switch (iconName) {
    case 'Banknote': return <Banknote className="w-5 h-5 text-current" />;
    case 'Landmark': return <Landmark className="w-5 h-5 text-current" />;
    case 'PiggyBank': return <PiggyBank className="w-5 h-5 text-current" />;
    case 'CreditCard': return <CreditCard className="w-5 h-5 text-current" />;
    default: return <Wallet className="w-5 h-5 text-current" />;
  }
}

export default function Home() {
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'all'>('all')
  
  const wallets = useLiveQuery(() => db.wallets.toArray())
  const transactions = useLiveQuery(() => {
    if (selectedWalletId === 'all') {
      return db.transactions.toArray()
    }
    return db.transactions.where('walletId').equals(selectedWalletId).toArray()
  }, [selectedWalletId])

  const today = new Date()
  today.setHours(0,0,0,0)
  
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  if (!transactions || !wallets) {
    return <div className="h-[50vh] w-full flex items-center justify-center animate-pulse"><Activity className="w-8 h-8 opacity-40 text-blue-500" /></div>
  }

  // Obliczenia dla Salda Portfeli 
  // Bilans całego portfela = initialBalance + income - expense (z całej historii, nie tylko miesiąca!)
  let totalBalance = 0;
  if (selectedWalletId === 'all') {
    totalBalance = wallets.reduce((sum, w) => sum + w.initialBalance, 0) + 
      transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)
  } else {
    const activeWallet = wallets.find(w => w.id === selectedWalletId)
    totalBalance = (activeWallet?.initialBalance || 0) + 
      transactions.reduce((sum, t) => t.type === 'income' ? sum + t.amount : sum - t.amount, 0)
  }

  // Wydatki z obecnego i poprzedniego msc (tylko do statystyk pod spodem)
  const thisMonthExpenses = transactions
    .filter(t => t.date >= currentMonth && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)
    
  const lastMonthExpenses = transactions
    .filter(t => t.date >= lastMonthStart && t.date < currentMonth && t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const expenseDiff = lastMonthExpenses === 0 ? 100 
    : ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100

  // Przychody
  const thisMonthIncome = transactions
    .filter(t => t.date >= currentMonth && t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const lastMonthIncome = transactions
    .filter(t => t.date >= lastMonthStart && t.date < currentMonth && t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0)

  const incomeDiff = lastMonthIncome === 0 ? 100 
    : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100

  const monthlyBalance = thisMonthIncome - thisMonthExpenses
  const savingsRate = thisMonthIncome > 0 ? (monthlyBalance / thisMonthIncome) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-6xl mx-auto">
      
      {/* Sekcja Powitania z Karuzelą Kont */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Cześć!</h1>
          <p className="text-slate-500 mt-1 font-medium">Jak mają się twoje portfele?</p>
        </div>

        {/* Karuzela Portfeli (Overscroll) */}
        <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide snap-x w-full">
          {/* Karta "Wszystkie Portfele" */}
          <div 
            onClick={() => setSelectedWalletId('all')}
            className={cn(
              "snap-start flex-shrink-0 w-[240px] p-5 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden group border",
              selectedWalletId === 'all' 
                ? "bg-slate-800 text-white border-slate-700 shadow-xl shadow-slate-900/20 scale-[1.02]" 
                : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-md"
            )}
          >
            {selectedWalletId === 'all' && <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "p-2.5 rounded-xl",
                selectedWalletId === 'all' ? "bg-white/10" : "bg-slate-100"
              )}>
                <Building2 className="w-5 h-5 text-current" />
              </div>
              <span className="font-bold text-sm">Zsumowany majątek</span>
            </div>
            <p className={cn("text-justify text-xs mb-1 font-semibold", selectedWalletId === 'all' ? "text-slate-300" : "text-slate-400")}>SALDO CAŁKOWITE</p>
             <div className="absolute inset-x-5 bottom-5">
               <h2 className="text-3xl font-black tracking-tight truncate">
                {totalBalance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }).replace("PLN", "")}
                <span className="text-sm font-bold ml-1 opacity-60">PLN</span>
               </h2>
             </div>
          </div>

          {/* Karty Poszczególnych Portfeli */}
          {wallets.map(wallet => {
            // Szybka kalkulacja dla karty (zależnie od db - używamy synchronicznie dla wygody widoku)
            // Ponieważ query Dexie jest w hooku wyżej, nie możemy mapować asynchronicznych useLiveQuery, 
            // W widoku portfela musimy ufać "totalBalance" a miniaturki portfeli przeliczymy prosto
            // Najlepiej użyć Promise w useEffect. Na teraz wyświetlamy tylko nazwę i typ dla miniaturki.
            const isSelected = selectedWalletId === wallet.id;
            
            return (
              <div 
                key={wallet.id}
                onClick={() => setSelectedWalletId(wallet.id)}
                className={cn(
                  "snap-start flex-shrink-0 w-[240px] p-5 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden group border",
                  isSelected 
                    ? "text-white shadow-xl scale-[1.02] border-transparent" 
                    : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-md"
                )}
                style={isSelected ? { backgroundColor: wallet.color, boxShadow: `0 10px 40px -10px ${wallet.color}80` } : {}}
              >
                {isSelected && <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl" />}
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2.5 rounded-xl",
                    isSelected ? "bg-black/10" : "bg-slate-100"
                  )} style={!isSelected ? { color: wallet.color } : {}}>
                    {getIcon(wallet.icon)}
                  </div>
                  <span className="font-bold text-sm truncate">{wallet.name}</span>
                </div>
                <p className={cn("text-justify text-xs mb-1 font-semibold uppercase", isSelected ? "text-white/70" : "text-slate-400")}>
                  Typ: {wallet.type === 'cash' ? 'Gotówka' : wallet.type === 'bank' ? 'Konto Bankowe' : 'Oszczędności'}
                </p>
                {isSelected && (
                  <h2 className="text-3xl font-black tracking-tight truncate mt-1">
                    {totalBalance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' }).replace("PLN", "")}
                    <span className="text-sm font-bold ml-1 opacity-60">PLN</span>
                  </h2>
                )}
                {!isSelected && (
                  <h2 className="text-lg font-black tracking-tight truncate mt-4 opacity-40">
                    Kliknij by sprawdzić
                  </h2>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 my-2" />

      {/* 4 Karty podsumowujące (w tym Raport AI) - Dotyczą wybranego widoku! */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2">
        {/* Wydatki */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 border-none shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-red-100 tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Wydatki <span className="text-[10px] ml-1 opacity-70">(ten msc)</span>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthExpenses.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${expenseDiff > 0 ? "text-red-100 bg-red-800/40" : "text-emerald-100 bg-emerald-800/40"}`}>
                {expenseDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(expenseDiff).toFixed(1)}% vs poprz.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Przychody */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 border-none shadow-md">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-emerald-100 tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Przychody <span className="text-[10px] ml-1 opacity-70">(ten msc)</span>
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthIncome.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${incomeDiff > 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {incomeDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(incomeDiff).toFixed(1)}% vs poprz.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bilans */}
        <Card className={`overflow-hidden relative transition-all duration-500 hover:shadow-lg hover:-translate-y-1 group border-none ${monthlyBalance >= 0 
          ? "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-md" 
          : "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 shadow-md"
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-violet-100 tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4" /> Bilans M-ca
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {monthlyBalance >= 0 ? '+' : ''}{monthlyBalance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${savingsRate >= 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {savingsRate >= 0 ? '💰' : '⚠️'} Zapisano {Math.abs(savingsRate).toFixed(0)}% z przychodów
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Magiczny Raport AI */}
        <AiReportDialog trigger={
          <Card className="overflow-hidden relative cursor-pointer border-none shadow-sm ring-1 ring-slate-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all duration-700" />
            <CardHeader className="pb-2">
              <CardDescription className="font-bold text-blue-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Magiczny Raport
              </CardDescription>
              <CardTitle className="text-xl font-extrabold text-slate-800 tracking-tight mt-1">
                Analiza AI
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1"> Podsumowanie <strong className="text-slate-700">{selectedWalletId === 'all' ? 'wszystkich portfeli' : 'wybranego portfela'}</strong> jednym kliknięciem. </p>
              <div className="mt-4 flex items-center text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                Generuj raport →
              </div>
            </CardContent>
          </Card>
        } />
      </div>

      {/* Wykresy */}
      <div className="grid gap-6 lg:grid-cols-3 pt-4">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <Activity className="w-6 h-6 text-blue-500" /> Trend (7 dni) - {selectedWalletId === 'all' ? 'Wszystko' : wallets.find(w => w.id === selectedWalletId)?.name}
          </h2>
          <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
            <CardContent className="p-6 h-[280px]">
              <ExpenseChart data={transactions} filter="trend" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-800">Historia wybranego konta</h2>
          <TransactionList limit={8} /> 
          {/* Note: TransactionList domyślnie ciągnie wszystko z DEXIE, musimy to potem sparametryzować, aby słuchało konkretnego portfela, ale dla MVP wyświetla 8 najnowszych ogólnie ;) TODO. */}
        </div>
      </div>
    </div>
  )
}
