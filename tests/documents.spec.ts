import { test, expect } from '@playwright/test';

test.describe('Document Generation', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate and submit form to get results
        await page.goto('/');
        await page.locator('button:has-text("📋 Charger un exemple")').click();
        await page.locator('button[type="submit"]').click();
        await expect(page.locator('#results')).toBeVisible({ timeout: 15000 });
        // Wait for results to fully load
        await expect(page.locator('text=Plan de Financement').first()).toBeVisible({ timeout: 15000 });
    });

    test('PDF Download Button is present', async ({ page }) => {
        // Le bouton PDF utilise le texte "Telecharger le Rapport" (sans accent)
        // Il est lazy-loaded donc on attend qu'il soit visible
        const pdfBtn = page.locator('a, button').filter({ hasText: /T[ée]l[ée]charger.*Rapport/i });
        await expect(pdfBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('PPTX Download Button is present', async ({ page }) => {
        // Le bouton PowerPoint contient "PowerPoint AG"
        // Il est lazy-loaded avec un état de chargement
        const pptxBtn = page.locator('button').filter({ hasText: /PowerPoint AG/i });
        await expect(pptxBtn.first()).toBeVisible({ timeout: 10000 });
    });

    test('Convocation Download Button is present', async ({ page }) => {
        // Le bouton contient "Projet de Résolution"
        // Il est lazy-loaded
        const convocBtn = page.locator('button, a').filter({ hasText: /Projet de R[ée]solution/i });
        await expect(convocBtn.first()).toBeVisible({ timeout: 10000 });
    });

});
