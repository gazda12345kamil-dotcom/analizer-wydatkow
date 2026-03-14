"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { CalendarIcon, Loader2, CheckCircle2, ArrowDownCircle, ArrowUpCircle } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
  amount: z.coerce.number().positive("Kwota musi być większa od zera"),
  description: z.string().min(2, "Opis jest za krótki").max(100, "Opis jest za długi"),
  categoryId: z.string().min(1, "Wybierz kategorię"),
  date: z.date(),
})

export function ExpenseForm() {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const categories = useLiveQuery(() => db.categories.toArray())

  const filteredCategories = categories?.filter(c => c.type === transactionType) || []

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      amount: "" as unknown as number,
      description: "",
      categoryId: "",
      date: new Date(),
    },
  })

  // Reset kategorii przy zmianie typu
  const handleTypeChange = (type: 'expense' | 'income') => {
    setTransactionType(type)
    form.setValue('categoryId', '')
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await db.transactions.add({
        id: uuidv4(),
        amount: values.amount,
        categoryId: values.categoryId,
        date: values.date,
        description: values.description,
        type: transactionType
      })
      setIsSuccess(true)
      form.reset()
      setTimeout(() => setIsSuccess(false), 3000)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center p-8 space-y-4 rounded-2xl border",
        transactionType === 'income' 
          ? "bg-emerald-50 border-emerald-200" 
          : "bg-blue-50 border-blue-200"
      )}>
        <CheckCircle2 className={cn(
          "w-16 h-16 animate-in zoom-in",
          transactionType === 'income' ? "text-emerald-500" : "text-blue-500"
        )} />
        <h3 className="text-xl font-bold text-slate-800">
          {transactionType === 'income' ? 'Przychód dodany!' : 'Wydatek dodany!'}
        </h3>
        <Button 
          variant="outline" 
          onClick={() => setIsSuccess(false)}
          className="rounded-xl font-semibold"
        >
          Dodaj kolejny
        </Button>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Przełącznik typu transakcji */}
        <div className="flex gap-3 p-1.5 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300",
              transactionType === 'expense'
                ? "bg-white text-red-600 shadow-[0_4px_15px_rgba(0,0,0,0.08)] ring-1 ring-red-100"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Wydatek
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all duration-300",
              transactionType === 'income'
                ? "bg-white text-emerald-600 shadow-[0_4px_15px_rgba(0,0,0,0.08)] ring-1 ring-emerald-100"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <ArrowUpCircle className="w-5 h-5" />
            Przychód
          </button>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Kwota (PLN)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00" 
                  {...field} 
                  className={cn(
                    "text-2xl h-14 font-bold bg-slate-50 border-slate-200 focus-visible:ring-2",
                    transactionType === 'income' 
                      ? "text-emerald-700 focus-visible:ring-emerald-500" 
                      : "text-slate-800 focus-visible:ring-blue-500"
                  )} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-700 font-semibold">Tytuł / Opis</FormLabel>
              <FormControl>
                <Input 
                  placeholder={transactionType === 'income' ? "np. Przelew z firmy" : "np. Kawa w Starbucks"} 
                  {...field} 
                  className="h-12 bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-blue-500" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col md:flex-row gap-6">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-slate-700 font-semibold">Kategoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-white border-slate-200 shadow-xl rounded-xl">
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="cursor-pointer focus:bg-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ backgroundColor: cat.color }} />
                          <span className="font-medium text-slate-700">{cat.name}</span>
                        </div>
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
            name="date"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel className="text-slate-700 font-semibold">Data</FormLabel>
                <Popover>
                  <PopoverTrigger>
                    <FormControl>
                      <button
                        className={cn(
                          "flex h-12 w-full items-center justify-between whitespace-nowrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left font-medium text-slate-700 shadow-sm hover:bg-slate-100",
                          !field.value && "text-slate-400"
                        )}
                        type="button"
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: pl })
                        ) : (
                          <span>Wybierz datę</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-xl rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                      className="bg-white"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button 
          type="submit" 
          className={cn(
            "w-full h-14 text-lg font-bold text-white rounded-xl transition-all ease-out hover:-translate-y-1",
            transactionType === 'income'
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-[0_10px_20px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_15px_25px_-10px_rgba(16,185,129,0.7)]"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-[0_10px_20px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_15px_25px_-10px_rgba(59,130,246,0.7)]"
          )} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-6 w-6 animate-spin" />
              Zapisywanie...
            </>
          ) : transactionType === 'income' ? "Zapisz przychód" : "Zapisz wydatek"}
        </Button>
      </form>
    </Form>
  )
}
