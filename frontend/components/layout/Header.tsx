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

export function Logo({ dark = false, showTagline = false }: { dark?: boolean; showTagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="padhaanewala home">
      <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md shadow-purple-600/30">
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-extrabold tracking-[-0.03em]",
            dark ? "text-white" : "text-purple-950 dark:text-white"
          )}
        >
          padhaanewala
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-0.5 block text-[7px] font-bold uppercase tracking-[0.18em]",
              dark ? "text-white/60" : "text-gray-400 dark:text-gray-400"
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

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setScrolled((prev) => {
            if (y > 45 && !prev) return true;
            if (y < 20 && prev) return false;
            return prev;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
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
    <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 sm:px-6">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex items-center justify-between gap-3 backdrop-blur-xl floating-pill-nav",
          scrolled
            ? "scrolled bg-white/92 dark:bg-slate-900/92 py-2 px-4 sm:px-6"
            : "bg-white/80 dark:bg-slate-900/80 py-3 px-5 sm:px-7"
        )}
      >
        {/* Left: Logo + Name */}
        <Logo showTagline={false} />

        {/* Center: Nav links with dropdown carets */}
        <nav aria-label="Primary" className="hidden items-center gap-1 min-[900px]:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-all duration-200",
                  active
                    ? "bg-purple-100/70 text-purple-900 font-bold dark:bg-purple-950/80 dark:text-purple-200"
                    : "text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800/50"
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
                "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[14px] font-medium transition-all duration-200",
                isMoreActive
                  ? "bg-purple-100/70 text-purple-900 font-bold dark:bg-purple-950/80 dark:text-purple-200"
                  : "text-slate-600 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-slate-800/50"
              )}
            >
              More
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", moreOpen && "rotate-180")} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-3 w-56 overflow-hidden rounded-2xl border border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-2xl animate-fade-up">
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
                        active
                          ? "bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
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

        {/* Right: Circular Theme Toggle & Get Started Button */}
        <div className="hidden items-center gap-3 min-[900px]:flex">
          <ThemeToggle />
          <Link
            href="/login?mode=signup"
            className="btn-uiverse-arrow text-xs font-bold py-2 px-4.5"
          >
            <span>Get Started</span>
            <div className="arrow-wrapper">
              <div className="arrow" />
            </div>
          </Link>
        </div>

        {/* Mobile menu button (< 900px) */}
        <div className="flex items-center gap-2 min-[900px]:hidden">
          <ThemeToggle />
          <button
            aria-label="Toggle menu"
            aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full bg-purple-100/60 text-purple-900 dark:bg-slate-800 dark:text-purple-300 transition-colors"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {open && (
        <div className="pointer-events-auto min-[900px]:hidden mt-3 mx-auto w-[94%] max-w-[500px]">
          <div className="max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl border border-purple-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3 shadow-2xl backdrop-blur-2xl animate-fade-up scroll-thin">
            <nav aria-label="Mobile" className="flex flex-col gap-1">
              {[...PRIMARY_NAV, ...MORE_NAV, { label: "Home", href: "/", icon: Compass }].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors",
                      active
                        ? "bg-purple-100/70 text-purple-900 dark:bg-purple-950/80 dark:text-purple-200"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-4 w-4 text-purple-500" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="mt-2 grid grid-cols-1 gap-2 border-t border-gray-100 dark:border-slate-800 pt-3">
                <ButtonLink href="/admission" variant="accent" size="md" className="rounded-full" onClick={() => setOpen(false)}>
                  <HelpCircle className="h-4 w-4" />
                  Get Admission Help
                </ButtonLink>
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="flex-1 inline-flex h-11 items-center justify-center rounded-2xl bg-purple-100/60 dark:bg-slate-800 text-sm font-bold text-purple-900 dark:text-purple-300"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    onClick={() => setOpen(false)}
                    className="btn-uiverse-arrow flex-1 justify-center py-2.5 text-sm font-bold"
                  >
                    <span>Create account</span>
                    <div className="arrow-wrapper">
                      <div className="arrow" />
                    </div>
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}