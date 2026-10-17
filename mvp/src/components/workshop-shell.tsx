"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ChevronRight, Home, MessageSquare, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feedback", label: "Leave feedback", icon: MessageSquare },
  { href: "/results", label: "Results", icon: BarChart3 },
];

export function WorkshopShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentPage = navigation.find(item => item.href === pathname)?.label ?? "Workshop";

  return (
    <div className="loop-site">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="loop-sidebar" aria-label="Workshop sidebar">
        <Link href="/" className="wordmark loop-wordmark" aria-label="Talk Feedback home">
          <span className="loop-brand-icon" aria-hidden="true"><RefreshCw size={21} strokeWidth={2.2} /></span>
          <span>Talk<span className="wordmark-light">Feedback</span></span>
        </Link>
        <div className="sidebar-section-label">Workshop</div>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              <Icon size={19} aria-hidden="true" />{label}
              {pathname === href && <span className="nav-active-mark" aria-hidden="true" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-loop-note">
          <RefreshCw size={21} aria-hidden="true" />
          <strong>A little feedback.<br />A better next iteration.</strong>
          <p>Build, listen, improve.<br />Keep the loop going.</p>
        </div>
        <div className="sidebar-workshop"><span className="workshop-monogram" aria-hidden="true">P</span><div><strong>Packt workshop</strong><span>Loop Engineering</span></div></div>
      </aside>
      <div className="loop-workspace">
        <header className="loop-topbar">
          <p className="loop-breadcrumb" aria-label="Current page"><span>Workshop</span><ChevronRight size={15} aria-hidden="true" /><strong>{currentPage}</strong></p>
          <span className="loop-topbar-note">Learn. Share. Improve.</span>
        </header>
        <main id="main-content" className="loop-main" tabIndex={-1}>{children}</main>
        <footer className="loop-footer"><span>Talk Feedback</span><p>Build something. Learn from people. Make it better.</p></footer>
      </div>
    </div>
  );
}
