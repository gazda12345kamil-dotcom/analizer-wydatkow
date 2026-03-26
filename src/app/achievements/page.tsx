"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/lib/db"
import { ACHIEVEMENTS } from "@/lib/achievements"
import { Trophy, Flame, Lock, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { pl } from "date-fns/locale"

export default function AchievementsPage() {
  const stats = useLiveQuery(() => db.user_stats.get('global_stats'))
  const unlocked = useLiveQuery(() => db.user_achievements.toArray())

  const unlockedIds = new Set(unlocked?.map(a => a.id) || [])
  const allAchievements = Object.values(ACHIEVEMENTS)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
          <Trophy className="text-amber-500 w-8 h-8" />
          Twoje Trofea
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Śledź swoje postępy i zdobywaj nagrody za mądre zarządzanie pieniędzmi.
        </p>
      </div>

      {/* Profil - Passa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 border-none text-white shadow-xl shadow-orange-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <Flame className="w-8 h-8 text-orange-100" />
              </div>
              <div>
                <p className="text-orange-100 font-semibold text-sm uppercase tracking-widest">Obecna Passa</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black">{stats?.currentStreak || 0}</span>
                  <span className="text-lg font-medium text-orange-100">dni</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 border-none text-white shadow-xl shadow-emerald-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <Trophy className="w-8 h-8 text-emerald-100" />
              </div>
              <div>
                <p className="text-emerald-100 font-semibold text-sm uppercase tracking-widest">Najlepszy Wynik</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black">{stats?.bestStreak || 0}</span>
                  <span className="text-lg font-medium text-emerald-100">dni z rzędu</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Osiągnięć */}
      <div className="mt-8">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Wszystkie Odznaki</h2>
          <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {unlockedIds.size} / {allAchievements.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allAchievements.map((achievement) => {
            const isUnlocked = unlockedIds.has(achievement.id)
            const unlockData = unlocked?.find(a => a.id === achievement.id)

            return (
              <Card 
                key={achievement.id}
                className={`overflow-hidden transition-all duration-300 ${isUnlocked ? 'bg-white shadow-lg shadow-black/5 ring-1 ring-slate-100 hover:-translate-y-1' : 'bg-slate-50/50 border-dashed border-2 border-slate-200 opacity-70 grayscale-[50%]'}`}
              >
                <CardContent className="p-6 flex flex-col items-center text-center relative">
                  
                  {isUnlocked && (
                    <div className="absolute top-3 right-3 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5 drop-shadow-sm" />
                    </div>
                  )}

                  <div 
                    className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-inner"
                    style={{ 
                      backgroundColor: isUnlocked ? `${achievement.color}20` : '#f1f5f9',
                      color: isUnlocked ? achievement.color : '#94a3b8',
                      boxShadow: isUnlocked ? `0 10px 25px -5px ${achievement.color}40, inset 0 2px 4px rgba(255,255,255,0.6)` : 'none'
                    }}
                  >
                    {isUnlocked ? achievement.icon : <Lock className="w-8 h-8 opacity-40" />}
                  </div>
                  
                  <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-slate-800' : 'text-slate-500'}`}>
                    {achievement.title}
                  </h3>
                  
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                    {achievement.description}
                  </p>

                  {isUnlocked && unlockData ? (
                    <div className="mt-auto px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Zdobyto: {format(unlockData.unlockedAt, "d MMM yyyy", { locale: pl })}
                    </div>
                  ) : (
                    <div className="mt-auto px-3 py-1 bg-slate-200/50 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Zablokowane
                    </div>
                  )}

                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
