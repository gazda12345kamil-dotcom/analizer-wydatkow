"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
      <div className="relative flex items-end justify-around bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-[0_-8px_30px_-10px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center justify-center py-3 flex-1 transition-all duration-300",
            pathname === '/' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <Home className={cn("h-6 w-6 mb-1", pathname === '/' && "fill-blue-100")} strokeWidth={pathname === '/' ? 2.5 : 1.8} />
          <span className="text-[10px] font-bold">Home</span>
        </Link>

        {/* Centralny przycisk Dodaj */}
        <Link
          href="/add"
          className="flex flex-col items-center justify-center flex-1 -mt-7"
        >
          <div className={cn(
            "flex items-center justify-center w-[58px] h-[58px] rounded-full shadow-[0_8px_25px_-5px_rgba(249,115,22,0.6)] transition-all active:scale-90 border-[3px] border-white",
            pathname === '/add'
              ? "bg-gradient-to-tr from-orange-600 to-red-600 scale-110"
              : "bg-gradient-to-tr from-orange-500 to-red-500"
          )}>
            <Plus className="h-7 w-7 text-white" strokeWidth={3} />
          </div>
          <span className={cn("text-[10px] font-bold mt-1", pathname === '/add' ? "text-orange-600" : "text-slate-400")}>Dodaj</span>
        </Link>

        {/* Analiza */}
        <Link
          href="/analytics"
          className={cn(
            "flex flex-col items-center justify-center py-3 flex-1 transition-all duration-300",
            pathname === '/analytics' ? "text-blue-600" : "text-slate-400"
          )}
        >
          <PieChart className={cn("h-6 w-6 mb-1", pathname === '/analytics' && "fill-blue-100")} strokeWidth={pathname === '/analytics' ? 2.5 : 1.8} />
          <span className="text-[10px] font-bold">Analiza</span>
        </Link>
      </div>
    </nav>
  )
}
