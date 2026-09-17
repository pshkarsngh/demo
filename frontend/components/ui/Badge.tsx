import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "purple" | "blue" | "yellow" | "orange" | "amber" | "green" | "gray" | "red";

const variants: Record<Variant, string> = {
  purple: "bg-purple-50 text-purple-700 ring-purple-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  yellow: "bg-yellow-50 text-yellow-800 ring-yellow-300",
  orange: "bg-orange-50 text-orange-700 ring-orange-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-300",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  gray: "bg-gray-100 text-gray-600 ring-gray-200",
  red: "bg-red-50 text-red-600 ring-red-200",
};

interface BadgeProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = "purple", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}