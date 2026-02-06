// import { describe, it, expect } from 'vitest'; // Jest provides globals
import { mergeDataWithDefaults, DEFAULT_VALUES } from '../lib/simulationDefaults';

// Mock functionality for "prepareFormValues" as requested by user logic
// The user's requested logic is implemented in mergeDataWithDefaults

describe('Smart Fallback Logic (The "Brain")', () => {

    it('Scenario A: Data Found (RNIC 49 - Hypothetical)', () => {
        const apiData = {
            address: '10 Rue des Fleurs, Angers',
            total_units: 50,
            living_area: 3000,
            dpe_label: 'D',
            syndic_name: 'Syndic Poudlard'
        };

        const result = mergeDataWithDefaults(apiData as any);

        expect(result.numberOfLots).toBe(50);
        expect(result.totalSurface).toBe(3000);
        expect(result.currentDpe).toBe('D');
        // Budget should be auto-calculated if surface is present
        expect(result.workBudget).toBe(3000 * DEFAULT_VALUES.renoCostPerSqm);
    });

    it('Scenario B: Data Not Found (12 Rue de la Paix, Paris)', () => {
        // "Si pas de résultat, l'API renvoie null"
        const apiData = null;

        const result = mergeDataWithDefaults(apiData);

        // 1. Lots should be null/empty -> Force entry
        expect(result.numberOfLots).toBeNull();

        // 2. Surface should be empty if lots are empty
        expect(result.totalSurface).toBe(0);

        // 3. DPE should default to 'F'
        expect(result.currentDpe).toBe('F');

        // 4. Target DPE should be 'C'
        expect(result.targetDpe).toBe('C');

        // 5. Budget should be 0 (since surface is 0)
        expect(result.workBudget).toBe(0);
    });

    it('Scenario C: Partial Data (Lots found, Surface missing)', () => {
        const apiData = {
            total_units: 10,
            dpe_label: 'E'
        };

        const result = mergeDataWithDefaults(apiData as any);

        expect(result.numberOfLots).toBe(10);
        // Surface estimated: 10 * 62 = 620
        expect(result.totalSurface).toBe(10 * 62);
        // Budget relative to estimated surface
        expect(result.workBudget).toBe(620 * 350);
    });

});
