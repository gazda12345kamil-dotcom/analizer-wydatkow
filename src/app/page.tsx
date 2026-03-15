"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, Wallet, Sparkles } from "lucide-react"
import { AiReportDialog } from "@/components/AiReportDialog"

export default function Home() {
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const today = new Date()
  today.setHours(0,0,0,0)
  
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  
  if (!transactions) {
    return <div className="h-full w-full flex items-center justify-center animate-pulse"><Activity className="w-8 h-8 opacity-50" /></div>
  }

  // Wydatki
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

  // Bilans
  const balance = thisMonthIncome - thisMonthExpenses
  const savingsRate = thisMonthIncome > 0 ? (balance / thisMonthIncome) * 100 : 0

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Cześć!</h1>
          <p className="text-slate-500 mt-1 font-medium">Oto Twoje podsumowanie finansów na bieżący miesiąc.</p>
        </div>
      </div>

      {/* 4 Karty podsumowujące (w tym Raport AI) */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Wydatki */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 border-none shadow-[0_15px_40px_-10px_rgba(239,68,68,0.5)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-red-100 tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Wydatki
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthExpenses.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${expenseDiff > 0 ? "text-red-100 bg-red-800/40" : "text-emerald-100 bg-emerald-800/40"}`}>
                {expenseDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(expenseDiff).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Przychody */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 border-none shadow-[0_15px_40px_-10px_rgba(16,185,129,0.5)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-emerald-100 tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Przychody
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthIncome.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${incomeDiff > 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {incomeDiff > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                {Math.abs(incomeDiff).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bilans */}
        <Card className={`overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group border-none ${balance >= 0 
          ? "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-[0_15px_40px_-10px_rgba(139,92,246,0.5)]" 
          : "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 shadow-[0_15px_40px_-10px_rgba(71,85,105,0.5)]"
        }`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-violet-100 tracking-wide flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Bilans
            </CardDescription>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {balance >= 0 ? '+' : ''}{balance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2 py-0.5 rounded-full backdrop-blur-md text-xs ${savingsRate >= 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {savingsRate >= 0 ? '💰' : '⚠️'} {Math.abs(savingsRate).toFixed(0)}% oszczędności
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Magiczny Raport AI - Nowy Kafelek */}
        <AiReportDialog trigger={
          <Card className="overflow-hidden relative cursor-pointer border-none shadow-[0_15px_40px_-10px_rgba(59,130,246,0.3)] bg-white hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
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
              <p className="text-xs text-slate-500 font-medium leading-relaxed"> Wygeneruj inteligentne podsumowanie swoich finansów jednym kliknięciem. </p>
              <div className="mt-4 flex items-center text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                Kliknij aby sprawdzić →
              </div>
            </CardContent>
          </Card>
        } />
      </div>

      {/* Wykresy */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <Activity className="w-6 h-6 text-blue-500" /> Trend wydatków (7 dni)
          </h2>
          <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
            <CardContent className="p-6 h-[280px]">
              <ExpenseChart data={transactions} filter="trend" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-800">Ostatnie transakcje</h2>
          <TransactionList limit={8} />
        </div>
      </div>
    </div>
  )
}
