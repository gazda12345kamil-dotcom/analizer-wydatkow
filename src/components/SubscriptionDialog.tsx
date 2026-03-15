"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  name: z.string().min(2, "Nazwa musi mieć co najmniej 2 znaki"),
  amount: z.coerce.number().positive("Kwota musi być większa od zera"),
  categoryId: z.string().min(1, "Wybierz kategorię"),
  walletId: z.string().min(1, "Wybierz portfel"),
  type: z.enum(['expense', 'income']),
  interval: z.enum(['weekly', 'monthly', 'yearly']),
  nextDate: z.date({
    message: "Zły format daty",
  }),
})

interface SubscriptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionDialog({ open, onOpenChange }: SubscriptionDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isIncome, setIsIncome] = useState(false)
  
  const categories = useLiveQuery(() => db.categories.toArray())
  const wallets = useLiveQuery(() => db.wallets.toArray())

  const filteredCategories = categories?.filter(c => c.type === (isIncome ? 'income' : 'expense'))

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      amount: 0,
      categoryId: "",
      walletId: "wallet_main",
      type: "expense",
      interval: "monthly",
      nextDate: new Date(),
    },
  })

  // Formatujemy datę roboczo do inputa type="date"
  const formNextDate = form.watch("nextDate")
  const dateString = formNextDate ? formNextDate.toISOString().split('T')[0] : ""

  // Aktualizuj pole categoryId jeśli typ wydatku ulega zamianie by uniknąć zapisu przychodu pod kategorią wydatku
  useEffect(() => {
    form.setValue('type', isIncome ? 'income' : 'expense')
    form.setValue('categoryId', "") // zresetuj kategorię przy zmianie typu
  }, [isIncome, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    try {
       // Dodanie powtarzalnego wpisu
       await db.recurring_transactions.add({
         id: uuidv4(),
         name: values.name,
         amount: values.amount,
         categoryId: values.categoryId,
         walletId: values.walletId,
         type: values.type,
         interval: values.interval,
         nextDate: values.nextDate,
         isActive: true, // Domyslnie nowa subskrypcja jest wlaczona
       })
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Błąd podczas zapisywania subskrypcji:", error)
      alert("Wystąpił błąd. Spróbuj ponownie.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Zautomatyzuj płatność</DialogTitle>
          <DialogDescription>
            Dodaj subskrypcję, rachunek lub wypłatę, a aplikacja będzie je sama uzupełniać.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl mb-4">
              <span className="text-sm font-medium text-slate-700">To jest stały przychód (np. Wypłata)</span>
              <Switch checked={isIncome} onCheckedChange={setIsIncome} />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nazwa ułatwiająca identyfikację</FormLabel>
                  <FormControl>
                    <Input placeholder="np. Netflix, Czynsz, Wypłata" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kwota operacji</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="walletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konto docelowe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {wallets?.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

             <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Powtarzaj</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Jak często..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Co Tydzień</SelectItem>
                          <SelectItem value="monthly">Co Miesiąc</SelectItem>
                          <SelectItem value="yearly">Co Rok</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nextDate"
                  render={() => (
                    <FormItem>
                      <FormLabel>Najbliższa data</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          value={dateString}
                          onChange={(e) => {
                            if(e.target.value) form.setValue('nextDate', new Date(e.target.value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700">
                {isSaving ? "Zapisywanie..." : "Utwórz plan cykliczny"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
