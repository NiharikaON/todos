import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Enterprise Todo App",
  description: "A production-ready Full Stack Todo Management Application",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "@/providers/QueryProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});


import { AmplifyProvider } from "@/providers/AmplifyProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { BrowserNotificationProvider } from "@/providers/BrowserNotificationProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AmplifyProvider>
            <QueryProvider>
              <AuthProvider>
                <BrowserNotificationProvider>
                  {children}
                  <Toaster position="top-right" />
                </BrowserNotificationProvider>
              </AuthProvider>
            </QueryProvider>
          </AmplifyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
