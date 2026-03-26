"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, Transaction, Category, Budget } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Target, Pencil, PlusCircle, Trash2 } from "lucide-react"
import { BudgetDialog } from "@/components/BudgetDialog"

interface BudgetsSectionProps {
  transactions: Transaction[]
}

// Mapowanie ikon z bazy do komponentów z lucide-react (uproszczone z constants.ts)
import * as Icons from "lucide-react"

export function BudgetsSection({ transactions }: BudgetsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<{ categoryId: string, amount: number } | null>(null)

  const budgets = useLiveQuery(() => db.budgets.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())

  if (!budgets || !categories) return null

  const globalBudgets = budgets.filter(b => b.yearMonth === 'global' || !b.yearMonth)

  // Obliczenia dla obecnego miesiąca
  const today = new Date()
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const thisMonthExpenses = transactions.filter(t => t.date >= currentMonthStart && t.type === 'expense')

  const handleDelete = async (budgetId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten limit?")) {
      await db.budgets.delete(budgetId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-6 h-6 text-indigo-500" />
            Miesięczne Budżety
          </h2>
          <p className="text-sm text-slate-500">Kontroluj limity wydatków w poszczególnych kategoriach.</p>
        </div>
        <Button onClick={() => { setEditingBudget(null); setDialogOpen(true) }} size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Dodaj limit</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {globalBudgets.length === 0 && (
          <div className="col-span-full py-8 text-center text-slate-500 bg-white/50 rounded-2xl border border-dashed border-slate-200">
            <Target className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-600">Brak zdefiniowanych budżetów</p>
            <p className="text-sm mt-1">Dodaj limit miesięczny na wybraną kategorię, bylepiej kontrolować wydatki.</p>
          </div>
        )}

        {globalBudgets.map(budget => {
          const cat = categories.find(c => c.id === budget.categoryId)
          if (!cat) return null

          // @ts-ignore
          const IconComponent = Icons[cat.icon as string] || Icons.CircleDollarSign

          const spentAmount = thisMonthExpenses
            .filter(t => t.categoryId === cat.id || t.tagIds?.includes(cat.id)) // Czasem wydatki na subkategorie
            .reduce((sum, t) => sum + t.amount, 0)
          
          let progressPercent = (spentAmount / budget.amountLimit) * 100
          if (progressPercent > 100) progressPercent = 100

          const isOverBudget = spentAmount > budget.amountLimit
          const colorClass = isOverBudget ? 'text-rose-600' : 'text-slate-800'
          const progressIndicatorClass = isOverBudget ? 'bg-rose-500' : 'bg-indigo-500'

          return (
            <Card key={budget.id} className="bg-white border-none rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] ring-1 ring-slate-100 overflow-hidden relative group">
              <div 
                className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10"
              >
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="w-7 h-7 bg-slate-100 hover:bg-slate-200 text-slate-600"
                  onClick={() => {
                    setEditingBudget({ categoryId: budget.categoryId, amount: budget.amountLimit })
                    setDialogOpen(true)
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {budget.id && (
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="w-7 h-7 opacity-80 hover:opacity-100"
                    onClick={() => handleDelete(budget.id!)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <CardContent className="p-5 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-2xl`} style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{cat.name}</h3>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{budget.amountLimit} ZŁ / MC</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-slate-500">Wydano w tym miesiącu</span>
                    <span className={`font-bold ${colorClass}`}>
                      {spentAmount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                    </span>
                  </div>
                  <Progress 
                    value={progressPercent} 
                    className="h-2 bg-slate-100" 
                    indicatorClassName={progressIndicatorClass} 
                  />
                  <div className="flex justify-between text-xs font-medium text-slate-400">
                    <span>0 zł</span>
                    <span className={isOverBudget ? 'text-rose-500' : ''}>
                      {isOverBudget ? `Przekroczono o ${(spentAmount - budget.amountLimit).toLocaleString('pl-PL', { currency: 'PLN', style: 'currency' })}` : `Pozostało ${(budget.amountLimit - spentAmount).toLocaleString('pl-PL', { currency: 'PLN', style: 'currency' })}`}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <BudgetDialog 
        open={dialogOpen} 
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen)
          if (!isOpen) setTimeout(() => setEditingBudget(null), 300)
        }}
        initialCategoryId={editingBudget?.categoryId}
        initialAmount={editingBudget?.amount}
      />
    </div>
  )
}
