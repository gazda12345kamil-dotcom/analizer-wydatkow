"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Legend, AreaChart, Area, PieChart, Pie, Sector } from "recharts"
import { Transaction } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

interface ChartProps {
  data: Transaction[]
  filter: "trend" | "categories_donut" | "income_donut" | "cashflow" | "wallets_donut"
  days?: number
}

const EXPENSE_COLORS = ['#f43f5e', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f87171', '#fb923c', '#facc15']
const INCOME_COLORS = ['#10b981', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6', '#34d399', '#2dd4bf']
const WALLET_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#64748b']

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize={18} fontWeight="bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" fontSize={14} fontWeight={600}>{`${value.toLocaleString('pl-PL')} zł`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" fontSize={12}>
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

export function ExpenseChart({ data, filter, days = 30 }: ChartProps) {
  const categories = useLiveQuery(() => db.categories.toArray())
  const wallets = useLiveQuery(() => db.wallets.toArray())
  const [activeIndex, setActiveIndex] = useState(0)

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const chartData: any[] = useMemo(() => {
    if (!categories || !data || data.length === 0) return []

    // 1. Wykres Pączek (Donut) Kategorii Wydatków
    if (filter === "categories_donut") {
      const expenses = data.filter(t => t.type === 'expense')
      const aggregated = expenses.reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId)
        return {
          name: cat?.name || "Inne",
          value: amount,
          color: cat?.color || "#8884d8"
        }
      }).sort((a, b) => b.value - a.value).slice(0, 8)
    }

    // 2. Wykres Pączek Kategorii Przychodów
    if (filter === "income_donut") {
      const incomes = data.filter(t => t.type === 'income')
      const aggregated = incomes.reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId)
        return {
          name: cat?.name || "Inne",
          value: amount,
          color: cat?.color || "#10b981"
        }
      }).sort((a, b) => b.value - a.value).slice(0, 8)
    }

    // 3. Wydatki per Portfel (Gdzie uciekają środki)
    if (filter === "wallets_donut" && wallets) {
      const expenses = data.filter(t => t.type === 'expense')
      const aggregated = expenses.reduce((acc, curr) => {
        acc[curr.walletId] = (acc[curr.walletId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([walletId, amount], index) => {
        const w = wallets.find(ww => ww.id === walletId)
        return {
          name: w?.name || "Niezdefiniowane",
          value: amount,
          color: w?.color || WALLET_COLORS[index % WALLET_COLORS.length]
        }
      }).sort((a, b) => b.value - a.value)
    }

    // Obliczanie dni do wykresów osi czasu
    const generateTimeline = () => {
      // Dla małej ilości dni np. 7, 30, tworzymy dokładnie tyle punktów
      // Dla 365 tworzymy grupę po tygodniach lub miesiącach by wykres się nie zaciął, ale narazie trzymajmy daily dla uproszczenia (do max 90, a dla 365 zróbmy grouped by month)
      if (days > 90) {
        // Group by month
        const monthlyData: Record<string, { expenses: number, income: number, balance: number }> = {}
        data.forEach(t => {
          const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}` // YYYY-MM
          if (!monthlyData[monthKey]) monthlyData[monthKey] = { expenses: 0, income: 0, balance: 0 }
          if (t.type === 'expense') monthlyData[monthKey].expenses += t.amount
          if (t.type === 'income') monthlyData[monthKey].income += t.amount
        })
        
        let cumulativeBalance = 0
        return Object.keys(monthlyData).sort().map(key => {
          const d = monthlyData[key]
          cumulativeBalance += (d.income - d.expenses)
          return {
            name: key,
            wydatki: d.expenses,
            przychody: d.income,
            bilans: cumulativeBalance
          }
        })
      }

      // Group by daily
      const daysArray = Array.from({length: days}, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (days - 1 - i))
        d.setHours(0,0,0,0)
        return d
      })

      let cumulativeBalance = 0
      return daysArray.map((day) => {
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const expenses = data
          .filter(t => t.date >= day && t.date < nextDay && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        const income = data
          .filter(t => t.date >= day && t.date < nextDay && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        cumulativeBalance += (income - expenses)

        return {
          name: day.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }),
          wydatki: expenses,
          przychody: income,
          bilans: cumulativeBalance // Domyślnie używane w Cashflow AreaChart
        }
      })
    }

    // 4. Trend Czasowy / BarChart
    if (filter === "trend") {
      return generateTimeline()
    }

    // 5. Cashflow (Bilans Skumulowany)
    if (filter === "cashflow") {
      return generateTimeline()
    }

    return []
  }, [data, filter, categories, wallets, days])

  if (!chartData.length || !categories) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium">
        Brak ruchów finansowych w wybranym okresie
      </div>
    )
  }

  // A) Wykresy typu Pączek (Pie / Donut) dla Kategorii i Portfeli
  if (filter === "categories_donut" || filter === "income_donut" || filter === "wallets_donut") {
    // Jeżeli brak danych bo wartość 0
    if (chartData.reduce((acc, c) => acc + c.value, 0) === 0) {
       return <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium">Brak dodanych kwot do analizy</div>
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          {/* @ts-ignore - Recharts known type issue with activeIndex in some TS versions */}
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            onMouseEnter={onPieEnter}
            stroke="none"
          >
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    )
  }

  // B) Wykres Obszarowy Płynności Finansowej (Cashflow)
  if (filter === "cashflow") {
    // Sprawdzamy czy bilans spada poniżej zera by nałożyć czerwony gradient
    const gradientOffset = () => {
      const dataMax = Math.max(...chartData.map((i) => i.bilans));
      const dataMin = Math.min(...chartData.map((i) => i.bilans));
      if (dataMax <= 0) return 0;
      if (dataMin >= 0) return 1;
      return dataMax / (dataMax - dataMin);
    };
    const off = gradientOffset();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.6} />   {/* Zielony do Zera */}
              <stop offset={off} stopColor="#f43f5e" stopOpacity={0.6} />   {/* Czerwony pod Zerem */}
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} dy={10} />
          <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v > 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
          <Tooltip 
             contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: 'none', color: '#1e293b', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
             formatter={(value: any) => [`${Number(value).toLocaleString('pl-PL')} PLN`, 'Skumulowany Bilans']}
          />
          <Area type="monotone" dataKey="bilans" stroke="#none" fill="url(#splitColor)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // C) Trend BarChart (Porównanie Wydatki / Przychody w czasie)
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} dy={10} />
        <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v > 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: 'none', color: '#1e293b', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
          formatter={(value: any, name: any) => [`${Number(value).toLocaleString('pl-PL')} PLN`, name === 'wydatki' ? '🔴 Wydatki' : '🟢 Przychody']}
        />
        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} formatter={(value) => value === 'wydatki' ? 'Wydatki' : 'Przychody'} />
        <Bar dataKey="wydatki" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Bar dataKey="przychody" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  )
}
