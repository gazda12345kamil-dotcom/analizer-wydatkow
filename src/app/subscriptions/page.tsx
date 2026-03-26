"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarClock, Plus, SwitchCamera, Trash2 } from "lucide-react"
import { SubscriptionDialog } from "@/components/SubscriptionDialog"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import * as Icons from "lucide-react"

export default function SubscriptionsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const recurring = useLiveQuery(() => db.recurring_transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())
  const wallets = useLiveQuery(() => db.wallets.toArray())

  if (!recurring || !categories || !wallets) {
    return (
      <div className="h-full w-full flex items-center justify-center animate-pulse">
        <CalendarClock className="w-8 h-8 opacity-50" />
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę zaplanowaną transakcję?")) {
      await db.recurring_transactions.delete(id)
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await db.recurring_transactions.update(id, { isActive: !currentStatus })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
            <CalendarClock className="text-indigo-500 w-8 h-8" />
            Zarządzaj Subskrypcjami
          </h1>
          <p className="text-slate-500 mt-1 font-medium">
            Stałe zlecenia i abonamenty automatycznie dodawane do historii.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Zaplanuj wpis
        </Button>
      </div>

      <div className="grid gap-4 mt-8">
        {recurring.length === 0 ? (
          <div className="py-12 text-center text-slate-500 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
            <SwitchCamera className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-lg text-slate-600">Brak cyklicznych transakcji</p>
            <p className="max-w-sm mx-auto mt-2">Zautomatyzuj swoje finanse dodając miesięczny koszt Netflixa lub pensję do harmonogramu.</p>
          </div>
        ) : (
          recurring.map((sub) => {
            const cat = categories.find(c => c.id === sub.categoryId)
            const wallet = wallets.find(w => w.id === sub.walletId)
            
            // @ts-ignore
            const IconComponent = cat ? (Icons[cat.icon as string] || Icons.HelpCircle) : Icons.HelpCircle
            
            const isExpense = sub.type === 'expense'
            const colorClass = isExpense ? 'text-slate-800' : 'text-emerald-600'
            const amountPrefix = isExpense ? '-' : '+'
            
            const intervalsTranslate = {
              weekly: "Co tydzień",
              monthly: "Co miesiąc",
              yearly: "Co rok"
            }

            return (
              <Card 
                key={sub.id} 
                className={`bg-white border-none rounded-2xl shadow-sm ring-1 ring-slate-100 transition-opacity ${!sub.isActive ? 'opacity-50 grayscale' : ''}`}
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div 
                      className={`p-3 rounded-2xl flex-shrink-0 ${isExpense ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-600'}`}
                      style={cat && isExpense ? { backgroundColor: `${cat.color}20`, color: cat.color } : undefined}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 text-lg">{sub.name}</h3>
                        {!sub.isActive && (
                          <span className="text-[10px] uppercase tracking-wider font-bold bg-slate-200 text-slate-500 py-0.5 px-2 rounded-full">
                            Wstrzymano
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <SwitchCamera className="w-3.5 h-3.5" />
                          {intervalsTranslate[sub.interval]}
                        </span>
                        {cat && <span>Kategoria: {cat.name}</span>}
                        {wallet && <span className="text-slate-400">• Z portfela: {wallet.name}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-1 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                    <div className="text-left sm:text-right">
                      <div className={`font-black text-xl ${colorClass}`}>
                        {amountPrefix}{sub.amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 sm:justify-end mt-1">
                        Następna: 
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {format(new Date(sub.nextDate), "d MMM yyyy", { locale: pl })}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 items-center sm:mt-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => toggleStatus(sub.id, sub.isActive)}
                        className="text-xs h-8"
                      >
                        {sub.isActive ? "Pauzuj" : "Wznów"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDelete(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <SubscriptionDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
