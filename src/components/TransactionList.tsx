"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Wallet, Trash2, ArrowDownLeft, ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function TransactionList({ limit = 5 }: { limit?: number }) {
  const transactions = useLiveQuery(() => 
    db.transactions.orderBy('date').reverse().limit(limit).toArray()
  )

  const categories = useLiveQuery(() => db.categories.toArray())

  if (!transactions || !categories) {
    return <div className="animate-pulse space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-100 rounded-xl" />
      ))}
    </div>
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 border-2 border-dashed rounded-xl border-slate-200">
        <Wallet className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-semibold">Brak transakcji w historii.</p>
        <p className="text-sm">Dodaj swój pierwszy wydatek lub przychód by rozpocząć śledzenie.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((t, index) => {
        const cat = categories.find(c => c.id === t.categoryId)
        const isIncome = t.type === 'income'
        return (
          <div 
            key={t.id} 
            className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group animate-in slide-in-from-bottom-2 fade-in"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm"
                style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
              >
                {isIncome 
                  ? <ArrowUpRight className="w-5 h-5" />
                  : <ArrowDownLeft className="w-5 h-5" />
                }
              </div>
              <div>
                <p className="font-bold text-slate-800 line-clamp-1">{t.description}</p>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {cat?.name || 'Inne'}
                  </span>
                  <span>•</span>
                  <span>{format(t.date, "d MMM yyyy", { locale: pl })}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <p className={`font-black text-lg whitespace-nowrap transition-colors ${
                isIncome 
                  ? 'text-emerald-600 group-hover:text-emerald-700' 
                  : 'text-slate-800 group-hover:text-rose-500'
              }`}>
                {isIncome ? '+' : '-'}{t.amount.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => db.transactions.delete(t.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
