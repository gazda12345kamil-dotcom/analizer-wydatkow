"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { BudgetsSection } from "@/components/BudgetsSection"
import { Activity, PieChart, TrendingUp, TrendingDown, Wallet, BarChart3, Clock, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export default function AnalyticsPage() {
  const transactions = useLiveQuery(() => db.transactions.toArray())
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90" | "365" | "all">("30")

  if (!transactions) {
    return <div className="h-full w-full flex items-center justify-center animate-pulse"><Activity className="w-8 h-8 opacity-50 text-blue-500" /></div>
  }

  // --- 1. Filtrowanie Czasowe ---
  const today = new Date()
  const filterDate = new Date()
  if (timeRange !== "all") {
    filterDate.setDate(today.getDate() - parseInt(timeRange))
  } else {
    filterDate.setFullYear(2000)
  }

  const currentPeriodTx = transactions.filter(t => t.date >= filterDate && t.date <= today)

  // Poprzedni okres do trendów
  const prevFilterDate = new Date(filterDate)
  if (timeRange !== "all") {
    prevFilterDate.setDate(prevFilterDate.getDate() - parseInt(timeRange))
  }
  const prevPeriodTx = transactions.filter(t => timeRange === "all" ? false : (t.date >= prevFilterDate && t.date < filterDate))

  // --- 2. KPI ---
  const currentExpenses = currentPeriodTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0)
  const prevExpenses = prevPeriodTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0)
  
  const currentIncome = currentPeriodTx.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0)
  const prevIncome = prevPeriodTx.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0)
  
  const currentBalance = currentIncome - currentExpenses
  const prevBalance = prevIncome - prevExpenses

  const daysPassed = timeRange === "all" ? Math.max(1, Math.ceil((today.getTime() - (transactions[transactions.length-1]?.date.getTime() || today.getTime())) / (1000 * 3600 * 24))) : parseInt(timeRange)
  const avgDailyExpense = currentExpenses / (daysPassed || 1)

  const getTrend = (current: number, prev: number) => {
    if (prev === 0) return null
    const diff = current - prev
    const percent = Math.abs((diff / prev) * 100).toFixed(1)
    const isUp = diff > 0
    return { percent, isUp, diff }
  }

  const expTrend = getTrend(currentExpenses, prevExpenses)
  const incTrend = getTrend(currentIncome, prevIncome)

  const kpiCards = [
    { label: 'Wydatki', value: currentExpenses, color: 'text-rose-600', bg: 'bg-gradient-to-br from-rose-50 to-white border-rose-100', icon: TrendingDown, iconColor: 'bg-rose-100 text-rose-600', trend: expTrend, goodDirectionDown: true },
    { label: 'Przychody', value: currentIncome, color: 'text-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100', icon: TrendingUp, iconColor: 'bg-emerald-100 text-emerald-600', trend: incTrend, goodDirectionDown: false },
    { label: 'Bilans', value: currentBalance, color: currentBalance >= 0 ? 'text-violet-600' : 'text-slate-600', bg: currentBalance >= 0 ? 'bg-gradient-to-br from-violet-50 to-white border-violet-100' : 'bg-slate-50 border-slate-200', icon: Wallet, iconColor: currentBalance >= 0 ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-500', trend: getTrend(currentBalance, prevBalance), goodDirectionDown: false },
    { label: 'Śr. dziennie', value: avgDailyExpense, color: 'text-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-white border-blue-100', icon: BarChart3, iconColor: 'bg-blue-100 text-blue-600', trend: null, goodDirectionDown: true },
  ]

  // Tagi
  const tagCounts: Record<string, {count: number, cost: number}> = {}
  currentPeriodTx.filter(t => t.type === 'expense' && t.tagIds && t.tagIds.length > 0).forEach(t => {
    t.tagIds!.forEach(tag => {
      if(!tagCounts[tag]) tagCounts[tag] = { count: 0, cost: 0 }
      tagCounts[tag].count += 1
      tagCounts[tag].cost += t.amount
    })
  })
  const topTags = Object.entries(tagCounts).sort((a,b) => b[1].cost - a[1].cost).slice(0, 5)

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-16">
      
      {/* === Header + Selektor Czasu === */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2.5 text-slate-800">
            <PieChart className="text-blue-500 w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" strokeWidth={2.5} />
            Centrum Analityki
          </h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">
            Pełen obraz Twoich finansów — wykresy, trendy i nawyki.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100 self-start">
          <Clock className="w-4 h-4 text-slate-400 ml-2" />
          <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <SelectTrigger className="w-[160px] sm:w-[180px] border-none shadow-none focus:ring-0 font-bold text-sm text-slate-700 bg-transparent h-8">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl font-medium">
              <SelectItem value="7">Ostatnie 7 dni</SelectItem>
              <SelectItem value="30">Ostatnie 30 dni</SelectItem>
              <SelectItem value="90">Ostatni kwartał</SelectItem>
              <SelectItem value="365">Ostatni rok</SelectItem>
              <SelectItem value="all">Cała historia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* === KPI Cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          const t = kpi.trend
          
          let tColor = "text-slate-400"
          if (t) {
            if (t.isUp) tColor = kpi.goodDirectionDown ? "text-rose-500 bg-rose-50" : "text-emerald-500 bg-emerald-50"
            else tColor = kpi.goodDirectionDown ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50"
          }

          return (
            <Card key={kpi.label} className={cn("border shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden", kpi.bg)}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/40 rounded-full blur-2xl -mr-12 -mt-12" />
              <CardContent className="p-3 sm:p-4 flex flex-col gap-2 relative">
                
                <div className="flex items-center justify-between">
                  <div className={cn("p-1.5 sm:p-2 rounded-lg", kpi.iconColor)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {t && timeRange !== "all" && (
                    <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-bold", tColor)}>
                      {t.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {t.percent}%
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-500/80 uppercase tracking-wider block mb-0.5">{kpi.label}</span>
                  <p className={cn("text-lg sm:text-2xl font-black tracking-tight", kpi.color)}>
                    {kpi.value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 })}
                  </p>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* === Miesięczne Budżety (Limity Kategorii) === */}
      <Card className="bg-white border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <BudgetsSection transactions={transactions} />
        </CardContent>
      </Card>

      {/* === Cashflow + Portfele === */}
      <div className="grid gap-5 lg:grid-cols-3">
        
        {/* Cashflow */}
        <Card className="bg-white border-blue-100 rounded-2xl sm:rounded-[2rem] shadow-lg lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-1 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" /> 
              Płynność Finansowa
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium">
              Skumulowany bilans — rośnie (zielony) lub maleje (czerwony).
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[300px] px-1 sm:px-4 pb-3">
            <ExpenseChart data={currentPeriodTx} filter="cashflow" days={parseInt(timeRange) || 30} />
          </CardContent>
        </Card>

        {/* Portfele Donut */}
        <Card className="bg-white border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg overflow-hidden">
          <CardHeader className="pb-0 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
              Obciążenie Portfeli
            </CardTitle>
            <CardDescription className="text-xs font-medium">Skąd wycieka w tym okresie?</CardDescription>
          </CardHeader>
          <CardContent className="h-[240px] sm:h-[280px] mt-2">
            <ExpenseChart data={currentPeriodTx} filter="wallets_donut" />
          </CardContent>
        </Card>
      </div>

      {/* === Donuty Kategorii === */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="bg-white border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
            <CardTitle className="text-sm sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 flex-shrink-0" /> Kategorie wydatków
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium">Dotknij segmentu, aby zobaczyć detale.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[320px]">
            <ExpenseChart data={currentPeriodTx} filter="categories_donut" />
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-0">
            <CardTitle className="text-sm sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0" /> Kategorie przychodów
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm font-medium">Główne źródła zysku.</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px] sm:h-[320px]">
            <ExpenseChart data={currentPeriodTx} filter="income_donut" />
          </CardContent>
        </Card>
      </div>

      {/* === Trend Bar + Tagi === */}
      <div className="grid gap-5 lg:grid-cols-3">
        
        {/* Trend BarChart */}
        <Card className="bg-white border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg lg:col-span-2 overflow-hidden">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" /> Wydatki vs Przychody
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] sm:h-[280px] px-1 sm:px-4 pb-3">
            <ExpenseChart data={currentPeriodTx} filter="trend" days={Math.min(parseInt(timeRange) || 30, 30)} />
          </CardContent>
        </Card>

        {/* Ranking Tagów */}
        <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-600 border-none text-white rounded-2xl sm:rounded-[2rem] shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-sm sm:text-lg font-extrabold flex items-center gap-2 text-white">
              <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-200 flex-shrink-0" /> Najdroższe #Tagi
            </CardTitle>
            <CardDescription className="text-fuchsia-100/70 text-xs font-medium">Na co poszło najwięcej.</CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            {topTags.length > 0 ? (
              <ul className="space-y-3 relative z-10">
                {topTags.map(([tag, stat], idx) => (
                  <li key={tag} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs tracking-wide truncate">#{tag}</p>
                        <p className="text-[9px] text-fuchsia-200">{stat.count}x</p>
                      </div>
                    </div>
                    <span className="font-black text-xs bg-white/10 px-2 py-0.5 rounded-md flex-shrink-0">
                      {stat.cost.toLocaleString('pl-PL', { minimumFractionDigits: 0 })} zł
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-24 flex items-center justify-center text-center text-fuchsia-200 font-medium text-xs px-2">
                Brak tagów w tym okresie. Dodaj tagi podczas nowej transakcji.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === Historia === */}
      <div className="space-y-3 pt-4">
        <h2 className="font-black text-lg sm:text-2xl text-slate-800 px-1">Dziennik Operacji</h2>
        <Card className="bg-white/80 backdrop-blur-lg border-slate-100 rounded-2xl sm:rounded-[2rem] shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <TransactionList limit={timeRange === "7" ? 50 : 25} />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
