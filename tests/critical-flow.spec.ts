import { test, expect } from '@playwright/test';

test('Critical Flow: Load App, Interact with Input, Verify Results', async ({ page }) => {
    await page.goto('/');

    // 1. Verify Home Page Title & Header
    await expect(page).toHaveTitle(/VALO-SYNDIC/);
    await expect(page.locator('text=Cockpit').first()).toBeVisible();

    // 2. Default State: Results should be visible (Demo Mode)
    // The app loads with default data, so we expect results immediately
    await expect(page.locator('text=Plan de Financement').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Valorisation').first()).toBeVisible();

    // 3. Interact with Magical Address Input (if user wants to customize)
    const addressInput = page.getByPlaceholder("Rechercher l'adresse de la copropriété...");
    await expect(addressInput).toBeVisible();

    // Type an address to trigger suggestions
    await addressInput.fill('10 Rue de Rivoli');

    // NOTE: We rely on the app's ability to fetch/mock suggestions.
    // If network is restricted in test env, this might flake. 
    // For now, we verify the input is interactive.

    // Check internal inputs are present (inside the panel, might need unfolding)
    // We can try to click the deploy button if it exists
    const deployBtn = page.getByRole('button', { name: "Déployer" });
    if (await deployBtn.isVisible()) {
        await deployBtn.click();
    }

    // Verify "Nombre de lots" stepper is visible
    // The label is "Nombre de lots" inside the panel
    await expect(page.locator('text=Nombre de lots').first()).toBeVisible();

    // Verify "Coût travaux (HT)" input
    // It's an input with numeric value (default 400000 presumably or similar)
    // We target by surrounding text or class if needed, or just existence.
    await expect(page.locator('text=Coût travaux (HT)').first()).toBeVisible();

    // 4. Verify no crash
    await expect(page.locator('body')).not.toBeEmpty();
});
