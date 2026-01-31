import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    cn,
    calculateAge,
    formatBirthDate,
    stringToColor,
    getInitials,
    getInputClasses,
} from './utils';

describe('utils.ts', () => {
    describe('cn', () => {
        it('should merge tailwind classes correctly', () => {
            expect(cn('bg-red-500', 'p-4')).toBe('bg-red-500 p-4');
            expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
            expect(cn('p-4', undefined, 'm-2', null, false, 'text-white')).toBe(
                'p-4 m-2 text-white'
            );
        });
    });

    describe('calculateAge', () => {
        beforeEach(() => {
            // Set "now" to 2026-01-29 for deterministic tests
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-01-29'));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return null if birthDate is missing or empty', () => {
            expect(calculateAge(null)).toBeNull();
            expect(calculateAge('')).toBeNull();
        });

        it('should return null if year is 1000 (unknown year)', () => {
            expect(calculateAge('1000-05-15')).toBeNull();
        });

        it('should return "1 rok" for exactly one year old', () => {
            expect(calculateAge('2025-01-29')).toBe('1 rok');
        });

        it('should return "X lata" for ages 2, 3, 4', () => {
            expect(calculateAge('2024-01-29')).toBe('2 lata');
            expect(calculateAge('2023-01-29')).toBe('3 lata');
            expect(calculateAge('2022-01-29')).toBe('4 lata');
        });

        it('should return "X lat" for ages 5 and above', () => {
            expect(calculateAge('2021-01-29')).toBe('5 lat');
            expect(calculateAge('2016-01-29')).toBe('10 lat');
            expect(calculateAge('2014-01-29')).toBe('12 lat');
        });

        it('should correctly handle birthdays that have not occurred yet this year', () => {
            // Current date is 2026-01-29
            // Born 2024-02-01 -> should be 1 year old (not 2 yet)
            expect(calculateAge('2024-02-01')).toBe('1 rok');
            
            // Born 2021-02-01 -> should be 4 years old (not 5 yet)
            expect(calculateAge('2021-02-01')).toBe('4 lata');
        });
    });

    describe('formatBirthDate', () => {
        it('should return null if birthDate is missing', () => {
            expect(formatBirthDate(null)).toBeNull();
        });

        it('should return only DD.MM if year is 1000', () => {
            expect(formatBirthDate('1000-12-24')).toBe('24.12');
            expect(formatBirthDate('1000-01-01')).toBe('01.01');
        });

        it('should return DD.MM.YYYY for normal years', () => {
            expect(formatBirthDate('2020-05-15')).toBe('15.05.2020');
            expect(formatBirthDate('1990-01-01')).toBe('01.01.1990');
        });
    });

    describe('stringToColor', () => {
        it('should return a valid hex color string', () => {
            const color = stringToColor('Grupka');
            expect(color).toMatch(/^#[0-9A-F]{6}$/);
        });

        it('should return the same color for the same string', () => {
            expect(stringToColor('Test')).toBe(stringToColor('Test'));
        });

        it('should return different colors for different strings', () => {
            expect(stringToColor('User1')).not.toBe(stringToColor('User2'));
        });
    });

    describe('getInitials', () => {
        it('should return initials from full name', () => {
            expect(getInitials('Anna Nowak')).toBe('AN');
            expect(getInitials('Jan Maria Rokita')).toBe('JM');
        });

        it('should handle single name', () => {
            expect(getInitials('Anna')).toBe('A');
        });

        it('should return uppercase initials', () => {
            expect(getInitials('jan kowalski')).toBe('JK');
        });

        it('should return at most 2 characters', () => {
            expect(getInitials('Jan Sebastian Bach')).toBe('JS');
        });
    });

    describe('getInputClasses', () => {
        it('should return base classes when no error is present', () => {
            const classes = getInputClasses(undefined);
            expect(classes).toContain('h-12');
            expect(classes).toContain('rounded-xl');
            expect(classes).not.toContain('border-destructive');
        });

        it('should return error classes when error is present', () => {
            const classes = getInputClasses({ message: 'Error' });
            expect(classes).toContain('border-destructive');
            expect(classes).toContain('ring-destructive');
        });
    });
});
