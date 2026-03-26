"use client"

import { useMemo, useState, useEffect } from "react"
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

// Kompaktowy ActiveShape dla mobile – tylko powiększony segment + nazwa w środku
const renderActiveShapeMobile = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent } = props;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fill={fill} fontSize={12} fontWeight="bold">
        {payload.name.length > 10 ? payload.name.slice(0, 10) + '…' : payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 11} fill={fill} />
    </g>
  );
};

// Pełny ActiveShape dla desktopu – z liniami prowadzącymi i etykietami
const renderActiveShapeDesktop = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 8) * cos;
  const sy = cy + (outerRadius + 8) * sin;
  const mx = cx + (outerRadius + 22) * cos;
  const my = cy + (outerRadius + 22) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 16;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={5} textAnchor="middle" fill={fill} fontSize={14} fontWeight="bold">
        {payload.name.length > 12 ? payload.name.slice(0, 12) + '…' : payload.name}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 8} outerRadius={outerRadius + 11} fill={fill} />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#334155" fontSize={12} fontWeight={600}>
        {`${value.toLocaleString('pl-PL')} zł`}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={16} textAnchor={textAnchor} fill="#94a3b8" fontSize={10}>
        {`(${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return isMobile
}

export function ExpenseChart({ data, filter, days = 30 }: ChartProps) {
  const categories = useLiveQuery(() => db.categories.toArray())
  const wallets = useLiveQuery(() => db.wallets.toArray())
  const [activeIndex, setActiveIndex] = useState(0)
  const isMobile = useIsMobile()

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
      }).sort((a, b) => b.value - a.value).slice(0, isMobile ? 5 : 8)
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
      }).sort((a, b) => b.value - a.value).slice(0, isMobile ? 5 : 8)
    }

    // 3. Wydatki per Portfel
    if (filter === "wallets_donut" && wallets) {
      const expenses = data.filter(t => t.type === 'expense')
      const aggregated = expenses.reduce((acc, curr) => {
        acc[curr.walletId] = (acc[curr.walletId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([walletId, amount], index) => {
        const w = wallets.find(ww => ww.id === walletId)
        return {
          name: w?.name || "Inne",
          value: amount,
          color: w?.color || WALLET_COLORS[index % WALLET_COLORS.length]
        }
      }).sort((a, b) => b.value - a.value)
    }

    // Timeline generator
    const generateTimeline = () => {
      if (days > 90) {
        const monthlyData: Record<string, { expenses: number, income: number }> = {}
        data.forEach(t => {
          const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`
          if (!monthlyData[monthKey]) monthlyData[monthKey] = { expenses: 0, income: 0 }
          if (t.type === 'expense') monthlyData[monthKey].expenses += t.amount
          if (t.type === 'income') monthlyData[monthKey].income += t.amount
        })
        
        let cumulativeBalance = 0
        return Object.keys(monthlyData).sort().map(key => {
          const d = monthlyData[key]
          cumulativeBalance += (d.income - d.expenses)
          const [, month] = key.split('-')
          const monthNames = ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru']
          return {
            name: monthNames[parseInt(month) - 1] || key,
            wydatki: d.expenses,
            przychody: d.income,
            bilans: cumulativeBalance
          }
        })
      }

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
          bilans: cumulativeBalance
        }
      })
    }

    if (filter === "trend") return generateTimeline()
    if (filter === "cashflow") return generateTimeline()

    return []
  }, [data, filter, categories, wallets, days, isMobile])

  if (!chartData.length || !categories) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium px-4 text-center">
        Brak ruchów finansowych w wybranym okresie
      </div>
    )
  }

  // ═══════════════════════════ A) DONUT / PIE ═══════════════════════════
  if (filter === "categories_donut" || filter === "income_donut" || filter === "wallets_donut") {
    if (chartData.reduce((acc, c) => acc + c.value, 0) === 0) {
       return <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium">Brak dodanych kwot do analizy</div>
    }

    const innerR = isMobile ? 40 : 55
    const outerR = isMobile ? 65 : 80
    const activeShape = isMobile ? renderActiveShapeMobile : renderActiveShapeDesktop

    // Na mobile pod wykresem pokażemy legendę
    return (
      <div className="h-full w-full flex flex-col">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={isMobile ? { top: 8, right: 8, bottom: 8, left: 8 } : { top: 20, right: 40, bottom: 20, left: 40 }}>
              <Pie
                {...({ activeIndex, activeShape } as any)}
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={innerR}
                outerRadius={outerR}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={onPieEnter}
                onClick={(_: any, idx: number) => setActiveIndex(idx)}
                stroke="none"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
                formatter={(value: any) => [`${Number(value).toLocaleString('pl-PL')} zł`, 'Kwota']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda mobilna pod wykresem */}
        {isMobile && (
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center px-2 pb-1 pt-1">
            {chartData.map((entry: any, idx: number) => (
              <button key={idx} onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full transition-all ${activeIndex === idx ? 'bg-slate-100 ring-1 ring-slate-200' : 'text-slate-500'}`}>
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="truncate max-w-[80px]">{entry.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ═══════════════════════════ B) CASHFLOW AREA ═══════════════════════════
  if (filter === "cashflow") {
    const gradientOffset = () => {
      const dataMax = Math.max(...chartData.map((i) => i.bilans));
      const dataMin = Math.min(...chartData.map((i) => i.bilans));
      if (dataMax <= 0) return 0;
      if (dataMin >= 0) return 1;
      return dataMax / (dataMax - dataMin);
    };
    const off = gradientOffset();

    // Na mobile co N-ty tick
    const tickInterval = isMobile ? Math.max(Math.floor(chartData.length / 4) - 1, 0) : undefined

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={isMobile ? { top: 5, right: 5, left: -25, bottom: 0 } : { top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stopColor="#10b981" stopOpacity={0.6} />
              <stop offset={off} stopColor="#f43f5e" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="name"
            stroke="#cbd5e1"
            fontSize={isMobile ? 9 : 11}
            tickLine={false}
            axisLine={false}
            dy={8}
            interval={tickInterval}
            angle={isMobile ? -30 : 0}
            textAnchor={isMobile ? "end" : "middle"}
          />
          <YAxis
            stroke="#cbd5e1"
            fontSize={isMobile ? 9 : 11}
            tickLine={false}
            axisLine={false}
            width={isMobile ? 35 : 50}
            tickFormatter={(v) => `${Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
          />
          <Tooltip 
             contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
             formatter={(value: any) => [`${Number(value).toLocaleString('pl-PL')} PLN`, 'Bilans']}
          />
          <Area type="monotone" dataKey="bilans" stroke="none" fill="url(#splitColor)" activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }} />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  // ═══════════════════════════ C) TREND BAR ═══════════════════════════
  const tickInterval = isMobile ? Math.max(Math.floor(chartData.length / 5) - 1, 0) : undefined

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={isMobile ? { top: 5, right: 5, left: -25, bottom: 0 } : { top: 10, right: 10, left: -10, bottom: 0 }}>
        <XAxis
          dataKey="name"
          stroke="#cbd5e1"
          fontSize={isMobile ? 9 : 11}
          tickLine={false}
          axisLine={false}
          dy={8}
          interval={tickInterval}
          angle={isMobile ? -30 : 0}
          textAnchor={isMobile ? "end" : "middle"}
        />
        <YAxis
          stroke="#cbd5e1"
          fontSize={isMobile ? 9 : 11}
          tickLine={false}
          axisLine={false}
          width={isMobile ? 35 : 50}
          tickFormatter={(v) => `${Math.abs(v) >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
          formatter={(value: any, name: any) => [`${Number(value).toLocaleString('pl-PL')} PLN`, name === 'wydatki' ? '🔴 Wydatki' : '🟢 Przychody']}
        />
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} formatter={(value) => value === 'wydatki' ? 'Wydatki' : 'Przychody'} />
        <Bar dataKey="wydatki" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 16 : 30} />
        <Bar dataKey="przychody" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={isMobile ? 16 : 30} />
      </BarChart>
    </ResponsiveContainer>
  )
}
