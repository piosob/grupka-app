import { useState, useEffect, useCallback } from 'react';

export interface CountdownResult {
    remainingSeconds: number;
    isExpired: boolean;
    countdownText: string;
    countdownColor: 'green' | 'yellow' | 'red';
}

/**
 * Hook to manage dynamic countdown for a given expiration date.
 * Updates every second.
 */
export const useCountdown = (expiresAt: string): CountdownResult => {
    const calculateTimeLeft = useCallback((): CountdownResult => {
        const expirationDate = new Date(expiresAt).getTime();
        const now = new Date().getTime();
        const difference = expirationDate - now;

        if (difference <= 0) {
            return {
                remainingSeconds: 0,
                isExpired: true,
                countdownText: 'Wygasł',
                countdownColor: 'red',
            };
        }

        const remainingSeconds = Math.floor(difference / 1000);
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;

        let countdownColor: 'green' | 'yellow' | 'red' = 'green';
        if (minutes < 10) {
            countdownColor = 'red';
        } else if (minutes < 30) {
            countdownColor = 'yellow';
        }

        const countdownText = `Wygasa za: ${minutes} min ${seconds} sek`;

        return {
            remainingSeconds,
            isExpired: false,
            countdownText,
            countdownColor,
        };
    }, [expiresAt]);

    const [countdown, setCountdown] = useState<CountdownResult>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            const result = calculateTimeLeft();
            setCountdown(result);
            if (result.isExpired) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [calculateTimeLeft]);

    return countdown;
};
