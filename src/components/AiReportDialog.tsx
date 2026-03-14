"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Bot, Copy, Check, Loader2 } from "lucide-react"
import { db } from "@/lib/db"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

interface AiReportDialogProps {
  trigger?: React.ReactNode
}

export function AiReportDialog({ trigger }: AiReportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reportText, setReportText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const generateReport = async () => {
    setIsGenerating(true)
    setIsCopied(false)
    try {
      const transactions = await db.transactions.toArray()
      const categories = await db.categories.toArray()

      const categoryMap = new Map(categories.map(c => [c.id, c.name]))
      
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      const thisMonthTransactions = transactions.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })

      const totalSpent = thisMonthTransactions.reduce((acc, curr) => acc + curr.amount, 0)

      const expenseTotals: Record<string, number> = {}
      const incomeTotals: Record<string, number> = {}
      thisMonthTransactions.forEach(t => {
        const catName = categoryMap.get(t.categoryId) || "Inne"
        if (t.type === 'income') {
          incomeTotals[catName] = (incomeTotals[catName] || 0) + t.amount
        } else {
          expenseTotals[catName] = (expenseTotals[catName] || 0) + t.amount
        }
      })

      const sortedExpenses = Object.entries(expenseTotals).sort((a, b) => b[1] - a[1])
      const sortedIncome = Object.entries(incomeTotals).sort((a, b) => b[1] - a[1])

      const totalExpenses = sortedExpenses.reduce((a, [, v]) => a + v, 0)
      const totalIncome = sortedIncome.reduce((a, [, v]) => a + v, 0)
      const balance = totalIncome - totalExpenses
      const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0'

      const prompt = `Jesteś moim osobistym doradcą finansowym. Poniżej przedstawiam pełne zestawienie moich finansów z bieżącego miesiąca (${format(now, 'MMMM yyyy', { locale: pl })}).

=== WYDATKI ===
Łączna kwota wydatków: ${totalExpenses.toFixed(2)} PLN

Wydatki z podziałem na kategorie (od największych):
${sortedExpenses.map(([cat, amount]) => `- ${cat}: ${amount.toFixed(2)} PLN`).join('\n') || '(brak wydatków)'}

=== PRZYCHODY ===
Łączne przychody: ${totalIncome.toFixed(2)} PLN

Przychody z podziałem na źródła:
${sortedIncome.map(([cat, amount]) => `- ${cat}: ${amount.toFixed(2)} PLN`).join('\n') || '(brak przychodów)'}

=== BILANS ===
Bilans miesięczny: ${balance >= 0 ? '+' : ''}${balance.toFixed(2)} PLN
Wskaźnik oszczędności: ${savingsRate}%

=== OSTATNIE TRANSAKCJE ===
${transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 15).map(t => `- ${format(new Date(t.date), 'dd.MM')} [${t.type === 'income' ? 'PRZYCHÓD' : 'WYDATEK'}] ${t.description}: ${t.amount.toFixed(2)} PLN (${categoryMap.get(t.categoryId) || 'Inne'})`).join('\n')}

Przeanalizuj moje finanse kompleksowo. Oceń stosunek wydatków do przychodów, wskaż obszary oszczędności, oceń proporcje kosztów i zaproponuj 3-5 konkretnych, praktycznych rad na przyszły miesiąc. Zwróć uwagę na podejrzanie wysokie wydatki w stosunku do budżetu. Jeśli mam przychody, oceń czy mój wskaźnik oszczędności jest zdrowy. Bądź konstruktywny i pomocny.`

      setReportText(prompt)
    } catch (error) {
      console.error("Błąd podczas generowania raportu:", error)
      setReportText("Wystąpił błąd podczas pobierania danych.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      generateReport()
    } else {
      setTimeout(() => {
        setReportText("")
        setIsCopied(false)
      }, 300)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* @ts-ignore */}
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Bot className="h-4 w-4" />
            Raport AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-hidden flex flex-col bg-white/95 backdrop-blur-xl border border-white/40 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-800">
            <Bot className="h-6 w-6 text-violet-500" />
            Twój gotowy Raport dla AI
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-2 font-medium">
            Skopiuj poniższy tekst i wklej go do ChatGPT, Claude lub innego modelu językowego, aby otrzymać spersonalizowaną analizę finansową w 100% prywatnie.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative mt-6 flex-1 overflow-hidden flex flex-col min-h-[150px]">
          <div className="flex-1 bg-slate-50 rounded-2xl p-5 font-mono text-xs sm:text-sm overflow-y-auto whitespace-pre-wrap text-slate-700 border border-slate-200 shadow-inner">
            {isGenerating ? (
              <div className="flex h-full flex-col items-center justify-center text-violet-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="font-semibold text-slate-600">Przygotowuję zestawienie...</span>
              </div>
            ) : (
              reportText
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button 
            onClick={handleCopy} 
            disabled={isGenerating || !reportText} 
            className="gap-2 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {isCopied ? "Skopiowano!" : "Skopiuj do schowka"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
