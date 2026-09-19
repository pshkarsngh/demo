"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  Search,
  GraduationCap,
  Compass,
  Scale,
  Award,
  BookOpen,
  Building2,
  LayoutDashboard,
  Sparkles,
  FileQuestion,
  CalendarDays,
  MessagesSquare,
  PenLine,
  Phone,
  ChevronDown,
  HelpCircle,
  Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const PRIMARY_NAV = [
  { label: "Colleges", href: "/colleges", icon: Building2 },
  { label: "Courses", href: "/courses", icon: GraduationCap },
  { label: "Predictor", href: "/college-predictor", icon: Sparkles },
  { label: "Scholarships", href: "/scholarships", icon: Award },
  { label: "Mock Tests", href: "/mock-tests", icon: FileQuestion },
  { label: "Exams", href: "/exams", icon: CalendarDays },
];

const MORE_NAV = [
  { label: "Compare", href: "/compare", icon: Scale },
  { label: "AI Assistant", href: "/ask-ai", icon: MessagesSquare },
  { label: "Reviews", href: "/reviews", icon: PenLine },
  { label: "Blog", href: "/blog", icon: Newspaper },
  { label: "Resources", href: "/resources", icon: BookOpen },
  { label: "About", href: "/about", icon: Compass },
  { label: "Contact", href: "/contact", icon: Phone },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export function Logo({ dark = false, showTagline = true }: { dark?: boolean; showTagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="padhaanewala home">
      <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
        <GraduationCap className="h-6 w-6" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-xl font-extrabold tracking-[-0.03em]",
            dark ? "text-white" : "text-purple-950",
          )}
        >
          padhaanewala
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 block text-[7.5px] font-bold uppercase tracking-[0.18em]",
              dark ? "text-white/60" : "text-gray-400",
            )}
          >
            LEARN TODAY, A BRIGHTER TOMORROW
          </span>
        )}
      </span>
    </Link>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement | null>(null);

  const heroMode = pathname === "/" && !scrolled && !open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isMoreActive = MORE_NAV.some((i) => isActive(i.href));

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        heroMode || open ? "nav-dark" : scrolled || open ? "glass-nav" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Logo dark={heroMode} showTagline={true} />

        <nav aria-label="Primary" className="hidden items-center gap-0.5 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                  heroMode
                    ? active
                      ? "text-white font-semibold"
                      : "text-white/80 hover:text-white"
                    : active
                      ? "text-purple-700 font-semibold"
                      : "text-slate-600 hover:text-purple-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="relative" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors",
                heroMode
                  ? isMoreActive
                    ? "text-white font-semibold"
                    : "text-white/80 hover:text-white"
                  : isMoreActive
                    ? "text-purple-700 font-semibold"
                    : "text-slate-600 hover:text-purple-700",
              )}
            >
              More
              <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-purple-100 bg-white p-1.5 shadow-xl animate-fade-up">
                {MORE_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-purple-50 text-purple-800" : "text-gray-700 hover:bg-gray-50",
                      )}
                    >
                      <Icon className="h-4 w-4 text-purple-500" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <ThemeToggle />
          <Link
            href="/colleges"
            aria-label="Search colleges"
            title="Search"
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full transition-colors",
              heroMode
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-purple-50 hover:text-purple-800",
            )}
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>
          <ButtonLink href="/admission" variant="accent" size="sm" className="rounded-full">
            <HelpCircle className="h-4 w-4" />
            Get Admission Help
          </ButtonLink>
          {heroMode ? (
            <>
              <Link
                href="/login"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/25 bg-white/[0.08] px-4 text-sm font-medium text-white backdrop-blur transition hover:bg-white/[0.18]"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=signup"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition hover:brightness-110"
              >
                Register <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" size="sm" className="rounded-full">
                Log in
              </ButtonLink>
              <ButtonLink href="/login?mode=signup" variant="outline" size="sm" className="rounded-full">
                Register
              </ButtonLink>
            </>
          )}
        </div>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl shadow-sm ring-1 lg:hidden",
            heroMode
              ? "bg-white/[0.08] text-white ring-white/20 backdrop-blur"
              : "bg-white text-purple-900 ring-purple-100",
          )}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden">
          <div className="mx-4 mb-4 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-purple-100 bg-white shadow-xl animate-fade-up scroll-thin">
            <nav aria-label="Mobile" className="flex flex-col p-2">
              {[...PRIMARY_NAV, ...MORE_NAV, { label: "Home", href: "/", icon: Compass }].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                      active ? "bg-purple-50 text-purple-800" : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] text-purple-500" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-2 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between px-2 py-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Theme</span>
                  <ThemeToggle showLabel />
                </div>
                <ButtonLink href="/admission" variant="accent" size="md" onClick={() => setOpen(false)}>
                  <HelpCircle className="h-4 w-4" />
                  Get Admission Help
                </ButtonLink>
                <ButtonLink href="/colleges" variant="outline" size="md" onClick={() => setOpen(false)}>
                  <Search className="h-4 w-4" />
                  Search colleges
                </ButtonLink>
                <div className="flex gap-2">
                  <ButtonLink href="/login" variant="secondary" size="md" className="flex-1" onClick={() => setOpen(false)}>
                    Log in
                  </ButtonLink>
                  <ButtonLink href="/login?mode=signup" variant="outline" size="md" className="flex-1" onClick={() => setOpen(false)}>
                    Register
                  </ButtonLink>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}