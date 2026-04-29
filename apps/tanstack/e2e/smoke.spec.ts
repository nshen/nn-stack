import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
	test('homepage loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/nn-stack/i);
	});
});
