import { test, expect } from '@playwright/test';

test('landing page has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Note: Adjust this based on your actual site title
  await expect(page).toHaveTitle(/Grupka/);
});

test('get started link', async ({ page }) => {
  await page.goto('/');

  // Click the get started link (if it exists)
  const getStarted = page.getByRole('link', { name: /Zacznij teraz|Dołącz/i }).first();
  
  if (await getStarted.isVisible()) {
    await getStarted.click();
    // Expects page to have a specific URL (e.g. login or register)
    await expect(page).toHaveURL(/.*(login|register|dashboard)/);
  }
});
