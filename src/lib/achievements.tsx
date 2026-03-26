import { db } from "./db"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"

export interface AchievementConfig {
  id: string
  title: string
  description: string
  icon: string
  color: string
}

export const ACHIEVEMENTS: Record<string, AchievementConfig> = {
  first_step: {
    id: "first_step",
    title: "Pierwszy Krok",
    description: "Zapisz swoją pierwszą transakcję w aplikacji.",
    icon: "🎯",
    color: "#3b82f6" // blue
  },
  streak_3: {
    id: "streak_3",
    title: "Dobry Start",
    description: "Notuj wydatki przez 3 dni z rzędu.",
    icon: "🔥",
    color: "#f97316" // orange
  },
  streak_7: {
    id: "streak_7",
    title: "Tydzień pod kontrolą",
    description: "Notuj wydatki przez 7 dni z rzędu.",
    icon: "📅",
    color: "#eab308" // yellow
  },
  saver_weekend: {
    id: "saver_weekend",
    title: "Oszczędny Weekend",
    description: "Przeżyj sobotę i niedzielę bez sekcji 'wydatki'.",
    icon: "🏖️",
    color: "#22c55e" // green
  },
  rich_month: {
    id: "rich_month",
    title: "Miesiąc na Plusie",
    description: "Suma przychodów większa niż suma wydatków na koniec miesiąca.",
    icon: "📈",
    color: "#14b8a6" // teal
  },
  goal_reached: {
    id: "goal_reached",
    title: "Łowca Skarbów",
    description: "Zakończ sukcesem dowolny cel w Skarbonce.",
    icon: "🏆",
    color: "#d946ef" // fuchsia
  },
  budget_master: {
    id: "budget_master",
    title: "Mistrz Budżetu",
    description: "Ustaw i nie przekrocz limitu w co najmniej jednej kategorii.",
    icon: "🔒",
    color: "#6366f1" // indigo
  },
  ai_user: {
    id: "ai_user",
    title: "Technologiczny Geek",
    description: "Wygeneruj Magiczny Raport AI co najmniej raz.",
    icon: "✨",
    color: "#8b5cf6" // violet
  }
}

// Funkcja pomocnicza do nagradzania użytkownika Toasterem
async function unlockAchievement(achievementId: string) {
  try {
    const existing = await db.user_achievements.get(achievementId)
    if (existing) return false // Już odblokowane

    await db.user_achievements.add({
      id: achievementId,
      unlockedAt: new Date()
    })

    const config = ACHIEVEMENTS[achievementId]
    if (config) {
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: `${config.color}20`, color: config.color }}>
            {config.icon}
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-slate-800">Odblokowano: {config.title}</span>
            <span className="text-xs text-slate-500">{config.description}</span>
          </div>
        </div>
      )
    }

    return true
  } catch (error) {
    console.error("Błąd podczas odblokowywania odznaki:", error)
    return false
  }
}

// Funkcje sprawdzające określone wydarzenia (tzw. "Triggery")

/**
 * Wywoływana np. po dodaniu transakcji
 */
export async function checkTransactionAchievements(transactionDate: string | Date = new Date()) {
  const tDate = new Date(transactionDate)
  const todayStr = format(tDate, 'yyyy-MM-dd')
  
  // 1. Sprawdzanie i aktualizacja Streaka (Passy)
  let stats = await db.user_stats.get('global_stats')
  if (!stats) {
    stats = { id: 'global_stats', currentStreak: 1, bestStreak: 1, lastActiveDate: todayStr }
    await db.user_stats.add(stats)
  } else {
    if (stats.lastActiveDate) {
      const diff = differenceInDays(tDate, new Date(stats.lastActiveDate))
      
      if (diff === 1) {
        // Kontynuuje dzień po dniu
        stats.currentStreak += 1
        stats.bestStreak = Math.max(stats.bestStreak, stats.currentStreak)
        stats.lastActiveDate = todayStr
        await db.user_stats.put(stats)
      } else if (diff > 1) {
        // Złamał passę, zaczynamy od 1, MOGĄ BYĆ WSTECZNE TRANSAKCJE WIĘC TZN ŻE MUSIMY ZARZĄDZAĆ OSTROŻNIE
        // Jeśli loguje wydatki na wczoraj, a dzisiaj już wpisał to diff = -1
        // W uproszczeniu: jeśli data jest późniejsza > 1 dzień, to zerujemy i liczymy od nowa
        stats.currentStreak = 1
        stats.lastActiveDate = todayStr
        await db.user_stats.put(stats)
      }
    } else {
      stats.lastActiveDate = todayStr
      await db.user_stats.put(stats)
    }
  }

  // Odznaka: Pierwszy krok
  const totalTrans = await db.transactions.count()
  if (totalTrans >= 1) {
    await unlockAchievement('first_step')
  }

  // Odznaka: Streak 3 i 7
  if (stats.currentStreak >= 3) await unlockAchievement('streak_3')
  if (stats.currentStreak >= 7) await unlockAchievement('streak_7')
}

/**
 * Wywoływana np. kiedy cel skarbonki dochodzi do 100%
 */
export async function checkGoalRequirements(current: number, target: number) {
  if (current >= target && target > 0) {
    await unlockAchievement('goal_reached')
  }
}

/**
 * Wywoływana np. po wygenerowaniu pierwszej porady AI
 */
export async function checkAIAchievement() {
  await unlockAchievement('ai_user')
}
