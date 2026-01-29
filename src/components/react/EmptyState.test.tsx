import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { EmptyState } from './EmptyState';
import { Plus } from 'lucide-react';

test('EmptyState renders title and description', () => {
  render(
    <EmptyState 
      title="Brak grup" 
      description="Nie należysz jeszcze do żadnej grupy." 
    />
  );

  expect(screen.getByText('Brak grup')).toBeInTheDocument();
  expect(screen.getByText('Nie należysz jeszcze do żadnej grupy.')).toBeInTheDocument();
});

test('EmptyState calls onAction when button is clicked', () => {
  const onAction = vi.fn();
  render(
    <EmptyState 
      title="Brak grup" 
      description="Opis" 
      actionLabel="Stwórz grupę" 
      onAction={onAction} 
    />
  );

  const button = screen.getByText('Stwórz grupę');
  fireEvent.click(button);

  expect(onAction).toHaveBeenCalledTimes(1);
});

test('EmptyState renders custom icon', () => {
  render(
    <EmptyState 
      title="Test Title" 
      description="Test Description" 
      icon={Plus}
    />
  );
  
  expect(screen.getByText('Test Title')).toBeInTheDocument();
  expect(screen.getByText('Test Description')).toBeInTheDocument();
});
