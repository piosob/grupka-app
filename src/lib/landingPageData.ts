import type {
    HeroContent,
    CTAButton,
    FeatureItem,
    TimelineStep,
    EventPreview,
    ContactInfo,
    HiddenComment,
} from '../types/landingPage';

export const heroContent: HeroContent = {
    title: 'Witaj rodzicu! Zorganizuj grupę z Grupka.',
    subtitle: 'Uprość komunikację o urodzinach i prezentach.',
    description:
        'Mobile-first, prywatność, asynchroniczna komunikacja i pomoc AI. Grupka to narzędzie dla współczesnych rodziców.',
    ctaButtons: [
        { label: 'Zaloguj się', href: '/login' },
        { label: 'Załóż konto', href: '/register', variant: 'secondary' },
    ],
};

export const features: FeatureItem[] = [
    {
        title: 'Mobile-first hub',
        description:
            'Dostęp do wszystkich informacji o grupie zawsze pod ręką, na każdym urządzeniu.',
        accent: '📱',
    },
    {
        title: 'Ograniczone powiadomienia',
        description:
            'Ważne informacje docierają do Ciebie tylko wtedy, gdy jest to naprawdę istotne.',
        accent: '🔕',
    },
    {
        title: 'Prywatność przede wszystkim',
        description: 'Dziel się tylko tym, co chcesz. Bez imion i zbędnych danych osobowych.',
        accent: '🔒',
    },
    {
        title: 'AI magic wand',
        description:
            'Tworzenie list prezentów nigdy nie było tak proste i przyjemne. Nasz asystent AI Ci pomoże.',
        accent: '✨',
    },
    {
        title: 'Ukryte wątki gości',
        description: 'Dyskutuj o prezentach w spokoju, z dala od ciekawskich oczu dzieci.',
        accent: '🕵️‍♀️',
    },
];

export const howItWorksSteps: TimelineStep[] = [
    {
        id: 1,
        title: 'Bezpieczne logowanie i tworzenie grupy',
        description:
            'Zaloguj się bezpiecznie i stwórz swoją pierwszą grupę. Wszystkie Twoje dane są chronione.',
        hint: 'Krok 1',
    },
    {
        id: 2,
        title: 'Zaproszenia z kodem 60 min',
        description:
            'Wygeneruj tymczasowy kod zaproszenia, ważny tylko 60 minut, aby zaprosić innych rodziców.',
        hint: 'Krok 2',
    },
    {
        id: 3,
        title: 'AI Magic Wand w akcji',
        description:
            'Skorzystaj z AI do stworzenia idealnej listy prezentów, uwzględniając preferencje i budżet.',
        hint: 'Krok 3',
    },
];

export const hiddenComments: HiddenComment[] = [
    {
        authorLabel: 'Rodzic Ania',
        text: 'Może byśmy się zrzucili na jakąś większą zabawkę edukacyjną?',
    },
    { authorLabel: 'Rodzic Tomek', text: 'Świetny pomysł! Janek wspominał o klockach LEGO Duplo.' },
    { authorLabel: 'Rodzic Kasia', text: 'Ja mogę zamówić tort. Ktoś ma preferencje smakowe?' },
];

export const eventPreview: EventPreview = {
    title: 'Urodziny Janka', // Example title
    // dateLabel: '15.01.2026', // Example date
    dateLabel: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL'),
    summary: 'Janek kończy 5 lat i marzy o nowych klockach. Zapraszamy do wspólnego świętowania!',
    hiddenThreadLabel: 'Ukryty wątek gości',
    comments: hiddenComments,
};

export const ctaSectionButtons: CTAButton[] = [
    { label: 'Zaloguj się', href: '/login' },
    { label: 'Utwórz konto', href: '/register', variant: 'secondary' },
];

export const footerContact: ContactInfo = {
    label: 'Potrzebujesz pomocy?',
    email: 'admin@grupka.app',
    note: 'Nasz zespół wsparcia jest do Twojej dyspozycji.',
};
