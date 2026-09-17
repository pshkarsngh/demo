import { HeroSection } from "@/components/home/hero/HeroSection";
import { ExploreCategory } from "@/components/home/ExploreCategory";
import { FeaturedCollegesSection } from "@/components/home/FeaturedCollegesSection";
import { QuizBanner } from "@/components/home/QuizBanner";
import { WhyChooseSection } from "@/components/home/WhyChooseSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { StudentTestimonials } from "@/components/home/StudentTestimonials";
import { StayUpdatedBanner } from "@/components/home/StayUpdatedBanner";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ExploreCategory />
      <FeaturedCollegesSection />
      <QuizBanner />
      <WhyChooseSection />
      <HowItWorksSection />
      <StudentTestimonials />
      <StayUpdatedBanner />
    </>
  );
}