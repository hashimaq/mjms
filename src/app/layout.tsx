import { GlobalAmbientFashion } from "@/components/brand/GlobalAmbientFashion";
import { getHitArticleMarqueeImageUrls } from "@/lib/catalogue/hit-article-marquee";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ThemeScript } from "@/lib/theme/ThemeScript";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import "./mjms-design-tokens.css";
import "./mjms-workspace.css";
import "./mjms-workspace-presentation.css";
import "./mjms-fashion-visuals.css";
import "./mjms-illustration-field.css";
import "./mjms-ambient-fashion.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MJMS Product Development",
  description:
    "MJMS ladies footwear and fashion product development — seasonal catalogue and development records.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let productMarqueeUrls: string[] = [];
  try {
    productMarqueeUrls = await getHitArticleMarqueeImageUrls();
  } catch (e) {
    console.error("[layout] hit article marquee", e);
  }

  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${manrope.variable} font-sans antialiased`}>
        <ThemeProvider>
          <GlobalAmbientFashion productMarqueeUrls={productMarqueeUrls} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
