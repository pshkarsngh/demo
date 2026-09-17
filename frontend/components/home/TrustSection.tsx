import { BadgeCheck, FileText, MessageSquareHeart, Scale, Sparkles } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";

const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    title: "Verified College Information",
    desc: "Every college profile is checked by our research team — names, courses, fees and cutoffs are kept current, not copied.",
    color: "bg-blue-100 text-blue-600",
    ring: "hover:ring-blue-200",
    stat: "1,400+ profiles",
  },
  {
    icon: FileText,
    title: "Updated Course & Fee Details",
    desc: "Indicative annual fees, seats and durations refresh each admission cycle so you plan with real numbers.",
    color: "bg-purple-100 text-purple-600",
    ring: "hover:ring-purple-200",
    stat: "18K+ programs",
  },
  {
    icon: MessageSquareHeart,
    title: "Genuine Student Reviews",
    desc: "Real students rate academics, placements, faculty and campus life — the honest picture before you shortlist.",
    color: "bg-amber-100 text-amber-600",
    ring: "hover:ring-amber-200",
    stat: "2.4L+ reviews",
  },
  {
    icon: Scale,
    title: "Compare Colleges Easily",
    desc: "Stack up to 4 colleges on fees, ratings, placements and facilities in one clean side-by-side view.",
    color: "bg-orange-100 text-orange-600",
    ring: "hover:ring-orange-200",
    stat: "4-way compare",
  },
];

export function TrustSection() {
  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-noise opacity-60" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow mb-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-blue-700 ring-1 ring-inset ring-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> Built on trust
            </p>
            <h2 className="section-title font-display font-extrabold text-purple-950">
              Make your college decision with confidence
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500">
              The information that matters most — verified, updated and easy to
              compare — so you choose with your head, not guesswork.
            </p>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {TRUST_ITEMS.map((item, i) => (
            <Reveal key={item.title} delay={i * 0.08}>
              <div
                className={`group flex h-full flex-col rounded-2xl bg-white p-6 ring-1 ring-purple-100/70 card-shadow transition-all duration-300 hover:-translate-y-1 hover:card-shadow-hover ${item.ring}`}
              >
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${item.color}`}>
                  <item.icon className="h-6 w-6" strokeWidth={1.9} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                <p className="mt-4 border-t border-gray-100 pt-3 font-accent text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {item.stat}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}