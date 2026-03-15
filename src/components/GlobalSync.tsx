"use client"

import { useEffect } from "react"
import { syncRecurringTransactions } from "@/lib/recurringSync"

/**
 * Niewidzialny komponent, którego jedynym zadaniem jest wywołanie mechanizmu
 * synchronizacji w tle przy wejściu do aplikacji po stronie klienta.
 */
export function GlobalSync() {
  useEffect(() => {
    // Odpal skrypt przeliczania cyklicznych transakcji
    syncRecurringTransactions()
  }, [])

  return null
}
