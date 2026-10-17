"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
const navigation = [{ href: "/", label: "Home" }, { href: "/feedback", label: "Leave feedback" }, { href: "/results", label: "Results" }];
export function WorkshopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="loop-site"><a className="skip-link" href="#main-content">Skip to content</a><header className="loop-header"><Link href="/" className="loop-wordmark" aria-label="Grok Bot home"><svg className="brand-mark" viewBox="0 0 42 42" aria-hidden="true" focusable="false"><path d="M21 3C30 2 38 10 39 20c1 10-6 18-17 19C11 40 3 34 3 24 2 14 11 4 21 3Z" /><ellipse cx="17" cy="19" rx="2.2" ry="4.2" /><ellipse cx="25" cy="18" rx="2.2" ry="4.2" /></svg><span>Grok Bot</span></Link><nav aria-label="Main navigation">{navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav></header><main id="main-content" className="loop-main" tabIndex={-1}>{children}</main><footer className="loop-footer"><Link href="/">Grok Bot</Link><p>Build. Listen. Improve.</p><span>Packt workshop</span></footer></div>;
}
