import { test, expect, Page } from '@playwright/test';

const demoEmail = process.env.E2E_TEST_EMAIL || 'demo@devpulse.io';
const demoPassword = process.env.E2E_TEST_PASSWORD || 'password123';

async function signIn(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(demoEmail);
  await page.locator('input[type="password"]').fill(demoPassword);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe('public application flow', () => {
  test('loads the landing page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/DevPulse/i);
    await expect(page.getByRole('heading', { name: /Understand failed builds faster/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Get Started Free/i })).toHaveAttribute('href', '/register');
  });

  test('renders the login form and browser validation', async ({ page }) => {
    await page.goto('/login');

    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');
    await expect(page.getByRole('heading', { name: /Sign in to DevPulse/i })).toBeVisible();
    await email.fill('');
    await password.fill('');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(email).toHaveJSProperty('validity.valid', false);
    await expect(password).toHaveJSProperty('validity.valid', false);
  });

  test('shows the backend error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('invalid-e2e-user@example.com');
    await page.locator('input[type="password"]').fill('definitely-not-valid');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Invalid email or password')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('authenticated monitoring flow', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('loads the dashboard with seeded project and build information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Engineering Dashboard' })).toBeVisible();
    await expect(page.getByText('Connected Repositories')).toBeVisible();
    await expect(page.getByText('production-api', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Build Execution History')).toBeVisible();
    await expect(page.getByText('FAILED').first()).toBeVisible();
  });

  test('opens failed build logs and the stored AI diagnostic report', async ({ page }) => {
    const failedBuildRow = page.locator('tbody tr').filter({ hasText: 'FAILED' }).first();
    await expect(failedBuildRow).toBeVisible();
    await failedBuildRow.getByRole('link', { name: 'View Logs' }).click();

    await expect(page).toHaveURL(/\/builds\//);
    await expect(page.getByRole('heading', { name: /Build #/ })).toBeVisible();
    await expect(page.getByText('AI BUILD DIAGNOSTIC REPORT')).toBeVisible();
    await expect(page.getByText('Missing required environment variable DATABASE_URL')).toBeVisible();
    await expect(page.getByText('DATABASE_URL', { exact: false }).last()).toBeVisible();
  });

  test('redirects unauthenticated users away from protected routes', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('devpulse_token');
      localStorage.removeItem('devpulse_user');
    });
    await page.goto('/dashboard');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Sign in to DevPulse/i })).toBeVisible();
  });
});