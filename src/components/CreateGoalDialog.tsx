"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { pl } from "date-fns/locale"
import { v4 as uuidv4 } from "uuid"
import { CalendarIcon, Loader2, Target, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const ICONS = ['🎯', '🚗', '🏖️', '💻', '🏠', '💍', '🎮', '📱', '🎓', '🏥']
const COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e']

const formSchema = z.object({
  name: z.string().min(2, "Nazwa jest za krótka").max(50, "Nazwa jest za długa"),
  targetAmount: z.coerce.number().positive("Kwota musi być większa od zera"),
  color: z.string().min(1),
  icon: z.string().min(1),
  deadline: z.date().optional(),
})

interface CreateGoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGoalDialog({ open, onOpenChange }: CreateGoalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      targetAmount: 0,
      color: COLORS[7],
      icon: ICONS[0],
      deadline: undefined,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      await db.saving_goals.add({
        id: `goal_${uuidv4()}`,
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: 0,
        color: values.color,
        icon: values.icon,
        deadline: values.deadline,
      })
      setIsSuccess(true)
      setTimeout(() => {
        setIsSuccess(false)
        onOpenChange(false)
        form.reset()
      }, 2000)
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
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] rounded-3xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        {isSuccess ? (
           <div className="flex flex-col items-center justify-center p-12 text-center h-[400px]">
             <CheckCircle2 className="w-20 h-20 text-emerald-500 animate-in zoom-in slide-in-from-bottom-4 duration-500 mb-4" />
             <h3 className="text-2xl font-black text-slate-800 tracking-tight">Gotowe!</h3>
             <p className="text-slate-500 font-medium mt-2">Skarbonka została pomyślnie otworzona. Zacznij oszczędzać.</p>
           </div>
        ) : (
          <>
            <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/50">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-fuchsia-500" /> 
                Załóż nową Skarbonkę
              </DialogTitle>
              <DialogDescription className="font-medium text-slate-500">
                Wybierz cel i zdefiniuj kwotę, do której będziesz odkładać środki.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-5">
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold">Na co zbierasz?</FormLabel>
                      <FormControl>
                        <Input placeholder="np. Wyjazd w góry" {...field} className="h-12 bg-slate-50 border-slate-200 text-slate-800 focus-visible:ring-fuchsia-500 font-medium rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-slate-700 font-semibold">Kwota (PLN)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2000" {...field} className="h-12 bg-slate-50 border-slate-200 text-slate-800 font-bold focus-visible:ring-fuchsia-500 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem className="flex-[1.2]">
                        <FormLabel className="text-slate-700 font-semibold">Termin (opcjonalnie)</FormLabel>
                        <Popover>
                          <PopoverTrigger>
                            <FormControl>
                              <div className={cn("flex h-12 w-full items-center justify-between whitespace-nowrap rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left font-medium text-slate-700 shadow-sm hover:bg-slate-100 cursor-pointer transition-colors", !field.value && "text-slate-400")}>
                                {field.value ? format(field.value, "d MMM yyyy", { locale: pl }) : <span>Brak limitu czasu</span>}
                                <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                              </div>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden" align="end">
                            <Calendar
                              mode="single" selected={field.value} onSelect={field.onChange}
                              disabled={(date) => date < new Date() }
                              initialFocus className="bg-white"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel className="text-slate-700 font-semibold mb-2 block">Wybierz Ikonę</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => form.setValue('icon', icon)}
                        className={cn(
                          "w-10 h-10 text-xl flex items-center justify-center rounded-xl transition-all duration-200",
                          form.watch('icon') === icon 
                            ? "bg-fuchsia-100 ring-2 ring-fuchsia-500 scale-110 shadow-sm" 
                            : "bg-slate-50 hover:bg-slate-100 opacity-60 hover:opacity-100"
                        )}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <FormLabel className="text-slate-700 font-semibold mb-2 block">Kolor Główny</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => form.setValue('color', color)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center",
                          form.watch('color') === color 
                            ? "ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-md" 
                            : "hover:scale-110 opacity-80 hover:opacity-100"
                        )}
                        style={{ backgroundColor: color }}
                      >
                         {form.watch('color') === color && <div className="w-3 h-3 bg-white rounded-full opacity-60" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-xl text-lg font-bold text-white bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 shadow-lg shadow-fuchsia-500/25 transition-all hover:-translate-y-0.5"
                  >
                    {isSubmitting ? <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Zapisywanie...</> : "Stwórz Cel"}
                  </Button>
                </div>

              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
