import type { Metadata } from "next";
import { siteConfig } from "@/config/siteConfig";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/redux/provider";
import { AuthRehydrate } from "@/components/AuthRehydrate";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.appName} - ${siteConfig.appTagline}`,
  description: siteConfig.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
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
