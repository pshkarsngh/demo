import type { Metadata } from "next";
import { BookOpen, Clock, ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "College admission guides, entrance exam tips, counselling strategies and career advice — all curated for Indian students.",
};

const GUIDES = [
  {
    tag: "Admission",
    title: "How JEE Main Counselling Works — A Complete Guide",
    snippet: "JoSAA, CSAB and state counselling — understand choice filling, seat allocation and freeze/float/slide options in 2026.",
    readTime: "8 min",
    color: "from-purple-600 to-blue-600",
  },
  {
    tag: "Career",
    title: "Top 10 Engineering Branches with the Best Placement Records",
    snippet: "Which B.Tech branches really lead to high-paying jobs? We break down placement rates across streams.",
    readTime: "6 min",
    color: "from-orange-500 to-amber-500",
  },
  {
    tag: "Exam",
    title: "BITSAT vs JEE Main — Which Should You Focus On?",
    snippet: "Comparing the difficulty, pattern, fees and career outcomes of two of India's most important engineering entrance exams.",
    readTime: "7 min",
    color: "from-blue-600 to-indigo-600",
  },
  {
    tag: "Financial",
    title: "All About Education Loans in India — Interest Rates and Repayment",
    snippet: "Public sector vs private bank loans, NBFCs, collateral-free options and moratorium periods explained.",
    readTime: "10 min",
    color: "from-violet-600 to-purple-600",
  },
  {
    tag: "College Life",
    title: "What to Expect from Hostel Life at NITs",
    snippet: "Room types, mess food quality, curfews, laundry — a realistic look at living in an NIT campus.",
    readTime: "5 min",
    color: "from-amber-500 to-orange-500",
  },
  {
    tag: "Admission",
    title: "State-wise CET Exams You Should Know About",
    snippet: "MHT-CET, WBJEE, TS-EAMCET, KEAM — a quick reference for state entrance exams and their timelines.",
    readTime: "9 min",
    color: "from-blue-700 to-purple-600",
  },
];

export default function ResourcesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-blue-600">
          <BookOpen className="h-4 w-4" /> Guides & Articles
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-purple-950 sm:text-4xl">
          Resources
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
          Expert guides, exam strategies and admission tips to help you
          navigate the college admissions process with confidence.
        </p>
      </div>

      <div className="mt-8 grid gap-5 pb-10 sm:grid-cols-2 lg:grid-cols-3">
        {GUIDES.map((g) => (
          <article
            key={g.title}
            className="group relative flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-purple-100/60 card-shadow transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`h-1.5 w-full bg-gradient-to-r ${g.color}`} />
            <div className="flex flex-1 flex-col p-5">
              <Badge variant="blue" className="w-fit">{g.tag}</Badge>
              <h3 className="font-display mt-3 text-base font-bold leading-snug text-gray-900">{g.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{g.snippet}</p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="h-3.5 w-3.5" /> {g.readTime}
                </span>
                <button className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-purple-700 transition">
                  Read <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-2xl bg-gradient-to-r from-purple-700 to-blue-700 p-8 text-center text-white card-shadow">
        <h2 className="font-display text-xl font-extrabold">Want personalised advice?</h2>
        <p className="mt-2 max-w-lg mx-auto text-sm text-purple-100">
          CampusPulse connects students with education counsellors for free career
          guidance and college selection support.
        </p>
        <Link
          href="/about"
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-6 text-sm font-bold text-purple-700 shadow-sm transition hover:bg-purple-50"
        >
          <BadgeCheck className="h-4 w-4" />
          Talk to a counsellor
        </Link>
      </div>
    </section>
  );
}