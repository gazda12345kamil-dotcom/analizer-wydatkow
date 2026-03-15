"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { BudgetsSection } from "@/components/BudgetsSection"
import { Activity, PieChart, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const transactions = useLiveQuery(() => db.transactions.toArray())

  if (!transactions) {
    return <div className="h-full w-full flex items-center justify-center animate-pulse"><Activity className="w-8 h-8 opacity-50" /></div>
  }

  const today = new Date()
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const thisMonthExpenses = transactions.filter(t => t.date >= currentMonth && t.type === 'expense').reduce((a, c) => a + c.amount, 0)
  const thisMonthIncome = transactions.filter(t => t.date >= currentMonth && t.type === 'income').reduce((a, c) => a + c.amount, 0)
  const balance = thisMonthIncome - thisMonthExpenses
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const daysPassed = today.getDate()
  const avgDailyExpense = daysPassed > 0 ? thisMonthExpenses / daysPassed : 0

  const kpiCards = [
    { label: 'Wydatki', value: thisMonthExpenses, color: 'text-rose-600', bg: 'bg-rose-50', icon: TrendingDown, iconColor: 'text-rose-500' },
    { label: 'Przychody', value: thisMonthIncome, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingUp, iconColor: 'text-emerald-500' },
    { label: 'Bilans', value: balance, color: balance >= 0 ? 'text-violet-600' : 'text-slate-600', bg: balance >= 0 ? 'bg-violet-50' : 'bg-slate-50', icon: Wallet, iconColor: balance >= 0 ? 'text-violet-500' : 'text-slate-500' },
    { label: 'Śr. dziennie', value: avgDailyExpense, color: 'text-blue-600', bg: 'bg-blue-50', icon: BarChart3, iconColor: 'text-blue-500' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
          <PieChart className="text-blue-500 w-8 h-8" />
          Zaawansowana Analityka
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Pełny obraz Twoich finansów. Wydatki, przychody i trendy — wszystko offline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label} className={`${kpi.bg} border-none shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                  <Icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
                <p className={`text-2xl font-extrabold ${kpi.color}`}>
                  {kpi.label === 'Bilans' && kpi.value >= 0 ? '+' : ''}
                  {kpi.value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Miesięczne Budżety */}
      <BudgetsSection transactions={transactions} />

      {/* Wykresy */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wydatki vs Przychody */}
        <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Wydatki vs Przychody (7 dni)
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Porównanie dzienne wydatków i przychodów.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ExpenseChart data={transactions} filter="compare" />
          </CardContent>
        </Card>

        {/* Rozkład kategorii wydatków */}
        <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" /> Kategorie wydatków
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Top kategorie w tym miesiącu.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ExpenseChart data={transactions} filter="month" />
          </CardContent>
        </Card>
        
        {/* Rozkład kategorii przychodów */}
        <Card className="bg-white border-none rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> Kategorie przychodów
            </CardTitle>
            <CardDescription className="text-slate-500 font-medium">Źródła Twoich przychodów.</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ExpenseChart data={transactions} filter="income_categories" />
          </CardContent>
        </Card>
      </div>

      {/* Pełna historia */}
      <div className="space-y-4 pt-4">
        <h2 className="font-bold text-xl text-slate-800">Pełna Historia Transakcji</h2>
        <Card className="bg-white/60 border-none ring-1 ring-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <TransactionList limit={50} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
