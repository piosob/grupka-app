import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Calculates age based on birth date.
 * Returns string like "3 lata" or "5 lat".
 */
export function calculateAge(birthDate: string | null): string | null {
    if (!birthDate) return null;

    const birth = new Date(birthDate);
    // Sentinel year 1000 means year is unknown
    if (birth.getFullYear() <= 1000) return null;

    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        years--;
    }

    if (years === 1) return '1 rok';
    if (years >= 2 && years <= 4) return `${years} lata`;
    return `${years} lat`;
}

/**
 * Formats birth date for display.
 * If the year is 1000 (sentinel for unknown year), it returns only DD.MM.
 * Otherwise returns full date DD.MM.YYYY.
 */
export function formatBirthDate(birthDate: string | null): string | null {
    if (!birthDate) return null;

    const [year, month, day] = birthDate.split('-');

    if (year === '1000') {
        return `${day}.${month}`;
    }

    return `${day}.${month}.${year}`;
}

/**
 * Generates a color hash from a string.
 */
export function stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00ffffff).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
}

/**
 * Gets initials from a display name.
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}
