"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
export type Locale = "en-US" | "pt-BR";
const numberFor = (locale: Locale, value: number, digits = 0) => new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const fallback = { locale: "en-US" as Locale, setLocale: (locale: Locale) => { void locale; }, t: (en: string, pt: string) => { void pt; return en; }, number: (value: number, digits = 0) => numberFor("en-US", value, digits) };
const LocaleContext = createContext(fallback);
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>("en-US");
  useEffect(() => {
    const restore = () => {
      try { const saved = localStorage.getItem("talkfeedback-locale"); updateLocale(saved === "pt-BR" ? "pt-BR" : "en-US"); } catch { /* Storage is optional. */ }
    };
    restore();
    window.addEventListener("storage", restore);
    return () => window.removeEventListener("storage", restore);
  }, []);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale: (next: Locale) => {
    updateLocale(next);
    try { localStorage.setItem("talkfeedback-locale", next); } catch { /* Keep the current session usable when storage is blocked. */ }
  }, t: (en: string, pt: string) => locale === "pt-BR" ? pt : en, number: (n: number, digits = 0) => numberFor(locale, n, digits) }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() { return useContext(LocaleContext); }
