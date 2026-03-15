"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, Transaction } from "@/lib/db"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { Wallet, ArrowDownLeft, ArrowUpRight, Pencil } from "lucide-react"
import { EditTransactionDialog } from "@/components/EditTransactionDialog"

export function TransactionList({ limit = 5 }: { limit?: number }) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)

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
        <p className="text-sm">Dodaj swój pierwszy wydatek lub przychód.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((t, index) => {
          const cat = categories.find(c => c.id === t.categoryId)
          const isIncome = t.type === 'income'
          return (
            <div 
              key={t.id} 
              className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md rounded-2xl border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-0.5 transition-all duration-300 group animate-in slide-in-from-bottom-2 fade-in cursor-pointer active:scale-[0.98]"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              onClick={() => setEditingTransaction(t)}
            >
              <div className="flex items-center gap-3.5">
                <div 
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm"
                  style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}
                >
                  {isIncome 
                    ? <ArrowUpRight className="w-5 h-5" />
                    : <ArrowDownLeft className="w-5 h-5" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 text-sm line-clamp-1">{t.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mt-0.5">
                    <span className={`px-1.5 py-0.5 rounded-full ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {cat?.name || 'Inne'}
                    </span>
                    <span>•</span>
                    <span>{format(t.date, "d MMM", { locale: pl })}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <p className={`font-black text-base whitespace-nowrap transition-colors ${
                  isIncome 
                    ? 'text-emerald-600' 
                    : 'text-slate-800 group-hover:text-rose-500'
                }`}>
                  {isIncome ? '+' : '-'}{t.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })}
                </p>
                <Pencil className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialog edycji */}
      {editingTransaction && (
        <EditTransactionDialog
          transaction={editingTransaction}
          open={!!editingTransaction}
          onOpenChange={(open) => { if (!open) setEditingTransaction(null) }}
        />
      )}
    </>
  )
}
