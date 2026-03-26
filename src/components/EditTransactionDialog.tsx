"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { db, Transaction } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { Trash2, Pencil, X, Check } from "lucide-react"

interface EditTransactionDialogProps {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTransactionDialog({ transaction, open, onOpenChange }: EditTransactionDialogProps) {
  const [description, setDescription] = useState(transaction.description)
  const [amount, setAmount] = useState(transaction.amount.toString())
  const categories = useLiveQuery(() => db.categories.toArray())

  const handleSave = async () => {
    await db.transactions.update(transaction.id, {
      description,
      amount: parseFloat(amount) || transaction.amount,
    })
    onOpenChange(false)
  }

  const handleDelete = async () => {
    await db.transactions.delete(transaction.id)
    onOpenChange(false)
  }

  const cat = categories?.find(c => c.id === transaction.categoryId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-[420px] rounded-3xl p-6 bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-800">Edytuj transakcję</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Typ i kategoria - readonly */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat?.color}15`, color: cat?.color }}>
              <span className="text-lg font-extrabold">{cat?.name.charAt(0) || '?'}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">{transaction.type === 'income' ? 'Przychód' : 'Wydatek'}</p>
              <p className="text-sm font-semibold text-slate-700">{cat?.name || 'Inne'}</p>
            </div>
          </div>

          {/* Opis */}
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">Opis</label>
            <Input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 text-slate-800 font-medium rounded-xl"
            />
          </div>

          {/* Kwota */}
          <div>
            <label className="text-sm font-semibold text-slate-600 mb-1.5 block">Kwota (PLN)</label>
            <Input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="h-12 bg-slate-50 border-slate-200 text-slate-800 font-bold text-xl rounded-xl"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handleDelete}
            className="flex-1 h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Usuń
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl transition-all"
          >
            <Check className="w-4 h-4 mr-2" />
            Zapisz
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
