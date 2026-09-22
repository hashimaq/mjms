import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ThemeScript } from "@/lib/theme/ThemeScript";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./mjms-design-tokens.css";
import "./mjms-workspace.css";
import "./mjms-workspace-presentation.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MJMS Product Development",
  description: "Product Development & Project Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
