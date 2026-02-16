import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { ReduxProvider } from "@/redux/provider";
import { AuthRehydrate } from "@/components/AuthRehydrate";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "CipherLearn - Smart Tuition Management",
  description: "Comprehensive management solution for tuition centers and educators.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased font-sans`}
      >
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthRehydrate />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
