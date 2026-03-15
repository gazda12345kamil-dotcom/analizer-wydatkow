"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, PieChart, Wallet, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiReportDialog } from "@/components/AiReportDialog";

export function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', icon: Home, label: 'Dashboard' },
    { href: '/add', icon: PlusCircle, label: 'Dodaj Wydatek' },
    { href: '/analytics', icon: PieChart, label: 'Analityka' },
  ];

  return (
    <div className="hidden sm:flex flex-col w-64 border-r border-slate-200/60 bg-white/70 backdrop-blur-3xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed h-full left-0 top-0">
      <div className="flex h-16 items-center flex-shrink-0 px-6 gap-3 pt-4 mb-4">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-[0_8px_16px_-6px_rgba(59,130,246,0.5)]">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 drop-shadow-sm">SpendSync</span>
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
        
        <div className="flex-1" />
        
        <div className="pt-4 mt-6 border-t border-slate-100 space-y-4 pb-4">
          <AiReportDialog trigger={
            <button className="w-full flex items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-500 text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 shadow-[0_8px_20px_-6px_rgba(168,85,247,0.5)] hover:shadow-[0_12px_20px_-6px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 text-left group">
              <span className="flex items-center gap-3">
                 <Sparkles className="h-5 w-5 text-white group-hover:animate-spin-slow" />
                 Magiczny Raport
              </span>
            </button>
          } />
        </div>
      </div>
    </div>
  )
}
