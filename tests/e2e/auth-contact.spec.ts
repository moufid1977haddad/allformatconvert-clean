import { test, expect } from '@playwright/test';

const PASSWORD = 'TestPassword123!';

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 10000)}@onlineconvertools.com`;
}

test.describe('Sign up', () => {
  test('creates an account and prompts the visitor to confirm their email', async ({ page }) => {
    const email = uniqueEmail('signup');
    await page.goto('/signup');

    await page.fill('input[name="name"]', 'E2E Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.fill('input[name="confirm"]', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText('Account created!')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole('button', { name: /resend it/i })).toBeVisible();
  });

  test('rejects mismatched passwords before contacting the server', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="name"]', 'E2E Test');
    await page.fill('input[name="email"]', uniqueEmail('mismatch'));
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirm"]', 'Password456!');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });
});

test.describe('Sign in', () => {
  test('blocks sign-in for an unconfirmed account and offers to resend the confirmation email', async ({ page }) => {
    const email = uniqueEmail('unconfirmed');

    await page.goto('/signup');
    await page.fill('input[name="name"]', 'E2E Test');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', PASSWORD);
    await page.fill('input[name="confirm"]', PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page.getByText('Account created!')).toBeVisible({ timeout: 15000 });

    await page.goto('/signin');
    await page.fill('#signin-email', email);
    await page.fill('#signin-password', PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/not confirmed yet/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /resend confirmation email/i })).toBeVisible();
  });

  test('shows a clear error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');
    await page.fill('#signin-email', uniqueEmail('no-such-user'));
    await page.fill('#signin-password', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    const errorBox = page.locator('.bg-red-50');
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    await expect(errorBox).not.toContainText('Failed to fetch');
  });
});

test.describe('Contact', () => {
  test('submits the contact form successfully', async ({ page }) => {
    await page.goto('/contact');

    await page.fill('input[name="name"]', 'E2E Test');
    await page.fill('input[name="email"]', uniqueEmail('contact'));
    await page.selectOption('select[name="subject"]', 'question');
    await page.fill('textarea[name="message"]', 'This is an automated end-to-end test message.');
    await page.check('#agree');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Message sent!')).toBeVisible({ timeout: 15000 });
  });
});
