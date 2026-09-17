"use client";

import Link from "next/link";
import { Star, ArrowRight } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "padhaanewala helped me find the perfect college. The information is clear, reliable and easy to compare!",
    name: "Riya Sharma",
    role: "B.Tech, IIT Bombay",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "The course comparison feature saved me so much time. Highly recommended for anyone planning higher education.",
    name: "Arjun Mehta",
    role: "MBA, IIM Ahmedabad",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  },
  {
    quote:
      "I found the right college in my dream city with the help of padhaanewala. The recommendations were spot on!",
    name: "Sneha Iyer",
    role: "B.Sc, Christ University",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80",
  },
];

export function StudentTestimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-900 sm:text-3xl">
            What Students Say
          </h2>
          <p className="mt-1 text-sm text-gray-500 sm:text-[15px]">
            Real stories from students who found their perfect fit with padhaanewala.
          </p>
        </div>
        <Link
          href="/about"
          className="group inline-flex items-center gap-1 text-sm font-semibold text-purple-700 transition hover:text-purple-900"
        >
          View All{" "}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* 3 Testimonial Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.name}
            className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
          >
            <p className="text-sm leading-relaxed text-gray-700 sm:text-[15px]">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="mt-6 flex items-center gap-3.5 pt-4">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
                <div className="mt-1 flex gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
