"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, TrendingDown, Wallet } from "lucide-react"

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

      {/* 3 Karty podsumowujące */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Wydatki */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 border-none shadow-[0_15px_40px_-10px_rgba(239,68,68,0.5)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-red-100 tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4" /> Wydatki
            </CardDescription>
            <CardTitle className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthExpenses.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2.5 py-1 rounded-full backdrop-blur-md text-xs ${expenseDiff > 0 ? "text-red-100 bg-red-800/40" : "text-emerald-100 bg-emerald-800/40"}`}>
                {expenseDiff > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                {Math.abs(expenseDiff).toFixed(1)}%
              </span>
              <span className="text-red-100/80 text-xs font-medium">vs zeszły miesiąc</span>
            </div>
          </CardContent>
        </Card>

        {/* Przychody */}
        <Card className="overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 border-none shadow-[0_15px_40px_-10px_rgba(16,185,129,0.5)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-emerald-100 tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Przychody
            </CardDescription>
            <CardTitle className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {thisMonthIncome.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2.5 py-1 rounded-full backdrop-blur-md text-xs ${incomeDiff > 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {incomeDiff > 0 ? <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-1" />}
                {Math.abs(incomeDiff).toFixed(1)}%
              </span>
              <span className="text-emerald-100/80 text-xs font-medium">vs zeszły miesiąc</span>
            </div>
          </CardContent>
        </Card>

        {/* Bilans */}
        <Card className={`overflow-hidden relative transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group border-none sm:col-span-2 lg:col-span-1 ${balance >= 0 
          ? "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 shadow-[0_15px_40px_-10px_rgba(139,92,246,0.5)]" 
          : "bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 shadow-[0_15px_40px_-10px_rgba(71,85,105,0.5)]"
        }`}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all duration-700" />
          <CardHeader className="pb-2 relative z-10">
            <CardDescription className="font-semibold text-violet-100 tracking-wide flex items-center gap-2">
              <Wallet className="w-4 h-4" /> Bilans
            </CardDescription>
            <CardTitle className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1 drop-shadow-sm">
              {balance >= 0 ? '+' : ''}{balance.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="flex items-center gap-2 text-sm mt-3">
              <span className={`flex items-center font-bold px-2.5 py-1 rounded-full backdrop-blur-md text-xs ${savingsRate >= 0 ? "text-emerald-100 bg-emerald-800/40" : "text-red-100 bg-red-800/40"}`}>
                {savingsRate >= 0 ? '💰' : '⚠️'} {Math.abs(savingsRate).toFixed(0)}% oszczędności
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wykresy */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold text-xl flex items-center gap-2 text-slate-800">
            <Activity className="w-6 h-6 text-blue-500" /> Trend wydatków (7 dni)
          </h2>
          <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 ring-1 ring-slate-100">
            <CardContent className="p-6 h-[300px]">
              <ExpenseChart data={transactions} filter="trend" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="font-bold text-lg text-slate-800">Ostatnie transakcje</h2>
          <TransactionList limit={5} />
        </div>
      </div>
    </div>
  )
}
