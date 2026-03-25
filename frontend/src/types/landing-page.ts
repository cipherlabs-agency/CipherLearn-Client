// ============================================
// Landing Page Builder Types
// ============================================

/**
 * All available block types for the page builder.
 * Each maps to a specific React component in blockRegistry.
 */
export type BlockType =
    | 'HERO'
    | 'FEATURES'
    | 'CURRICULUM'
    | 'TESTIMONIALS'
    | 'PRICING'
    | 'FAQ'
    | 'INSTRUCTOR'
    | 'IMAGE'
    | 'TEXT'
    | 'STATS'
    | 'CONTACT'
    | 'FOOTER'
    | 'SPACER';

export type PageStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

// ============================================
// Theme Types
// ============================================

export interface PageTheme {
    /** Google Font family for headings */
    headingFont: string;
    /** Google Font family for body text */
    bodyFont: string;
    /** Primary brand color (hex) */
    primaryColor: string;
    /** Accent color for CTAs and highlights (hex) */
    accentColor: string;
    /** Background color (hex) */
    backgroundColor: string;
    /** Text color (hex) */
    textColor: string;
    /** Border radius in px */
    borderRadius: number;
    /** Base spacing multiplier */
    spacingScale: number;
}

export const DEFAULT_THEME: PageTheme = {
    headingFont: 'DM Serif Display',
    bodyFont: 'Plus Jakarta Sans',
    primaryColor: '#0F766E',
    accentColor: '#F59E0B',
    backgroundColor: '#FAFAF9',
    textColor: '#1C1917',
    borderRadius: 12,
    spacingScale: 1,
};

// ============================================
// Block Props (per block type)
// ============================================

export interface HeroBlockProps {
    heading: string;
    subheading: string;
    ctaText: string;
    ctaLink: string;
    alignment: 'left' | 'center' | 'right';
    backgroundImage: string;
    overlayOpacity: number;
    gradientFrom: string;
    gradientTo: string;
    useGradient: boolean;
}

export interface FeatureItem {
    icon: string;
    title: string;
    description: string;
}

export interface FeaturesBlockProps {
    heading: string;
    subheading: string;
    columns: 2 | 3 | 4;
    items: FeatureItem[];
}

export interface CurriculumModule {
    title: string;
    lessons: string[];
}

export interface CurriculumBlockProps {
    heading: string;
    subheading: string;
    modules: CurriculumModule[];
}

export interface TestimonialItem {
    quote: string;
    name: string;
    role: string;
    avatar: string;
}

export interface TestimonialsBlockProps {
    heading: string;
    subheading: string;
    items: TestimonialItem[];
    layout: 'grid' | 'carousel';
}

export interface PricingFeature {
    text: string;
    included: boolean;
}

export interface PricingTier {
    name: string;
    price: string;
    period: string;
    description: string;
    features: PricingFeature[];
    ctaText: string;
    ctaLink: string;
    highlighted: boolean;
}

export interface PricingBlockProps {
    heading: string;
    subheading: string;
    tiers: PricingTier[];
}

export interface FaqItem {
    question: string;
    answer: string;
}

export interface FaqBlockProps {
    heading: string;
    subheading: string;
    items: FaqItem[];
}

export interface InstructorBlockProps {
    name: string;
    title: string;
    bio: string;
    avatar: string;
    socialLinks: { platform: string; url: string }[];
}

export interface ImageBlockProps {
    src: string;
    alt: string;
    caption: string;
    fullWidth: boolean;
    aspectRatio: 'auto' | '16:9' | '4:3' | '1:1';
}

export interface TextBlockProps {
    heading: string;
    body: string;
    alignment: 'left' | 'center' | 'right';
}

export interface StatItem {
    value: string;
    label: string;
    suffix: string;
}

export interface StatsBlockProps {
    heading: string;
    items: StatItem[];
    backgroundColor: string;
}

export interface ContactBlockProps {
    heading: string;
    subheading: string;
    email: string;
    phone: string;
    whatsapp: string;
    showForm: boolean;
}

export interface FooterBlockProps {
    brandName: string;
    tagline: string;
    links: { label: string; url: string }[];
    copyright: string;
}

export interface SpacerBlockProps {
    height: number;
}

/**
 * Union of all block prop types for type-safe access.
 */
export type BlockProps =
    | HeroBlockProps
    | FeaturesBlockProps
    | CurriculumBlockProps
    | TestimonialsBlockProps
    | PricingBlockProps
    | FaqBlockProps
    | InstructorBlockProps
    | ImageBlockProps
    | TextBlockProps
    | StatsBlockProps
    | ContactBlockProps
    | FooterBlockProps
    | SpacerBlockProps;

// ============================================
// Core Entities
// ============================================

/**
 * A single block within a landing page.
 */
export interface PageBlock {
    /** Unique block instance ID (uuid) */
    id: string;
    /** Block type from registry */
    type: BlockType;
    /** Block-specific props */
    props: BlockProps;
    /** Sort order (0-based) */
    order: number;
}

/**
 * A complete landing page.
 */
export interface LandingPage {
    /** Unique page ID */
    id: string;
    /** Page title (shown in admin list) */
    title: string;
    /** URL slug for public access */
    slug: string;
    /** Current status */
    status: PageStatus;
    /** Ordered list of page blocks */
    blocks: PageBlock[];
    /** Page-level theme configuration */
    theme: PageTheme;
    /** SEO meta description */
    metaDescription: string;
    /** Creation timestamp */
    createdAt: string;
    /** Last update timestamp */
    updatedAt: string;
}

// ============================================
// API Input Types
// ============================================

export interface CreateLandingPageInput {
    title: string;
    slug?: string;
}

export interface UpdateLandingPageInput {
    id: string;
    title?: string;
    slug?: string;
    status?: PageStatus;
    blocks?: PageBlock[];
    theme?: PageTheme;
    metaDescription?: string;
}
