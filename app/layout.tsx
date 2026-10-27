import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["800"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Chem Unit Practice",
  description: "Practice for the bonding and naming unit test.",
};

export const viewport: Viewport = {
  themeColor: "#121a23",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <header className="border-b border-border">
          <nav
            aria-label="Main"
            className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm sm:px-6"
          >
            <Link href="/" className="font-display text-base text-fg">
              Chem Unit 2
            </Link>
            <Link href="/" className="text-muted hover:text-fg">
              Dashboard
            </Link>
            <Link href="/polyatomic" className="text-muted hover:text-fg">
              Polyatomic ions
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
          {children}
        </main>
      </body>
    </html>
  );
}
