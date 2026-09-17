"use client";

import { useState } from "react";
import { Award, ExternalLink, GraduationCap, Clock } from "lucide-react";
import { SCHOLARSHIPS } from "@/lib/data/scholarships";
import { Badge } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";

const TAGS = ["All", "Merit", "Need", "Women", "Engineering", "Premier"];

export default function ScholarshipsExplorer() {
  const [tag, setTag] = useState("All");
  const eligible = (sch: (typeof SCHOLARSHIPS)[number]) =>
    tag === "All" || sch.tags.includes(tag);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-orange-600">
          <GraduationCap className="h-4 w-4" /> Financial support
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-purple-950 sm:text-4xl">
          Scholarships & Grants
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          From national schemes like NSP and Pragati to major private foundations,
          explore funding that can make your education more affordable.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <Chip key={t} active={tag === t} onClick={() => setTag(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {SCHOLARSHIPS.filter(eligible).map((s) => (
          <article
            key={s.id}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-orange-100/70 card-shadow transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`h-1.5 w-full bg-gradient-to-r ${s.color}`} />
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm ${s.color}`}>
                  <Award className="h-5 w-5" />
                </span>
                <Badge variant="amber" className="shrink-0">
                  <Clock className="h-3 w-3" /> {new Date(s.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Badge>
              </div>
              <h3 className="font-display mt-3 text-base font-bold leading-snug text-gray-900">{s.name}</h3>
              <p className="mt-1 text-xs text-gray-400">{s.provider}</p>

              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium text-gray-400">Amount</dt>
                  <dd className="font-bold text-purple-700 tabular-nums">{s.amount}</dd>
                </div>
                <div className="flex items-start gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium text-gray-400">Eligibility</dt>
                  <dd className="text-xs leading-relaxed text-gray-500">{s.eligibility}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <dt className="w-20 shrink-0 text-xs font-medium text-gray-400">Renewable</dt>
                  <dd className={s.renewable ? "font-semibold text-emerald-600" : "text-gray-400"}>
                    {s.renewable ? "Yes" : "One-time"}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.tags.map((t) => (
                  <Badge key={t} variant="purple" className="text-[11px]">
                    {t}
                  </Badge>
                ))}
              </div>

              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="mt-auto inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-orange-500 pt-2 pb-2 mt-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                View details <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}