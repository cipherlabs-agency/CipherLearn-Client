import { BlockDefinition, BlockType } from "./types";
import { HeroBlockComponent, HeroBlockSettings } from "./blocks/HeroBlock";
import { FeaturesBlockComponent, FeaturesBlockSettings } from "./blocks/FeaturesBlock";
import { PricingBlockComponent, PricingBlockSettings } from "./blocks/PricingBlock";
import { CurriculumBlockComponent, CurriculumBlockSettings } from "./blocks/CurriculumBlock";
import { FAQBlockComponent, FAQBlockSettings } from "./blocks/FAQBlock";
import { InstructorBlockComponent, InstructorBlockSettings } from "./blocks/InstructorBlock";
import { TestimonialsBlockComponent, TestimonialsBlockSettings } from "./blocks/TestimonialsBlock";
import { RichTextBlockComponent, RichTextBlockSettings } from "./blocks/RichTextBlock";
import { StatsBlockComponent, StatsBlockSettings } from "./blocks/StatsBlock";
import { TrustBlockComponent, TrustBlockSettings } from "./blocks/TrustBlock";
import { LayoutTemplate, ListChecks, IndianRupee, GraduationCap, HelpCircle, User, MessageSquareHeart, AlignLeft, BarChart3, ShieldCheck } from "lucide-react";

export const blockRegistry: Record<BlockType, BlockDefinition | any> = {
  hero: {
    type: "hero",
    name: "Hero Section",
    description: "Main landing page header with a clear call-to-action.",
    icon: LayoutTemplate,
    defaultContent: {
      title: "Master Competitive Mathematics",
      subtitle: "A rigorous ground-up approach to infinitesimal calculus without rote formulas, completely from first principles.",
      ctaText: "Enroll Now"
    },
    defaultStyles: {},
    component: HeroBlockComponent,
    settingsComponent: HeroBlockSettings
  },
  features: {
    type: "features",
    name: "Features Grid",
    description: "Highlight key benefits with a clean 3-column layout.",
    icon: ListChecks,
    defaultContent: {
      title: "Why Choose Our Methodology?"
    },
    defaultStyles: {},
    component: FeaturesBlockComponent,
    settingsComponent: FeaturesBlockSettings
  },
  pricing: {
    type: "pricing",
    name: "Pricing Cards",
    description: "Auto-syncs with PostgreSQL FeeStructures.",
    icon: IndianRupee,
    defaultContent: {
      title: "Transparent Investment",
      subtitle: "No hidden fees. Select the structure that best fits your preparation intensity.",
      autoSync: true
    },
    defaultStyles: {},
    component: PricingBlockComponent,
    settingsComponent: PricingBlockSettings
  },
  curriculum: {
    type: "curriculum",
    name: "Course Syllabus",
    description: "Auto-syncs with PostgreSQL Lectures.",
    icon: GraduationCap,
    defaultContent: {
      title: "Course Syllabus",
      autoSync: true
    },
    defaultStyles: {},
    component: CurriculumBlockComponent,
    settingsComponent: CurriculumBlockSettings
  },
  faq: {
    type: "faq",
    name: "FAQ Section",
    description: "Common questions in a collapsible accordion.",
    icon: HelpCircle,
    defaultContent: {
      title: "Common Questions"
    },
    defaultStyles: {},
    component: FAQBlockComponent,
    settingsComponent: FAQBlockSettings
  },
  instructor: {
    type: "instructor",
    name: "Instructor Profile",
    description: "Auto-syncs with Postgres Teacher Profiles.",
    icon: User,
    defaultContent: {
      autoSync: true
    },
    defaultStyles: {},
    component: InstructorBlockComponent,
    settingsComponent: InstructorBlockSettings
  },
  testimonials: {
    type: "testimonials",
    name: "Testimonials",
    description: "Student success stories and reviews.",
    icon: MessageSquareHeart,
    defaultContent: {
      title: "Student Success"
    },
    defaultStyles: {},
    component: TestimonialsBlockComponent,
    settingsComponent: TestimonialsBlockSettings
  },
  "rich-text": {
    type: "rich-text",
    name: "Rich Text",
    description: "Standard text editor block for long-form content.",
    icon: AlignLeft,
    defaultContent: {
      content: "<h2>Program Methodology</h2><p>Our curriculum is built entirely around <strong>first-principles thinking</strong>.</p>"
    },
    defaultStyles: {},
    component: RichTextBlockComponent,
    settingsComponent: RichTextBlockSettings
  },
  stats: {
    type: "stats",
    name: "Animated Stats",
    description: "High-performance count-up metrics for social proof.",
    icon: BarChart3,
    defaultContent: {
      title: "Our Impact at a Glance"
    },
    defaultStyles: {},
    component: StatsBlockComponent,
    settingsComponent: StatsBlockSettings
  },
  trust: {
    type: "trust",
    name: "Trust Bar",
    description: "Logo carousel for institutional credibility.",
    icon: ShieldCheck,
    defaultContent: {},
    defaultStyles: {},
    component: TrustBlockComponent,
    settingsComponent: TrustBlockSettings
  }
};

export function getBlockDefinition(type: BlockType): BlockDefinition | null {
  return blockRegistry[type] || null;
}
