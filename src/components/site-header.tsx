"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [english, setEnglish] = useState(false);
  const links = [
    { href: "/", ja: "ホーム", en: "HOME" },
    { href: "/charts", ja: "譜面一覧", en: "CHARTS" },
    { href: "/projects", ja: "企画一覧", en: "PROJECTS" },
    { href: "/about", ja: "このサイトについて", en: "ABOUT" }
  ];

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link href="/" className="group">
          <span className="block text-lg font-semibold tracking-[0.18em] text-white">PCC</span>
          <span className="block text-[9px] tracking-[0.22em] text-muted">CHART COLLECTION</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs tracking-wider text-neutral-400 transition hover:text-white">
              {english ? link.en : link.ja}
            </Link>
          ))}
          <button onClick={() => setEnglish(!english)} className="border border-line px-3 py-2 text-[10px] tracking-widest text-neutral-300 hover:border-white hover:text-white">
            {english ? "JP" : "EN"}
          </button>
        </nav>
        <button className="text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="grid gap-4 border-t border-line px-5 py-5 md:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-sm text-neutral-300">{english ? link.en : link.ja}</Link>)}
          <button onClick={() => setEnglish(!english)} className="w-fit text-xs text-neutral-400">{english ? "日本語に切り替え" : "Switch to English"}</button>
        </nav>
      )}
    </header>
  );
}
