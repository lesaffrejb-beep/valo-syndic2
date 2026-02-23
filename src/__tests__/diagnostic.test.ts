import { simulateFinancing } from '../lib/calculator';

describe('Déficit Foncier & AMO Subvention Rules (Loi de Finances 2026)', () => {

    it('should apply the standard Déficit Foncier ceiling (10,700€) if devisValide is not true', () => {
        // DPE F -> C is eligible derogatory, but devis is not validated
        const result = simulateFinancing(
            300000, // costHT
            10, // nbLots
            "F" as any, // currentDPE
            "C" as any, // targetDPE
            0, 0, 0, 0, undefined, undefined, undefined, 0,
            false // devisValide
        );

        // Derogatory requires devisValide = true
        expect(result.plafondImputationDeductible).toBe(10700);
    });

    it('should apply the standard Déficit Foncier ceiling (10,700€) if DPE jump is not eligible', () => {
        // devisValide is true, but DPE is D -> B (not starting at F/G)
        const result = simulateFinancing(
            300000, // costHT
            10, // nbLots
            "D" as any, // currentDPE
            "B" as any, // targetDPE
            0, 0, 0, 0, undefined, undefined, undefined, 0,
            true // devisValide
        );

        // Derogatory requires starting at passoire F or G
        expect(result.plafondImputationDeductible).toBe(10700);
    });

    it('should apply the derogatory Déficit Foncier ceiling (21,400€) if eligible constraints are met', () => {
        // F -> C and devisValide = true
        const result = simulateFinancing(
            300000, // costHT
            10, // nbLots
            "F" as any, // currentDPE
            "C" as any, // targetDPE
            0, 0, 0, 0, undefined, undefined, undefined, 0,
            true // devisValide
        );

        expect(result.plafondImputationDeductible).toBe(21400);
    });

    it('should calculate AMO properly bounded to 50% and 300€/lot max', () => {
        // 10 lots. Max AMO subvention should be 10 * 300 = 3000
        const result = simulateFinancing(
            300000,
            10,
            "F" as any,
            "C" as any
        );

        // 50% of 6000 is 3000, which is equal to max (10 * 300)
        expect(result.amoAmount).toBe(3000);
    });

    it('should calculate AMO properly if we had a smaller lot size with high cost (cap triggers)', () => {
        const result = simulateFinancing(
            300000,
            2,
            "F" as any,
            "C" as any
        );

        // 2 lots * 600 = 1200HT. 50% = 600. Cap = 2 * 300 = 600.
        expect(result.amoAmount).toBe(600);
    });
});
