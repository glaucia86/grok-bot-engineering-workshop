"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useLocale } from "./locale-provider";
export function WorkshopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { locale, setLocale, t } = useLocale();
  const navigation = [{ href: "/", label: t("Home", "Início") }, { href: "/feedback", label: t("Leave feedback", "Avaliar") }, { href: "/results", label: t("Results", "Resultados") }];
  const current = navigation.find(item => item.href === pathname)?.label ?? "TalkFeedback";
  useEffect(() => { document.title = `${current} | TalkFeedback`; }, [current]);
  return <div className={`tf-site ${pathname === "/" ? "tf-site-home" : "tf-site-inner"}`}>
    <a className="skip-link" href="#main-content">{t("Skip to content", "Pular para o conteúdo")}</a>
    <header className="tf-header"><div className="tf-header-inner">
      <Link href="/" className="tf-brand" aria-label={t("TalkFeedback home", "TalkFeedback, página inicial")}><span className="tf-brand-icon"><MessageSquareText size={20} aria-hidden="true" /></span><span>Talk<span>Feedback</span></span></Link>
      <nav aria-label={t("Main navigation", "Navegação principal")}>{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>{item.label}</Link>)}</nav>
      <div className="tf-header-actions"><div className="tf-locale" role="group" aria-label={t("Language", "Idioma")}><button type="button" lang="en-US" aria-pressed={locale === "en-US"} onClick={() => setLocale("en-US")}>EN-US</button><button type="button" lang="pt-BR" aria-pressed={locale === "pt-BR"} onClick={() => setLocale("pt-BR")}>PT-BR</button></div><Link className="tf-button tf-header-cta" href="/feedback">{t("Rate a talk", "Avaliar talk")}<ArrowRight size={17} aria-hidden="true" /></Link></div>
    </div></header>
    <main id="main-content" className={pathname === "/" ? "tf-main-home" : "tf-main-inner"} tabIndex={-1}>{children}</main>
    <footer className="tf-footer"><div><Link className="tf-brand" href="/"><span className="tf-brand-icon"><MessageSquareText size={20} aria-hidden="true" /></span>TalkFeedback</Link><p>{t("A little feedback. A better next talk.", "Um pouco de feedback. Uma próxima talk melhor.")}</p><span>{t("Packt workshop · Participant feedback", "Workshop Packt · Feedback dos participantes")}</span></div><div><h2>{t("Take part", "Participar")}</h2><Link href="/feedback">{t("Leave feedback", "Avaliar uma talk")}</Link><Link href="/results">{t("Explore results", "Ver resultados")}</Link><Link href="/#how-it-works">{t("How it works", "Como funciona")}</Link></div><p className="tf-footer-note">{t("Names are not shown in results. Written comments are visible.", "Nomes não aparecem nos resultados. Os comentários escritos ficam visíveis.")}</p></footer>
  </div>;
}
