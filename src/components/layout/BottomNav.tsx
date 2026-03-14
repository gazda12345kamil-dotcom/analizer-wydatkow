"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, PieChart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiReportDialog } from "@/components/AiReportDialog";

export function BottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/add', icon: PlusCircle, label: 'Skok' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-[calc(4.5rem+env(safe-area-inset-bottom))] items-center justify-around bg-white/90 backdrop-blur-2xl border-t border-slate-200/50 pb-[env(safe-area-inset-bottom)] sm:hidden shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 transition-all duration-300",
              isActive && "text-blue-600 scale-105"
            )}
          >
            <Icon className={cn("h-6 w-6 transition-all duration-300", isActive && "fill-blue-100 text-blue-600")} strokeWidth={isActive ? 2.5 : 2} />
            <span className={cn("text-[10px] font-bold transition-all", isActive ? "opacity-100" : "opacity-70")}>{link.label}</span>
          </Link>
        )
      })}
      
      {/* Central Add Button */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
        <Link href="/add" className="flex items-center justify-center bg-gradient-to-tr from-orange-500 to-red-500 text-white rounded-full w-[60px] h-[60px] shadow-[0_10px_25px_-5px_rgba(249,115,22,0.6)] active:scale-95 transition-transform hover:scale-105 border-4 border-white">
          <PlusCircle className="h-8 w-8" strokeWidth={2.5} />
        </Link>
      </div>
      
      <Link 
        href="/analytics" 
        className={cn(
          "flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 transition-all duration-300",
          pathname === '/analytics' && "text-blue-600 scale-105"
        )}
      >
        <PieChart className={cn("h-6 w-6 transition-all duration-300", pathname === '/analytics' && "fill-blue-100 text-blue-600")} strokeWidth={pathname === '/analytics' ? 2.5 : 2} />
        <span className={cn("text-[10px] font-bold transition-all", pathname === '/analytics' ? "opacity-100" : "opacity-70")}>Analiza</span>
      </Link>

      <AiReportDialog trigger={
        <button className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-violet-500 transition-all duration-300 active:scale-95 group">
          <Sparkles className="h-6 w-6 group-hover:fill-violet-100" strokeWidth={2} />
          <span className="text-[10px] font-bold opacity-70 group-hover:opacity-100">Raport</span>
        </button>
      } />
    </div>
  )
}
