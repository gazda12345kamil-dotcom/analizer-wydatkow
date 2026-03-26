"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db, Category } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"

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
import { v4 as uuidv4 } from "uuid"

const formSchema = z.object({
  categoryId: z.string().min(1, "Wybierz kategorię"),
  amount: z.coerce.number().positive("Kwota musi być większa od zera"),
})

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCategoryId?: string
  initialAmount?: number
}

export function BudgetDialog({ open, onOpenChange, initialCategoryId, initialAmount }: BudgetDialogProps) {
  const [isSaving, setIsSaving] = useState(false)
  
  const categories = useLiveQuery(
    () => db.categories.where('type').equals('expense').toArray(),
    []
  )

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      categoryId: initialCategoryId || "",
      amount: initialAmount || 0,
    },
  })

  // Aktualizuj formularz po otwarciu, jeśli są parametry początkowe
  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: initialCategoryId || "",
        amount: initialAmount || 0,
      })
    }
  }, [open, initialCategoryId, initialAmount, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSaving(true)
    try {
      // Check if this category already has a global budget
      const existing = await db.budgets.where('categoryId').equals(values.categoryId).toArray()
      const globalBudget = existing.find(b => b.yearMonth === 'global' || !b.yearMonth) // wsteczna kompatybilnosc z brakiem yearMonth

      if (globalBudget && globalBudget.id) {
        await db.budgets.update(globalBudget.id, {
          amountLimit: values.amount
        })
      } else {
        await db.budgets.add({
          id: uuidv4(),
          categoryId: values.categoryId,
          amountLimit: values.amount,
          yearMonth: 'global'
        })
      }
      
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Błąd podczas zapisywania limitu:", error)
      alert("Wystąpił błąd. Spróbuj ponownie.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] z-[60] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialCategoryId ? "Zarządzaj limitem" : "Dodaj limit wydatków"}</DialogTitle>
          <DialogDescription>
            Ustal miesięczny limit na wybraną kategorię, by monitorować swoje wydatki.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategoria wydatków</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!!initialCategoryId}>
                    <FormControl>
                      <SelectTrigger>
                        <span className="truncate">
                          {categories?.find(c => c.id === field.value)?.name || 'Wybierz kategorię'}
                        </span>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-[70] bg-white shadow-xl rounded-xl">
                      {categories?.map((cat) => (
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zł miesięcznie</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Np. 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end">
              <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Zapisywanie..." : "Zapisz Limit"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
