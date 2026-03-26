"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db, SavingGoal } from "@/lib/db"
import { PiggyBank, Plus, Target, AlertCircle, Coins, Pencil, Trash2, MoreVertical } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CreateGoalDialog } from "@/components/CreateGoalDialog"
import { TopUpGoalDialog } from "@/components/TopUpGoalDialog"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

export default function SavingGoalsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [goalToTopUp, setGoalToTopUp] = useState<SavingGoal | null>(null)
  const [goalToEdit, setGoalToEdit] = useState<SavingGoal | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  const goals = useLiveQuery(() => db.saving_goals.toArray())

  if (!goals) {
    return <div className="h-[50vh] w-full flex items-center justify-center animate-pulse"><PiggyBank className="w-8 h-8 opacity-40 text-fuchsia-500" /></div>
  }

  const totalSaved = goals.reduce((acc, goal) => acc + goal.currentAmount, 0)
  const totalTarget = goals.reduce((acc, goal) => acc + goal.targetAmount, 0)
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const handleDelete = async (goalId: string) => {
    if (confirm("Czy na pewno chcesz usunąć tę skarbonkę? Tej operacji nie można cofnąć.")) {
      await db.saving_goals.delete(goalId)
    }
  }

  const handleEditOpen = (goal: SavingGoal) => {
    setGoalToEdit(goal)
    setIsCreateOpen(true)
    setMenuOpenId(null)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
            <PiggyBank className="text-fuchsia-500 w-8 h-8" />
            Skarbonki
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Realizuj swoje marzenia szybciej. Zbieraj środki na określone cele i obserwuj postęp.
          </p>
        </div>
        
        <Button 
          onClick={() => { setGoalToEdit(null); setIsCreateOpen(true) }}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold shadow-lg shadow-fuchsia-500/30 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nowy Cel
        </Button>
      </div>

      {/* Ogólne Statystyki */}
      {goals.length > 0 && (
        <Card className="bg-gradient-to-br from-fuchsia-600 via-purple-600 to-indigo-600 border-none text-white shadow-xl shadow-fuchsia-900/10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700 group-hover:bg-white/20" />
          <CardHeader>
            <CardDescription className="text-fuchsia-100 font-semibold tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4" /> Globalny Postęp Oszczędności
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold tracking-tight mt-1">
              {totalSaved.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}
              <span className="text-lg font-medium text-fuchsia-200 ml-2">/ {totalTarget.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mt-2">
              <div className="flex justify-between text-sm font-bold text-fuchsia-100">
                <span>Zrealizowano {overallProgress.toFixed(1)}%</span>
                <span>Pozostało {(totalTarget - totalSaved).toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</span>
              </div>
              <Progress value={overallProgress} className="h-3 bg-white/20" indicatorClassName="bg-white" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista Skarbonek */}
      {goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
          <div className="w-20 h-20 bg-fuchsia-100 text-fuchsia-500 rounded-full flex items-center justify-center mb-6">
            <PiggyBank className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pusto w skarbonkach!</h2>
          <p className="text-slate-500 max-w-sm mb-6 font-medium">
            Dodaj swój pierwszy cel oszczędnościowy, np. wymarzone wakacje lub nowy komputer.
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            variant="outline" 
            className="border-fuchsia-200 text-fuchsia-600 hover:bg-fuchsia-50 font-bold rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Rozpocznij oszczędzanie
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = progress >= 100;
            const isMenuOpen = menuOpenId === goal.id;

            return (
              <Card 
                key={goal.id} 
                className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-3xl group relative ${isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white'}`}
              >
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                        style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                      >
                         <span className="text-xl font-bold">{goal.icon || '🎯'}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-slate-800">{goal.name}</CardTitle>
                        {goal.deadline && (
                          <CardDescription className="text-xs font-semibold flex items-center gap-1 mt-0.5 text-slate-500">
                            <AlertCircle className="w-3 h-3" /> Termin: {format(goal.deadline, "d MMM yyyy", { locale: pl })}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    
                    {/* Menu z trzema kropkami */}
                    <div className="relative">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-slate-400 hover:text-slate-600"
                        onClick={() => setMenuOpenId(isMenuOpen ? null : goal.id)}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl ring-1 ring-slate-100 py-1 z-20 min-w-[140px] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                            <button 
                              onClick={() => handleEditOpen(goal)}
                              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Pencil className="w-4 h-4 text-slate-400" />
                              Edytuj cel
                            </button>
                            <button 
                              onClick={() => { handleDelete(goal.id); setMenuOpenId(null) }}
                              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Usuń cel
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                          {goal.currentAmount.toLocaleString('pl-PL', { minimumFractionDigits: 0 })} <span className="text-sm font-semibold text-slate-400">PLN</span>
                        </span>
                        <span className="text-sm font-bold text-slate-400">
                          / {goal.targetAmount.toLocaleString('pl-PL', { minimumFractionDigits: 0 })} PLN
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className="h-2.5 bg-slate-100" 
                        indicatorClassName={isCompleted ? "bg-emerald-500" : undefined}
                        style={!isCompleted ? { '--progress-background': goal.color } as any : {}}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 pt-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${isCompleted ? 'text-emerald-700 bg-emerald-100' : 'text-slate-500 bg-slate-100'}`}>
                        {progress.toFixed(0)}%
                      </span>
                      
                      {!isCompleted ? (
                        <Button 
                          onClick={() => setGoalToTopUp(goal)}
                          size="sm" 
                          variant="secondary"
                          className="rounded-xl font-bold hover:bg-slate-200"
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Dopłać
                        </Button>
                      ) : (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                          Cel osiągnięty! 🎉
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogi - Tworzenie/Edycja i Zasilanie */}
      <CreateGoalDialog 
        open={isCreateOpen} 
        onOpenChange={(open) => { setIsCreateOpen(open); if (!open) setTimeout(() => setGoalToEdit(null), 200) }}
        editGoal={goalToEdit}
      />
      {goalToTopUp && (
        <TopUpGoalDialog 
          goal={goalToTopUp} 
          open={!!goalToTopUp} 
          onOpenChange={(open) => { if (!open) setGoalToTopUp(null) }} 
        />
      )}

    </div>
  )
}
