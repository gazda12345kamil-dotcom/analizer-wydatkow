import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#3b82f6",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "SpendSync - Finanse pod kontrolą",
  description: "Zaawansowany analizator wydatków i przychodów. Offline-first PWA.",
  generator: "Next.js",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
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
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="flex min-h-[100dvh] w-full flex-col pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:pb-0 sm:pl-64">
          <Sidebar />
          <div className="flex flex-col flex-1 pl-0">
            <main className="flex-1 p-4 pt-20 sm:pt-8 md:p-8">
              {children}
            </main>
          </div>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
