"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db, SavingGoal } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import { Loader2, Coins, Landmark, Wallet } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLiveQuery } from "dexie-react-hooks"

const formSchema = z.object({
  amount: z.coerce.number().positive("Kwota musi być większa od zera"),
  walletId: z.string().min(1, "Wybierz portfel źródłowy"),
})

interface TopUpGoalDialogProps {
  goal: SavingGoal
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TopUpGoalDialog({ goal, open, onOpenChange }: TopUpGoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const wallets = useLiveQuery(() => db.wallets.toArray())

  const remainingAmount = goal.targetAmount - goal.currentAmount

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: remainingAmount > 0 ? (remainingAmount < 100 ? remainingAmount : 100) : 0, 
      walletId: "wallet_main", 
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      // 1. Opcjonalnie: Zaktualizuj saldo portfela (ale my operujemy transakcjami de facto)
      // Chcąc śledzić hajs w aplikacji, 'dopłata' do celu to z punktu widzenia budżetu "Wydatek" (pieniądze leżą w skarbonce) lub "Transfer"
      // w celu prostoty (skoro to aplikacja domowa) utwórzmy transakcję typu Expense, pomniejszając saldo portfela, 
      // by użytkownik nie uważał, że dalej ma te fizyczne środki na Karcie na jedzenie.
      
      const category = await db.categories.where('name').equals('Inne wydatki').first()

      await db.transactions.add({
        id: `tx_${uuidv4()}`,
        amount: values.amount,
        categoryId: category?.id || 'cat_other_exp',
        walletId: values.walletId, // z jakiego konta zdejmujemy środki by przelać na cel
        date: new Date(),
        description: `Dopłata do celu: ${goal.name}`,
        type: 'expense',
        tagIds: ['cel_oszczędnościowy'],
        goalId: goal.id // <--- Nowe powiązanie (aby można było kiedyś to cofnąć/zrefundować)
      })

      // 2. Podnieś kapitał samego Celu (Skarbonki)
      await db.saving_goals.update(goal.id, {
        currentAmount: goal.currentAmount + values.amount
      })

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (newOpenState: boolean) => {
    if (!newOpenState) form.reset()
    onOpenChange(newOpenState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] rounded-3xl">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-10" style={{ backgroundColor: goal.color }} />
        
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-500" /> 
            Dopłać do Skarbonki
          </DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Środki zostaną przelane na cel: <strong className="text-slate-800">{goal.name}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold flex justify-between">
                    <span>Kwota (PLN)</span>
                    <span className="text-slate-400 text-xs font-medium">Brakuje jeszcze {remainingAmount.toLocaleString('pl-PL')} PLN</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} className="h-14 bg-slate-50 border-slate-200 text-slate-800 text-xl font-black focus-visible:ring-emerald-500 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-semibold">Z jakiego portfela?</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'wallet_main'}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-slate-50 border-slate-200 text-slate-800 font-semibold rounded-xl">
                        <Wallet className="w-4 h-4 mr-2 text-slate-400" />
                        <SelectValue placeholder="Wybierz portfel" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                      {wallets?.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id} className="cursor-pointer focus:bg-slate-100 font-medium">
                          {wallet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full h-14 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5"
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Procesowanie...</> : "Zasil Skarbonkę"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
