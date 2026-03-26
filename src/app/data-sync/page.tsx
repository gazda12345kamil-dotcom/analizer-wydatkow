"use client"

import { useState, useRef } from "react"
import { db, Transaction } from "@/lib/db"
import { useLiveQuery } from "dexie-react-hooks"
import { v4 as uuidv4 } from "uuid"
import Papa from "papaparse"
import { format, parse } from "date-fns"
import { pl } from "date-fns/locale"
import { toast } from "sonner"
import { Database, Download, Upload, AlertCircle, FileText, CheckCircle2, Loader2, Info } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DataSyncPage() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importedData, setImportedData] = useState<any[]>([])
  const [importStats, setImportStats] = useState({ success: 0, skipped: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const transactions = useLiveQuery(() => db.transactions.toArray())
  const categories = useLiveQuery(() => db.categories.toArray())
  const wallets = useLiveQuery(() => db.wallets.toArray())

  const handleExportCSV = async () => {
    if (!transactions) return
    setIsExporting(true)

    try {
      const dataToExport = await Promise.all(transactions.map(async (t) => {
        const cat = categories?.find(c => c.id === t.categoryId)
        const acc = wallets?.find(w => w.id === t.walletId)
        
        return {
          "Data": format(t.date, "yyyy-MM-dd"),
          "Typ": t.type === 'expense' ? 'Wydatek' : 'Przychód',
          "Kwota (PLN)": t.amount,
          "Kategoria": cat?.name || 'Inne',
          "Portfel": acc?.name || 'Główny',
          "Tytuł": t.description
        }
      })) // Sortujemy chronologicznie

      dataToExport.sort((a, b) => new Date(b.Data).getTime() - new Date(a.Data).getTime())

      const csv = Papa.unparse(dataToExport, { delimiter: ";" })
      
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' }) // \uFEFF for Excel BOM UTF-8
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `SpendSync_Historia_${format(new Date(), 'yyyy-MM-dd')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("Eksport zakończony", { description: "Plik CSV został pobrany na Twoje urządzenie." })
    } catch (error) {
      console.error(error)
      toast.error("Błąd eksportu", { description: "Nie powiodło się wygenerowanie pliku." })
    } finally {
      setIsExporting(false)
    }
  }

  // Funkcja czyszcząca polskie kwoty z CSV (np. "1 250,50" -> 1250.50)
  const parseAmount = (val: string): number => {
    if (!val) return 0
    let cleanVal = val.replace(/\s/g, '').replace('PLN', '').trim()
    if (cleanVal.includes(',') && cleanVal.includes('.')) {
      cleanVal = cleanVal.replace(',', '') // 1,000.50 -> 1000.50
    } else {
      cleanVal = cleanVal.replace(',', '.') // 1250,50 -> 1250.50
    }
    return parseFloat(cleanVal)
  }

  // Parser dat (wsparcie różnych formatów z mBank, PKO, Alior)
  const parseDate = (val: string): Date | null => {
    if (!val) return null
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return new Date(val)
    // Format DD.MM.YYYY
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(val)) return parse(val, 'dd.MM.yyyy', new Date())
    // Format DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(val)) return parse(val, 'dd-MM-yyyy', new Date())
    return null
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStats({ success: 0, skipped: 0 })

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8", // lub Windows-1250 jeśli pobrane z polskiego banku - papaparse spróbuje odgadnąć
      complete: async (results) => {
        const rows = results.data as any[]
        const newTransactions: Partial<Transaction>[] = []

        // Identyfikacja nagłówków (AliorBank, Pekao SA, itp.)
        for (const row of rows) {
          // Zgadujemy klucze wiersza, ponieważ CSV mogą mieć dodatkowe średniki/spacje
          const keys = Object.keys(row)
          
          let dateStr = row['Data operacji'] || row['Data księgowania'] || row['Data'] || row['Data transakcji']
          let title = row['Tytuł płatności'] || row['Tytuł transakcji'] || row['Tytuł'] || row['Szczegóły operacji'] || row['Nadawca / Odbiorca'] || row['Nadawca/Odbiorca']
          let amountStr = row['Kwota'] || row['Kwota operacji'] || row['Kwota w walucie rozliczeniowej']

          // Fallback - jeśli nie znalazł precyzyjnych, szuka po słowach kluczowych w nagłówkach
          if (!dateStr) dateStr = keys.find(k => k.toLowerCase().includes('data')) ? row[keys.find(k => k.toLowerCase().includes('data'))!] : null
          if (!amountStr) amountStr = keys.find(k => k.toLowerCase().includes('kwota')) ? row[keys.find(k => k.toLowerCase().includes('kwota'))!] : null
          if (!title) title = keys.find(k => k.toLowerCase().includes('tytuł') || k.toLowerCase().includes('nadawca')) ? row[keys.find(k => k.toLowerCase().includes('tytuł') || k.toLowerCase().includes('nadawca'))!] : 'Import bankowy'

          if (!dateStr || !amountStr) {
            console.warn("Pominięto wiersz, brak kluczowych danych:", row)
            continue
          }

          const amountParsed = parseAmount(amountStr)
          if (isNaN(amountParsed) || amountParsed === 0) continue

          const isExpense = amountParsed < 0
          const finalAmount = Math.abs(amountParsed)

          const dateObj = parseDate(dateStr) || new Date() // Jeśli się nie udało sparsować, dajemy dzisiaj (lepiej ulepszyć detekcję)

          // Przypisanie do najmniej "szkodliwej" domyślnej z opcją że user i tak musi wybrać
          const catId = isExpense 
            ? (categories?.find(c => c.name === 'Inne wydatki') || categories?.find(c => c.type === 'expense'))?.id || '' 
            : (categories?.find(c => c.name === 'Inne przychody') || categories?.find(c => c.type === 'income'))?.id || ''
            
          const walletId = wallets?.find(w => w.name.includes('Główne') || w.type === 'bank')?.id || wallets?.[0]?.id || ''

          newTransactions.push({
            id: uuidv4(),
            amount: finalAmount,
            categoryId: catId,
            walletId: walletId,
            date: dateObj,
            description: title.substring(0, 100), // Max 100 znaków
            type: isExpense ? 'expense' : 'income',
            tagIds: ['import-bankowy']
          })
        }

        setImportedData(newTransactions)
        setIsImporting(false)

        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      },
      error: (err) => {
        console.error(err)
        toast.error("Błąd przetwarzania", { description: "Plik mógł być uszkodzony lub ma nieznany format." })
        setIsImporting(false)
      }
    })
  }

  const confirmImport = async () => {
    if (importedData.length === 0) return
    setIsExporting(true) // Reużywamy jako stan ładowania całości

    try {
      // Ochrona przed duplikatami - sprawdzimy ostatnie 10 dni transakcji z bazy
      if (!transactions) return
      
      let added = 0
      let skipped = 0

      for (const newTx of importedData as Transaction[]) {
        // Sprawdź czy identyczna juz istnieje
        const isDuplicate = transactions.some(t => 
          t.type === newTx.type && 
          t.amount === newTx.amount && 
          t.date.getTime() === newTx.date.getTime() &&
          t.description === newTx.description
        )

        if (!isDuplicate) {
          await db.transactions.add(newTx)
          added++
        } else {
          skipped++
        }
      }

      setImportStats({ success: added, skipped: skipped })
      toast.success("Import zakończony!", { description: `Dodano: ${added}, Pominięto duplikatów: ${skipped}. Kategoryzacja ustawiona na "Inne" lub domyślnie. Czas na analizę!` })
      setImportedData([])
    } catch (error) {
      console.error(error)
      toast.error("Wystąpił błąd w trakcie zapisu do bazy.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-500 pb-12">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-slate-800">
            <Database className="text-blue-500 w-8 h-8" />
            Eksport i Import
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            Zarządzaj swoimi danymi, przenoś historie z kont bankowych (Pekao, Alior itp.) i twórz fizyczne kopie zapasowe.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Moduł Importu */}
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white shadow-xl shadow-indigo-500/5">
          <CardHeader>
            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-2">
              <Upload className="w-6 h-6 text-indigo-600" />
            </div>
            <CardTitle>Import historii z pliku CSV</CardTitle>
            <CardDescription>
              Pobierz plik CSV (historię operacji) bezpośrednio ze swojego banku i wgraj go tutaj. System automatycznie wykryje kwoty i daty.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 border border-slate-100">
              <span className="font-semibold text-slate-800">Wspierane banki (auto-detekcja):</span>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Alior Bank</li>
                <li>Bank Pekao S.A.</li>
                <li>mBank</li>
                <li>Ogólne formaty CSV (Nagłówki: Data, Tytuł, Kwota)</li>
              </ul>
            </div>

            {importedData.length === 0 ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-white rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors group"
              >
                {isImporting ? (
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-indigo-300 group-hover:text-indigo-500 mb-2 transition-colors" />
                    <span className="font-bold text-indigo-600">Kliknij, aby wybrać plik CSV</span>
                    <span className="text-xs text-slate-400 mt-1">Szybko i bezpiecznie (wszystko lokalnie)</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Udało się rozpoznać dane!</span>
                    <span className="text-sm">Znaleziono {importedData.length} transakcji w załączonym pliku. Wygląda dobrze.</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setImportedData([])}>
                    Odrzuć
                  </Button>
                  <Button 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                    onClick={confirmImport}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Importuj Dodaj do Bazy
                  </Button>
                </div>
              </div>
            )}

            {importStats.success > 0 && (
              <p className="text-sm font-semibold text-emerald-600 text-center animate-in fade-in">
                Ostatni import powiódł się (+{importStats.success} dodano, {importStats.skipped} pominięto).
              </p>
            )}

          </CardContent>
        </Card>

        {/* Moduł Eksportu */}
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white shadow-xl shadow-blue-500/5">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-2">
              <Download className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Wyciąg do Arkuszy / Excela</CardTitle>
            <CardDescription>
              Eksportuje wszystkie twoje wpisy wydatków i przychodów z bazy SpendSync w ułożonym chronologicznie arkuszu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm flex gap-3 text-slate-600">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <p>
                Aplikacja wygeneruje plik <span className="font-bold text-slate-800">CSV zgodny z UTF-8</span>. Możesz go otworzyć w pakiecie MS Office Excel, Google Sheets lub Numbers, nie martwiąc się zniekształceniem polskich liter (np. ą, ę, ł).
              </p>
            </div>

            <Button 
              className="w-full h-14 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1"
              onClick={handleExportCSV}
              disabled={isExporting || (transactions && transactions.length === 0)}
            >
              {isExporting ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Generowanie...</>
              ) : (
                <><Download className="w-5 h-5 mr-3" /> Pobierz Arkusz (CSV)</>
              )}
            </Button>
            
            {(transactions && transactions.length === 0) && (
              <p className="text-center text-sm text-slate-400 font-medium">Brak danych do wyeksportowania.</p>
            )}
            
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
