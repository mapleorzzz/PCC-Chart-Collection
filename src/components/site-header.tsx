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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-5 sm:py-5">
        <Link href="/" aria-label="PCC Chart Collection ホームへ戻る" className="group flex shrink-0 items-center">
          <img src="/pcc-header-logo.webp" alt="PHIRA CHARTER CHAMPIONSHIP" className="h-14 w-14 object-contain mix-blend-screen sm:h-16 sm:w-16" />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-xs tracking-wider text-neutral-400 transition hover:text-white">
              {english ? link.en : link.ja}
            </Link>
          ))}
          <a href="https://wikiwiki.jp/phigros-fnmd/" target="_blank" rel="noopener noreferrer" className="text-xs tracking-wider text-neutral-400 transition hover:text-white">
            WIKI ↗
          </a>
          <a href="https://discord.com/invite/qVNzHuZ26T" target="_blank" rel="noopener noreferrer" className="text-xs tracking-wider text-neutral-400 transition hover:text-white">
            DISCORD ↗
          </a>
          <button onClick={() => setEnglish(!english)} className="border border-line px-3 py-2 text-[10px] tracking-widest text-neutral-300 hover:border-white hover:text-white">
            {english ? "JP" : "EN"}
          </button>
        </nav>
        <button className="flex min-h-11 min-w-11 items-center justify-center text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="grid gap-1 border-t border-line px-4 py-3 sm:px-5 md:hidden">
          {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center text-sm text-neutral-300">{english ? link.en : link.ja}</Link>)}
          <a href="https://wikiwiki.jp/phigros-fnmd/" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="text-sm text-neutral-300">WIKI ↗</a>
          <a href="https://discord.com/invite/qVNzHuZ26T" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex min-h-11 items-center text-sm text-neutral-300">DISCORD ↗</a>
          <button onClick={() => setEnglish(!english)} className="min-h-11 w-fit text-xs text-neutral-400">{english ? "日本語に切り替え" : "Switch to English"}</button>
        </nav>
      )}
    </header>
  );
}
