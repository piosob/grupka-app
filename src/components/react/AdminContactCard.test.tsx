import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi, beforeEach } from 'vitest';
import { AdminContactCard } from './AdminContactCard';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
    mockFetch.mockClear();
});

test('AdminContactCard shows admin email after clicking "Pokaż kontakt"', async () => {
    const adminName = 'Anna';
    const groupId = 'test-group-id';
    const mockAdminData = {
        data: {
            userId: 'user-123',
            firstName: 'Anna',
            email: 'anna.admin@example.com',
            childrenNames: ['Staś']
        }
    };

    mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAdminData,
    });

    render(<AdminContactCard adminName={adminName} groupId={groupId} />);

    // Check if initial state is correct (email not visible)
    expect(screen.queryByText('anna.admin@example.com')).not.toBeInTheDocument();

    // Click "Pokaż kontakt" button
    const showButton = screen.getByText(/pokaż kontakt/i);
    fireEvent.click(showButton);

    // Wait for the email to appear in the dialog
    await waitFor(() => {
        expect(screen.getByText('anna.admin@example.com')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Verify fetch was called with correct URL
    expect(mockFetch).toHaveBeenCalledWith(`/api/groups/${groupId}/members/admin-contact`);
});

test('AdminContactCard shows error message when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Błąd pobierania' } }),
    });

    render(<AdminContactCard adminName="Anna" groupId="test-group" />);

    const showButton = screen.getByText(/pokaż kontakt/i);
    fireEvent.click(showButton);

    await waitFor(() => {
        expect(screen.getByText('Błąd pobierania')).toBeInTheDocument();
    });
});
