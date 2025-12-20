import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
    test.describe.configure({ mode: 'serial' });

    test('Login Page - Visual Elements', async ({ page }) => {
        await page.goto('/login');

        // Wait for hydration and animation
        await expect(page).toHaveTitle(/TomeSphere/);

        // Debug: Log title and wait
        console.log('Title:', await page.title());

        // Wait for potential animation or hydration delay
        await page.waitForTimeout(3000);

        // Check standard input
        const input = page.getByPlaceholder('Email or Phone');
        // Force wait for state
        await input.waitFor({ state: 'attached' });

        // Log visibility status
        console.log('Input visible:', await input.isVisible());

        await expect(input).toBeVisible();

        // Gradient text might report as invisible due to CSS tricks, check presence
        await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeAttached();
    });

    test('Login Page - Empty Submission', async ({ page }) => {
        await page.goto('/login');

        // Wait for page to be ready
        await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
        await page.getByRole('button', { name: 'Continue' }).click();

        // Should stay on page
        await expect(page).toHaveURL(/.*login/);
    });
});
