import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "PCC Chart Collection",
  description: "An archive of Phigros Fanmade charts and community projects."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>
        <SiteHeader />
        <main className="min-h-[75vh]">{children}</main>
        <footer className="mt-24 border-t border-line">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-[10px] tracking-wider text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
            <span>PCC CHART COLLECTION</span>
            <span>UNOFFICIAL PHIGROS FANMADE ARCHIVE</span>
          </div>
        </footer>
      </body>
    </html>
  );
}