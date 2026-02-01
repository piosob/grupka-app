import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { LoginForm } from './LoginForm';

// Mock Astro navigation
vi.mock('astro:transitions/client', () => ({
    navigate: vi.fn(),
}));

test('LoginForm displays validation error for invalid email format', async () => {
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    
    // Trigger validation
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
        expect(screen.getByText(/nieprawidłowy format adresu email/i)).toBeInTheDocument();
    });
});

test('Login button is disabled when form is empty', () => {
    render(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /zaloguj się/i });
    
    expect(submitButton).toBeDisabled();
});

test('LoginForm displays error message when passed via props', () => {
    const errorMessage = 'Błędne poświadczenia';
    render(<LoginForm error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
});
