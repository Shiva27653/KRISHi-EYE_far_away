import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PWARegistration } from "@/components/pwa/pwa-registration";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "KRISHI-EYE Platform",
  description: "AI-powered precision agriculture platform for Indian farmers. Real-time crop disease detection, targeted pesticide spraying, and agronomy advisory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased overflow-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <PWARegistration />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
