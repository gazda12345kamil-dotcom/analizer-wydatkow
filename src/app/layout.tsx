import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: "SpendSync - Finanse pod kontrolą",
  description: "Inteligentna aplikacja offline-first do zarządzania budżetem.",
  generator: "Next.js",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-primary/30 pb-[env(safe-area-inset-bottom)]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen w-full flex-col bg-background pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0 sm:pl-64">
            <Sidebar />
            <div className="flex flex-col flex-1 pl-0">
              <main className="flex-1 p-4 md:p-8">
                {children}
              </main>
            </div>
            <BottomNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
