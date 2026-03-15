"use client"

import { useState } from "react"
import { useMemo } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, Legend } from "recharts"
import { Transaction } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"

interface ChartProps {
  data: Transaction[]
  filter: "month" | "trend" | "compare" | "income_categories"
}

const EXPENSE_COLORS = ['#f43f5e', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1']
const INCOME_COLORS = ['#10b981', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6']

export function ExpenseChart({ data, filter }: ChartProps) {
  const categories = useLiveQuery(() => db.categories.toArray())

  const chartData: any[] = useMemo(() => {
    if (!categories) return []

    // Rozkład po kategoriach wydatków w skali miesiąca
    if (filter === "month") {
      const today = new Date()
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const thisMonth = data.filter(t => t.date >= currentMonthStart && t.type === 'expense')
      
      const aggregated = thisMonth.reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId)
        return {
          name: cat?.name || "Inne",
          amount,
          color: cat?.color || "#8884d8"
        }
      }).sort((a, b) => b.amount - a.amount).slice(0, 6)
    }

    // Rozkład po kategoriach przychodów
    if (filter === "income_categories") {
      const today = new Date()
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
      
      const thisMonth = data.filter(t => t.date >= currentMonthStart && t.type === 'income')
      
      const aggregated = thisMonth.reduce((acc, curr) => {
        acc[curr.categoryId] = (acc[curr.categoryId] || 0) + curr.amount
        return acc
      }, {} as Record<string, number>)

      return Object.entries(aggregated).map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId)
        return {
          name: cat?.name || "Inne",
          amount,
          color: cat?.color || "#10b981"
        }
      }).sort((a, b) => b.amount - a.amount).slice(0, 6)
    }

    // Trend z ostatnich 7 dni (wydatki)
    if (filter === "trend") {
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0,0,0,0)
        return d
      })

      const vibrantColors = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7']

      return last7Days.map((day, index) => {
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const amount = data
          .filter(t => t.date >= day && t.date < nextDay && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          name: day.toLocaleDateString('pl-PL', { weekday: 'short' }),
          amount,
          color: vibrantColors[index]
        }
      })
    }

    // Porównanie wydatków vs przychodów (7 dni)
    if (filter === "compare") {
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        d.setHours(0,0,0,0)
        return d
      })

      return last7Days.map((day) => {
        const nextDay = new Date(day)
        nextDay.setDate(nextDay.getDate() + 1)
        
        const expenses = data
          .filter(t => t.date >= day && t.date < nextDay && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)

        const income = data
          .filter(t => t.date >= day && t.date < nextDay && t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        return {
          name: day.toLocaleDateString('pl-PL', { weekday: 'short' }),
          wydatki: expenses,
          przychody: income,
        }
      })
    }

    return []
  }, [data, filter, categories])

  if (!chartData.length || !categories) {
    return (
      <div className="h-full w-full flex items-center justify-center text-slate-400 text-sm font-medium">
        Brak danych do wyświetlenia
      </div>
    )
  }

  // Wykres porównawczy – podwójne słupki
  if (filter === "compare") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} zł`} />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: 'none', color: '#1e293b', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
            formatter={(value: any, name: any) => [`${value.toLocaleString('pl-PL')} PLN`, name === 'wydatki' ? '🔴 Wydatki' : '🟢 Przychody']}
          />
          <Legend formatter={(value) => value === 'wydatki' ? 'Wydatki' : 'Przychody'} />
          <Bar dataKey="wydatki" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={30} />
          <Bar dataKey="przychody" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={30} />
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} />
        <YAxis stroke="#94a3b8" fontSize={12} fontWeight={500} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} zł`} />
        <Tooltip
          cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: 'none', color: '#1e293b', fontWeight: 'bold', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
          formatter={(value: any) => [`${value.toLocaleString('pl-PL')} PLN`, filter === 'income_categories' ? 'Przychód' : 'Wydatek']}
        />
        <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={filter === 'month' || filter === 'income_categories' ? 40 : 60}>
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.color || (filter === 'income_categories' ? INCOME_COLORS[index % INCOME_COLORS.length] : EXPENSE_COLORS[index % EXPENSE_COLORS.length])} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
