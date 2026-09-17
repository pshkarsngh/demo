import type { Metadata } from "next";
import CompareExplorer from "@/components/compare/CompareExplorer";

export const metadata: Metadata = {
  title: "Compare Colleges",
  description:
    "Compare up to 4 colleges side by side on fees, placements, ratings, hostels, accreditation and entrance exams.",
};

export default function Page() {
  return <CompareExplorer />;
}