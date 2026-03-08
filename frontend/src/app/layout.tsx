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

/**
 * Converts a hex color (#rrggbb) to HSL channel string "H S% L%".
 * globals.css uses the shadcn/ui pattern: `--primary: H S% L%`
 * so components can do `hsl(var(--primary))`. We inject the env-var
 * brand colors using this format so the entire Tailwind theme picks
 * them up at SSR time — zero client JS needed.
 */
function hexToHslChannels(hex: string): string {
  const clean = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l   = (max + min) / 2;
  const d   = max - min;
  const s   = d === 0 ? 0 : d / (l > 0.5 ? 2 - max - min : max + min);
  const h   = d === 0 ? 0
    : max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6
    : max === g ? ((b - r) / d + 2) / 6
    :             ((r - g) / d + 4) / 6;
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const primary = hexToHslChannels(siteConfig.primaryColor);
  const accent  = hexToHslChannels(siteConfig.accentColor);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      style={{
        "--primary":       primary,
        "--ring":          primary,
        "--border-hover":  primary,
        "--chart-primary": primary,
        "--accent":        accent,
        "--chart-warning": accent,
      } as React.CSSProperties}
    >
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
