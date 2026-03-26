import { db, RecurringTransaction } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"

/**
 * Zwraca datę przesuniętą o zadany interwał
 */
function calculateNextDate(currentDate: Date, interval: 'weekly' | 'monthly' | 'yearly'): Date {
  const next = new Date(currentDate)
  if (interval === 'weekly') {
    next.setDate(next.getDate() + 7)
  } else if (interval === 'monthly') {
    next.setMonth(next.getMonth() + 1)
  } else if (interval === 'yearly') {
    next.setFullYear(next.getFullYear() + 1)
  }
  return next
}

/**
 * Metoda wywoływana przy wczytaniu aplikacji (GlobalSync) 
 * Sprawdza czy należy zaksięgować jakieś transakcje z przeszłości,
 * których termin nadszedł pomiędzy ostatnim wejściem a dziś.
 */
export async function syncRecurringTransactions() {
  try {
    const today = new Date()
    today.setHours(23, 59, 59, 999) // Do końca dzisiejszego dnia włącznie

    // Pobierz wszystkie aktywne subskrypcje, których data nadeszła
    const activeRecurring = await db.recurring_transactions
      .where('isActive')
      .equals(1) // Dexie booleans można czasem traktować jak 1/0 lub true/false - tutaj musimy pamiętać jak zapiszemy
      .toArray()
      
    // Dexie filter na isActive === true (w razie jakby db wolało strict boolean)
    const dueTransactions = activeRecurring.filter(rt => rt.isActive === true && rt.nextDate <= today)

    if (dueTransactions.length === 0) return // Nic do księgowania

    let transactionsToAdd: any[] = []
    let updatesToRecurring: { id: string, changes: Partial<RecurringTransaction> }[] = []

    for (const rt of dueTransactions) {
      let processDate = new Date(rt.nextDate)
      let safetyCounter = 0 // Zabezpieczenie przed nieskończoną pętlą dla nienaturalnie starych dat

      // Dopóki data płatności jest <= dzisiaj (odrabianie wielu pominiętych miesięcy)
      while (processDate <= today && safetyCounter < 50) {
        
        // Zbuduj transakcję do historii
        transactionsToAdd.push({
          id: uuidv4(),
          amount: rt.amount,
          categoryId: rt.categoryId,
          walletId: rt.walletId,
          date: new Date(processDate), // Ważne: kopia daty
          description: `⏳ (Auto) ${rt.name}`,
          type: rt.type,
          tagIds: []
        })

        // Przeskocz do kolejnego cyklu
        processDate = calculateNextDate(processDate, rt.interval)
        safetyCounter++
      }

      // Przygotuj update dla tego wpisu
      updatesToRecurring.push({
        id: rt.id,
        changes: {
          nextDate: processDate,
          lastProcessed: new Date()
        }
      })
    }

    // Wykonaj zbiorczy zapis do bazy w transakcji by nie zablokować wątku
    await db.transaction('rw', db.transactions, db.recurring_transactions, async () => {
      if (transactionsToAdd.length > 0) {
        await db.transactions.bulkAdd(transactionsToAdd)
      }
      
      for (const update of updatesToRecurring) {
        await db.recurring_transactions.update(update.id, update.changes)
      }
    })

    console.log(`Zsynchronizowano pomyślnie ${transactionsToAdd.length} transakcji cyklicznych.`)

  } catch (error) {
    console.error("Błąd podczas synchronizacji powtarzających się transakcji:", error)
  }
}
