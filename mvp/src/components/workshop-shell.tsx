"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
const navigation = [{ href: "/", label: "Home" }, { href: "/feedback", label: "Leave feedback" }, { href: "/results", label: "Results" }];
export function WorkshopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <div className="loop-site"><a className="skip-link" href="#main-content">Skip to content</a><header className="loop-header"><Link href="/" className="wordmark loop-wordmark" aria-label="Talk Feedback home">Talk<span>Feedback</span><span className="wordmark-square" aria-hidden="true" /></Link><nav aria-label="Main navigation">{navigation.map(({ href, label }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>{label}</Link>)}</nav></header><main id="main-content" className="loop-main" tabIndex={-1}>{children}</main><footer className="loop-footer"><Link href="/">Talk Feedback</Link><p>Build something. Learn from people. Make it better.</p><span>Packt workshop</span></footer></div>;
}
