"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransactionList } from "@/components/TransactionList"
import { ExpenseChart } from "@/components/ExpenseChart"
import { BudgetChartSection } from "@/components/BudgetChartSection" // Optional: if we want to split BudgetsSection into Analytics
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
    filterDate.setFullYear(2000) // All time fallback
  }

  const currentPeriodTx = transactions.filter(t => t.date >= filterDate && t.date <= today)

  // Dla porównania, wyliczamy "Poprzedni Okres" by dać % wzrostu
  const prevFilterDate = new Date(filterDate)
  if (timeRange !== "all") {
    prevFilterDate.setDate(prevFilterDate.getDate() - parseInt(timeRange))
  }
  const prevPeriodTx = transactions.filter(t => timeRange === "all" ? false : (t.date >= prevFilterDate && t.date < filterDate))

  // --- 2. Wyliczenia KPI ---
  const currentExpenses = currentPeriodTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0)
  const prevExpenses = prevPeriodTx.filter(t => t.type === 'expense').reduce((a, c) => a + c.amount, 0)
  
  const currentIncome = currentPeriodTx.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0)
  const prevIncome = prevPeriodTx.filter(t => t.type === 'income').reduce((a, c) => a + c.amount, 0)
  
  const currentBalance = currentIncome - currentExpenses
  const prevBalance = prevIncome - prevExpenses

  const daysPassed = timeRange === "all" ? Math.max(1, Math.ceil((today.getTime() - (transactions[transactions.length-1]?.date.getTime() || today.getTime())) / (1000 * 3600 * 24))) : parseInt(timeRange)
  const avgDailyExpense = currentExpenses / (daysPassed || 1)

  // Pomocnicza funkcja do trendu %
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
    { 
      label: 'Wydatki (Okres)', 
      value: currentExpenses, 
      color: 'text-rose-600', 
      bg: 'bg-gradient-to-br from-rose-50 to-white border-rose-100', 
      icon: TrendingDown, 
      iconColor: 'bg-rose-100 text-rose-600',
      trend: expTrend,
      goodDirectionDown: true // Wydatki w dół to dobrze
    },
    { 
      label: 'Przychody (Okres)', 
      value: currentIncome, 
      color: 'text-emerald-600', 
      bg: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100', 
      icon: TrendingUp, 
      iconColor: 'bg-emerald-100 text-emerald-600',
      trend: incTrend,
      goodDirectionDown: false
    },
    { 
      label: 'Całkowity Bilans', 
      value: currentBalance, 
      color: currentBalance >= 0 ? 'text-violet-600' : 'text-slate-600', 
      bg: currentBalance >= 0 ? 'bg-gradient-to-br from-violet-50 to-white border-violet-100' : 'bg-slate-50 border-slate-200', 
      icon: Wallet, 
      iconColor: currentBalance >= 0 ? 'bg-violet-100 text-violet-600' : 'bg-slate-200 text-slate-500',
      trend: getTrend(currentBalance, prevBalance),
      goodDirectionDown: false
    },
    { 
      label: 'Średnio Dziennie', 
      value: avgDailyExpense, 
      color: 'text-blue-600', 
      bg: 'bg-gradient-to-br from-blue-50 to-white border-blue-100', 
      icon: BarChart3, 
      iconColor: 'bg-blue-100 text-blue-600',
      trend: null,
      goodDirectionDown: true
    },
  ]

  // Najpopularniejsze tagi = Ekstrakt
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
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      
      {/* Header & Interaktywny Selektor */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-slate-800">
            <PieChart className="text-blue-500 w-8 h-8" strokeWidth={2.5} />
            Centrum Analityki
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Monitoruj płynność, trendy i poznaj swoje nawyki wydatkowe na zaawansowanych wykresach.
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-slate-100">
          <Clock className="w-4 h-4 text-slate-400 ml-3" />
          <Select value={timeRange} onValueChange={(val: any) => setTimeRange(val)}>
            <SelectTrigger className="w-[180px] border-none shadow-none focus:ring-0 font-bold text-slate-700 bg-transparent">
              <SelectValue placeholder="Wybierz okres" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl font-medium">
              <SelectItem value="7">Ostatnie 7 dni</SelectItem>
              <SelectItem value="30">Ostatnie 30 dni</SelectItem>
              <SelectItem value="90">Ostatni Kwartał</SelectItem>
              <SelectItem value="365">Ostatni Rok</SelectItem>
              <SelectItem value="all">Cała Historia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          const t = kpi.trend
          
          let tColor = "text-slate-400"
          if (t) {
            if (t.isUp) tColor = kpi.goodDirectionDown ? "text-rose-500 bg-rose-50" : "text-emerald-500 bg-emerald-50"
            else tColor = kpi.goodDirectionDown ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50"
          }

          return (
            <Card key={kpi.label} className={cn("border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden", kpi.bg)}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/40 rounded-full blur-3xl -mr-16 -mt-16" />
              <CardContent className="p-5 flex flex-col justify-between h-full relative">
                
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("p-2.5 rounded-xl", kpi.iconColor)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {t && timeRange !== "all" && (
                    <div className={cn("flex flex-col items-end px-2 py-1 rounded-lg text-xs font-bold", tColor)}>
                      <span className="flex items-center gap-0.5">
                        {t.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                        {t.percent}%
                      </span>
                      <span className="text-[9px] text-slate-400 opacity-80 uppercase tracking-widest mt-0.5">vs ost. {timeRange}d</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-500/80 uppercase tracking-widest block mb-1">{kpi.label}</span>
                  <p className={cn("text-3xl font-black tracking-tight", kpi.color)}>
                    {kpi.value.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 })}
                  </p>
                </div>

              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Wykresy Złożone */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Cashflow AreaChart */}
        <Card className="bg-white border-blue-100 rounded-[2rem] shadow-xl shadow-blue-900/5 lg:col-span-2 overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" /> 
              Płynność Finansowa (Skumulowany Bilans)
            </CardTitle>
            <CardDescription className="font-medium">
              Obrazuje, jak Twoje oszczędności rosną (zielony) lub maleją (czerwony) na przestrzeni ubiegłych {timeRange === 'all' ? 'lat' : `${timeRange} dni`}.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[340px] flex-1 px-1 sm:px-4">
            <ExpenseChart data={currentPeriodTx} filter="cashflow" days={parseInt(timeRange) || 30} />
          </CardContent>
        </Card>

        {/* Portfele - Gdzie trzymasz pieniądze lub skąd schodzą */}
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-lg shadow-slate-200/50 flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-500" />
              Obciążenie Portfeli
            </CardTitle>
            <CardDescription className="text-xs font-medium">Skąd wycieka w tym okresie?</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] w-full mt-4 flex-1">
            <ExpenseChart data={currentPeriodTx} filter="wallets_donut" />
          </CardContent>
        </Card>

      </div>

      {/* Wykresy Kołowe Kategorii (Wydatki vs Przychody) */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-rose-500" /> Pączek Wydatków
            </CardTitle>
            <CardDescription className="font-medium">Nawiń myszą lub dotknij, aby zobaczyć detale.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ExpenseChart data={currentPeriodTx} filter="categories_donut" />
          </CardContent>
        </Card>
        
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-lg shadow-slate-200/50">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" /> Pączek Przychodów
            </CardTitle>
            <CardDescription className="font-medium">Główne źródła zysku w wybranym czasie.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ExpenseChart data={currentPeriodTx} filter="income_donut" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Trend Porównawczy i Najdroższe Tagi */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Trend BarChart */}
        <Card className="bg-white border-slate-100 rounded-[2rem] shadow-lg shadow-slate-200/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Porównanie Dzień po Dniu
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ExpenseChart data={currentPeriodTx} filter="trend" days={Math.min(parseInt(timeRange) || 30, 30)} />
          </CardContent>
        </Card>

        {/* Chmura Tagów / Ranking */}
        <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-600 border-none text-white rounded-[2rem] shadow-xl shadow-fuchsia-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <CardHeader>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-white">
              <Tag className="w-5 h-5 text-fuchsia-200" /> Najdroższe Hasła (#Tagi)
            </CardTitle>
            <CardDescription className="text-fuchsia-100/70 font-medium">Na co poszło najwięcej pod kątem Twoich własnych słów kluczowych.</CardDescription>
          </CardHeader>
          <CardContent>
            {topTags.length > 0 ? (
              <ul className="space-y-4 relative z-10">
                {topTags.map(([tag, stat], idx) => (
                  <li key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs backdrop-blur-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-sm tracking-wide">#{tag.toUpperCase()}</p>
                        <p className="text-[10px] text-fuchsia-200 font-medium">{stat.count} transakcji</p>
                      </div>
                    </div>
                    <span className="font-black text-white bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
                      {stat.cost.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN', minimumFractionDigits: 0 })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="h-32 flex items-center justify-center text-center text-fuchsia-200 font-medium text-sm">
                Brak przypisanych tagów do wydatków w tym okresie. Dodaj Tagi podczas nowej transakcji.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Pełna historia filtrowana */}
      <div className="space-y-4 pt-6">
        <h2 className="font-black text-2xl text-slate-800 px-2 lg:px-0">Dziennik Operacji (Z tego okresu)</h2>
        <Card className="bg-white/80 backdrop-blur-lg border-slate-100 rounded-[2rem] shadow-xl shadow-slate-200/50">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <TransactionList limit={timeRange === "7" ? 50 : 25} />
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
