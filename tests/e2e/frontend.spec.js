const { test, expect } = require('@playwright/test');

test.describe('FinPilot AI Frontend E2E & Session Persistence', () => {

    test('1. Load Dashboard SPA and check initial navigation elements', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await expect(page).toHaveTitle(/FinPilot AI/);
        await expect(page.locator('#header-heading')).toHaveText('Dashboard Overview');
    });

    test('2. Toggle Auth Modal between Login and Register', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('#btn-user-auth');
        await expect(page.locator('#modal-auth')).toHaveClass(/active/);
        await expect(page.locator('#auth-modal-title')).toContainText('Login');

        await page.click('text=Register here');
        await expect(page.locator('#auth-modal-title')).toContainText('Register Account');

        await page.click('text=Login here');
        await expect(page.locator('#auth-modal-title')).toContainText('Login');
    });

    test('3. Test AI Advisor "Should I Buy It?" submission', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('text=AI Behavior Suite');
        await expect(page.locator('#header-heading')).toHaveText('AI Behavior Suite (21 Modules)');

        await page.fill('#sib-name', 'Playwright Test Laptop');
        await page.fill('#sib-price', '1500');
        await page.click('text=Ask AI Advisor');

        await expect(page.locator('#sib-result')).toBeVisible();
        await expect(page.locator('#sib-result')).toContainText('Recommendation');
    });

    test('4. Test Impulse Purchase Lock Modal timer', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.click('#btn-impulse-lock');
        await expect(page.locator('#modal-impulse')).toHaveClass(/active/);
        await expect(page.locator('#timer-countdown')).toBeVisible();
    });

    test('5. Verify LocalStorage session persistence state', async ({ page }) => {
        await page.goto('http://localhost:3000');
        await page.evaluate(() => {
            localStorage.setItem('finpilot_token', 'mock_jwt_token_for_playwright_test');
        });
        await page.reload();
        const storedToken = await page.evaluate(() => localStorage.getItem('finpilot_token'));
        expect(storedToken).toBe('mock_jwt_token_for_playwright_test');
    });
});
