import { ExpenseForm } from "@/components/ExpenseForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AddExpensePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800">Nowa Transakcja</h1>
        <p className="text-slate-500 mt-2 font-medium">
          Dodaj wydatek lub przychód do swojej historii finansowej.
        </p>
      </div>

      <Card className="border-primary/10 bg-card/50 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <CardTitle>Szczegóły transakcji</CardTitle>
          <CardDescription>Wybierz kwotę, rodzaj i datę by zapisać wpis w trybie offline.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExpenseForm />
        </CardContent>
      </Card>
    </div>
  )
}
