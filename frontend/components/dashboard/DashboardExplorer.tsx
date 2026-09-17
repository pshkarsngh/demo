"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Eye,
  Scale,
  Search,
  CalendarClock,
  Award,
  Settings,
  MapPin,
  Star,
  ArrowRight,
  Sparkles,
  Bookmark,
  Trash2,
} from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import {
  getCollegeById,
  getCollegesByIds,
  getRecommendedColleges,
  getRecommendationReason,
} from "@/lib/data/colleges";
import { COLLEGES } from "@/lib/data/colleges";
import { COURSES } from "@/lib/data/courses";
import { SCHOLARSHIPS } from "@/lib/data/scholarships";
import { formatINR, matchScore } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Tabs, Switch } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Rating } from "@/components/ui/Rating";
import { CollegeCard } from "@/components/college/CollegeCard";
import { CampusArt } from "@/components/college/CampusArt";

const TABS = [
  { id: "overview", label: "Overview", icon: <Star className="h-3.5 w-3.5" /> },
  { id: "saved", label: "Saved", icon: <Heart className="h-3.5 w-3.5" /> },
  { id: "recent", label: "Recent", icon: <Eye className="h-3.5 w-3.5" /> },
  { id: "searches", label: "Searches", icon: <Search className="h-3.5 w-3.5" /> },
  { id: "comparisons", label: "Compare", icon: <Scale className="h-3.5 w-3.5" /> },
  { id: "settings", label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
];

function BentoCard({
  label,
  icon,
  tone,
  href,
  hrefLabel,
  className,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  tone: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col rounded-3xl bg-white p-6 ring-1 ring-purple-100/60 card-shadow transition-all duration-300 hover:-translate-y-0.5 hover:card-shadow-hover ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2.5 font-display text-[15px] font-bold text-gray-900">
          <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
          {label}
        </h3>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition hover:text-purple-700"
          >
            {hrefLabel ?? "View all"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className="mt-4 flex-1">{children}</div>
    </div>
  );
}

function MiniCollege({ id, match }: { id: string; match?: boolean }) {
  const c = getCollegeById(id);
  if (!c) return null;
  return (
    <Link
      href={`/colleges/${c.slug}`}
      className="group flex w-full items-center gap-3 rounded-2xl p-2 transition hover:bg-purple-50"
    >
      <CampusArt gradientId={c.gradientId} initials={c.initials} className="h-11 w-11 shrink-0 rounded-xl text-[10px]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-purple-700">
          {c.shortName}
        </p>
        <p className="flex items-center gap-1 truncate text-xs text-gray-400">
          <MapPin className="h-3 w-3" /> {c.city} ·{" "}
          <Rating value={c.rating} size={12} />
        </p>
      </div>
      {match && (
        <span className="match-badge shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold">
          {matchScore(c.id)}%
        </span>
      )}
    </Link>
  );
}

function SavedBento() {
  const { savedColleges } = useApp();
  const items = getCollegesByIds(savedColleges.slice(0, 3));
  return (
    <BentoCard
      label="Saved Colleges"
      icon={<Heart className="h-4 w-4 text-rose-500" />}
      tone="bg-rose-50"
      href="/dashboard?tab=saved"
      className="lg:col-span-2 lg:row-span-2"
    >
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 py-6 text-center">
          <Bookmark className="h-8 w-8 text-purple-200" />
          <p className="max-w-[200px] text-sm text-gray-400">
            No saved colleges yet. Heart the ones you love.
          </p>
          <ButtonLink href="/colleges" variant="accent" size="sm">
            Explore colleges
          </ButtonLink>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((c) => (
            <MiniCollege key={c.id} id={c.id} />
          ))}
          {savedColleges.length > 3 && (
            <p className="px-2 pt-1 text-xs font-medium text-gray-400">
              +{savedColleges.length - 3} more saved
            </p>
          )}
        </div>
      )}
    </BentoCard>
  );
}

function RecentBento() {
  const { recentViews } = useApp();
  const items = getCollegesByIds(recentViews.slice(0, 3));
  return (
    <BentoCard
      label="Recently Viewed"
      icon={<Eye className="h-4 w-4 text-purple-500" />}
      tone="bg-purple-50"
      href="/dashboard?tab=recent"
      className="lg:col-span-2"
    >
      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">Nothing here yet — start browsing.</p>
      ) : (
        <div className="space-y-1">
          {items.map((c) => (
            <MiniCollege key={c.id} id={c.id} />
          ))}
        </div>
      )}
    </BentoCard>
  );
}

function RecommendedBento() {
  const { recentViews } = useApp();
  const recs = getRecommendedColleges(recentViews, 2);
  const reason = getRecommendationReason(getCollegesByIds(recentViews));
  return (
    <BentoCard
      label="Recommended"
      icon={<Sparkles className="h-4 w-4 text-amber-500" />}
      tone="bg-amber-50"
      href="/dashboard?tab=recent"
      hrefLabel="Go to recs"
      className="lg:col-span-2 lg:row-span-2"
    >
      <p className="flex items-center gap-1.5 px-2 pb-2 text-xs text-gray-400">{reason}</p>
      <div className="space-y-1">
        {recs.map((c) => (
          <MiniCollege key={c.id} id={c.id} match />
        ))}
      </div>
      <div className="mt-4">
        <CollegeCard college={getCollegesByIds(recs.slice(0, 1).map((r) => r.id))[0] ?? COLLEGES[0]!} />
      </div>
    </BentoCard>
  );
}

function CompareBento() {
  const { compareHistory, compareList } = useApp();
  const currentNames = compareList
    .map((id) => getCollegeById(id)?.shortName)
    .filter(Boolean)
    .join(" vs ");
  return (
    <BentoCard
      label="Comparisons"
      icon={<Scale className="h-4 w-4 text-blue-500" />}
      tone="bg-blue-50"
      href="/compare"
      hrefLabel={compareList.length ? "Open compare" : "Start comparing"}
      className="lg:col-span-2"
    >
      {currentNames ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
            {currentNames}
          </span>
          <span className="text-xs text-gray-400">· {compareHistory.length} saved</span>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">
          Compare up to 4 colleges side by side.
        </p>
      )}
      {(compareHistory.length > 0) && (
        <p className="mt-3 text-xs text-gray-400">
          {compareHistory.length} comparison{compareHistory.length > 1 ? "s" : ""} saved on your dashboard.
        </p>
      )}
    </BentoCard>
  );
}

function ScholarshipsBento() {
  return (
    <BentoCard
      label="Scholarships"
      icon={<Award className="h-4 w-4 text-amber-500" />}
      tone="bg-amber-50"
      href="/scholarships"
      className="lg:col-span-3"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {SCHOLARSHIPS.slice(0, 2).map((s) => (
          <Link
            key={s.id}
            href="/scholarships"
            className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-purple-50"
          >
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-base text-white shadow-sm ${s.color}`}>
              🎓
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{s.name}</p>
              <p className="truncate text-xs text-gray-400">{s.provider} · <span className="font-semibold text-gray-600">{s.amount}</span></p>
            </div>
          </Link>
        ))}
      </div>
    </BentoCard>
  );
}

function DeadlinesBento() {
  const upcoming = useMemo(
    () =>
      COLLEGES.map((c) => ({
        slug: c.slug,
        shortName: c.shortName,
        city: c.city,
        deadline: c.admission.applicationDeadline,
      }))
        .filter((c) => new Date(c.deadline) >= new Date())
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
        .slice(0, 4),
    [],
  );

  return (
    <BentoCard
      label="Admission Deadlines"
      icon={<CalendarClock className="h-4 w-4 text-orange-500" />}
      tone="bg-orange-50"
      href="/dashboard?tab=searches"
      hrefLabel="Manage alerts"
      className="lg:col-span-3"
    >
      <ul className="grid gap-2 sm:grid-cols-2">
        {upcoming.map((c) => {
          // Relative "days left" computed at render time is intentional.
          // eslint-disable-next-line react-hooks/purity
          const daysLeft = Math.max(0, Math.ceil((new Date(c.deadline).getTime() - Date.now()) / 86400000));
          const urgent = daysLeft <= 14;
          return (
            <li key={c.slug}>
              <Link
                href={`/colleges/${c.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl p-2.5 transition hover:bg-purple-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{c.shortName}</p>
                  <p className="truncate text-xs text-gray-400">{c.city}</p>
                </div>
                <Badge variant={urgent ? "orange" : "blue"}>{daysLeft} days left</Badge>
              </Link>
            </li>
          );
        })}
        {upcoming.length === 0 && (
          <li className="col-span-full py-4 text-center text-sm text-gray-400">No upcoming deadlines</li>
        )}
      </ul>
    </BentoCard>
  );
}

function SavedTab() {
  const { savedColleges, savedCourses, toggleCourseSave } = useApp();
  const colleges = getCollegesByIds(savedColleges);
  const courses = COURSES.filter((c) => savedCourses.includes(c.slug));

  return (
    <div>
      <h3 className="font-display text-lg font-bold text-gray-900">Saved colleges ({colleges.length})</h3>
      {colleges.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved colleges yet"
          description="Bookmark colleges you are interested in and they will appear here."
          actionHref="/colleges"
          actionLabel="Explore colleges"
        />
      ) : (
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          {colleges.map((c) => (
            <CollegeCard key={c.id} college={c} />
          ))}
        </div>
      )}

      <h3 className="mt-10 font-display text-lg font-bold text-gray-900">Saved courses ({courses.length})</h3>
      {courses.length === 0 ? (
        <p className="mt-3 rounded-2xl bg-gray-50 py-8 text-center text-sm text-gray-400">No saved courses yet.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {courses.map((c) => (
            <article key={c.slug} className="relative rounded-2xl bg-white p-5 ring-1 ring-purple-100/60 card-shadow">
              <button
                aria-label={`Remove ${c.name}`}
                onClick={() => toggleCourseSave(c.slug, c.name)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <Badge variant={c.hot ? "orange" : "blue"} className="mb-2">
                {c.level}
              </Badge>
              <p className="font-display text-sm font-bold text-gray-900">{c.name}</p>
              <p className="mt-1 text-xs text-gray-400">{c.duration} · {formatINR(c.avgFeeYear)}/yr avg</p>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{c.description}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentTab() {
  const { recentViews } = useApp();
  const colleges = getCollegesByIds(recentViews);

  if (colleges.length === 0) {
    return (
      <EmptyState
        icon={Eye}
        title="No recent activity"
        description="Start browsing colleges and they will appear here."
        actionHref="/colleges"
        actionLabel="Browse colleges"
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {colleges.map((c) => (
        <CollegeCard key={c.id} college={c} />
      ))}
    </div>
  );
}

function SearchesTab() {
  const { recentSearches, recentLocations } = useApp();
  return (
    <div className="space-y-8">
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900">
          <Search className="h-5 w-5 text-purple-500" /> Recent searches
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentSearches.length === 0 ? (
            <p className="text-sm text-gray-400">No searches yet.</p>
          ) : (
            recentSearches.map((s) => (
              <Link
                key={s}
                href={`/colleges?q=${encodeURIComponent(s)}`}
                className="rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100"
              >
                {s}
              </Link>
            ))
          )}
        </div>
      </div>
      <div>
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-gray-900">
          <MapPin className="h-5 w-5 text-blue-500" /> Recent locations
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {recentLocations.length === 0 ? (
            <p className="text-sm text-gray-400">No locations yet.</p>
          ) : (
            recentLocations.map((l) => (
              <Link
                key={l}
                href={`/colleges?q=${encodeURIComponent(l)}`}
                className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                📍 {l}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ComparisonsTab() {
  const { toggleCompare, clearCompare } = useApp();
  const [history] = useState<string[][]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("cp_compare_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const loadComparison = (ids: string[]) => {
    clearCompare();
    ids.forEach((id) => {
      const c = getCollegeById(id);
      if (c) toggleCompare(c.id, c.shortName);
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-bold text-gray-900">Comparison history</h3>
      {history.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No comparisons saved yet"
          description="Compare colleges side by side, then save your comparisons to access them here."
          actionHref="/compare"
          actionLabel="Start comparing"
        />
      ) : (
        <div className="space-y-3">
          {history.map((ids, i) => {
            const names = ids.map((id) => getCollegeById(id)?.shortName ?? "Unknown").join(" vs ");
            return (
              <button
                key={i}
                onClick={() => loadComparison(ids)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 ring-1 ring-purple-100/60 card-shadow transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Scale className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold text-gray-900">{names}</span>
                </div>
                <span className="text-xs text-gray-400">#{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { prefs, setPrefs } = useApp();
  const rows = [
    { label: "Admission deadline reminders", key: "admissionDeadlines" as const },
    { label: "Scholarship alerts", key: "scholarshipAlerts" as const },
    { label: "Application status updates", key: "applicationUpdates" as const },
    { label: "Personalised recommendations", key: "featuredRecommendations" as const },
    { label: "Weekly email digest", key: "emailDigest" as const },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-bold text-gray-900">Notification preferences</h3>
      {rows.map((r) => (
        <div
          key={r.key}
          className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 ring-1 ring-purple-100/60 card-shadow"
        >
          <span className="text-sm font-medium text-gray-800">{r.label}</span>
          <Switch checked={prefs[r.key]} onChange={(v) => setPrefs({ [r.key]: v })} label={r.label} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardExplorer() {
  const [tab, setTab] = useState("overview");
  const { savedColleges, recentViews, compareList } = useApp();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statItems = [
    { icon: <Heart className="h-5 w-5 text-rose-500" />, label: "Saved colleges", value: savedColleges.length, tone: "bg-rose-50" },
    { icon: <Eye className="h-5 w-5 text-purple-500" />, label: "Recently viewed", value: recentViews.length, tone: "bg-purple-50" },
    { icon: <Scale className="h-5 w-5 text-blue-500" />, label: "In compare list", value: compareList.length, tone: "bg-blue-50" },
    { icon: <CalendarClock className="h-5 w-5 text-orange-500" />, label: "Admission deadlines", value: COLLEGES.filter((c) => new Date(c.admission.applicationDeadline) >= new Date()).length, tone: "bg-orange-50" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm text-gray-500">
            <span className="text-lg">👋</span>
            {greeting}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-purple-950 sm:text-4xl">
            Continue your college search.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
            Pick up right where you left off — saved colleges, deadlines and new
            recommendations are waiting.
          </p>
        </div>
        <ButtonLink href="/colleges" variant="accent" size="md">
          <Search className="h-4 w-4" /> Resume search
        </ButtonLink>
      </div>

      {/* quick stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statItems.map((s) => (
          <div key={s.label} className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-purple-100/60 card-shadow">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${s.tone}`}>{s.icon}</span>
            <div>
              <p className="font-display text-2xl font-extrabold tabular-nums text-gray-900">{s.value}</p>
              <p className="text-[13px] text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      <div className="mt-6 pb-16">
        {tab === "overview" && (
          <div className="grid gap-4 lg:grid-cols-6">
            <SavedBento />
            <RecentBento />
            <CompareBento />
            <RecommendedBento />
            <ScholarshipsBento />
            <DeadlinesBento />
          </div>
        )}
        {tab === "saved" && <SavedTab />}
        {tab === "recent" && <RecentTab />}
        {tab === "searches" && <SearchesTab />}
        {tab === "comparisons" && <ComparisonsTab />}
        {tab === "settings" && <SettingsTab />}
      </div>
    </section>
  );
}