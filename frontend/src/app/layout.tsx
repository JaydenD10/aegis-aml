import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AegisAML | 3D Liquid-Glass AML Intelligence",
  description: "Enterprise Anti-Money Laundering Surveillance, AI Explainability & Behavioral Drift Detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="antialiased min-h-screen text-slate-900 selection:bg-blue-500/20 selection:text-blue-900 relative">
        {/* Dynamic Atmospheric Glow Mesh Orbs */}
        <div className="orb-glow-1" />
        <div className="orb-glow-2" />
        <div className="orb-glow-3" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
