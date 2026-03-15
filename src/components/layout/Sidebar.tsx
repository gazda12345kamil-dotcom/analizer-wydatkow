"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, PieChart, Wallet, Sparkles, Menu, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiReportDialog } from "@/components/AiReportDialog";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/add', icon: PlusCircle, label: 'Dodaj Transakcję' },
    { href: '/analytics', icon: PieChart, label: 'Analityka' },
  ];

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center flex-shrink-0 px-6 gap-3 pt-4 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-[0_8px_16px_-6px_rgba(59,130,246,0.5)]">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 drop-shadow-sm border-none">
          SpendSync
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 flex flex-col">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300",
                isActive 
                  ? "bg-blue-50 text-blue-600 shadow-sm ring-1 ring-blue-100/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-blue-600")} strokeWidth={isActive ? 2.5 : 2} />
              {link.label}
            </Link>
          )
        })}
        
        {/* Funkcje Premium */}
        <div className="pt-4 mt-2">
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Funkcje Premium</p>
          <Link
            href="/saving-goals"
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300",
              pathname === '/saving-goals' 
                ? "bg-fuchsia-50 text-fuchsia-600 shadow-sm ring-1 ring-fuchsia-100/50" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <PiggyBank className={cn("h-5 w-5", pathname === '/saving-goals' && "text-fuchsia-600")} strokeWidth={pathname === '/saving-goals' ? 2.5 : 2} />
            Skarbonki
          </Link>
        </div>
        
        <div className="flex-1" />
        
        <div className="pt-4 mt-6 border-t border-slate-100 space-y-4 pb-4">
          <AiReportDialog trigger={
            <div role="button" className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-500 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-[0_8px_20px_-6px_rgba(168,85,247,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 text-left group cursor-pointer">
              <span className="flex items-center gap-3">
                 <Sparkles className="h-5 w-5 text-white group-hover:animate-spin-slow" />
                 Magiczny Raport
              </span>
            </div>
          } />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Pasek boczny dla Desktopu */}
      <div className="hidden sm:flex flex-col w-64 border-r border-slate-200/60 bg-white/70 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed h-[100dvh] left-0 top-0 pb-safe">
        <SidebarContent />
      </div>

      {/* Hamburger menu dla Mobile umieszczony globalnie w rogu */}
      <div className="sm:hidden fixed top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 shadow-sm mt-safe">
        <Sheet>
          <SheetTrigger>
            <div className="flex items-center justify-center p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
              <Menu className="w-6 h-6" />
            </div>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] p-0 border-r-0 sm:w-[320px] pb-safe">
            <SheetTitle className="sr-only">Nawigacja spend sync</SheetTitle>
            <SidebarContent />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 rounded-lg shadow-sm">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">SpendSync</span>
        </div>
        <div className="w-10" /> {/* Balansuje środek nagłówka */}
      </div>
    </>
  )
}
