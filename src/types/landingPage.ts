// ============================================================================
// Landing Page Types
// ============================================================================

export type CTAButton = {
    label: string;
    href: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
};

export type HeroContent = {
    title: string;
    subtitle: string;
    description: string;
    ctaButtons: CTAButton[];
};

export type FeatureItem = {
    title: string;
    description: string;
    accent?: string;
};

export type TimelineStep = {
    id: number;
    title: string;
    description: string;
    statusBadge?: string;
    hint?: string;
};

export type HiddenComment = {
    authorLabel: string;
    text: string;
};

export type EventPreview = {
    title: string;
    dateLabel: string;
    summary: string;
    hiddenThreadLabel: string;
    comments: HiddenComment[];
};

export type ContactInfo = {
    label: string;
    email: string;
    note: string;
};

export type LandingPageProps = {
    hero: HeroContent;
    features: FeatureItem[];
    steps: TimelineStep[];
    event: EventPreview;
    contact: ContactInfo;
    ctaButtons: CTAButton[];
};
