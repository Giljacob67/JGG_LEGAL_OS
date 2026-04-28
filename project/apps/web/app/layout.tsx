import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "JGG GROUP — Legal OS",
  description: "Sistema juridico integrado · Jacob, Greczyszn & Greczyszn · especializado em direito Agrario, Bancario e Tributario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="pt-BR" className="h-full antialiased" suppressHydrationWarning>
        <body className="min-h-full flex flex-col font-sans">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}