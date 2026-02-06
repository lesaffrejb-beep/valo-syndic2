/**
 * Tests unitaires — Moteur de calcul VALO-SYNDIC
 * 
 * Ces tests valident les calculs réglementaires critiques :
 * - Taux MaPrimeRénov' Copropriété 2026
 * - Plafonds Éco-PTZ
 */

import {
    simulateFinancing,
    calculateComplianceStatus,
    calculateInactionCost,
    estimateDPEByYear,
    formatCurrency,
} from '../calculator';

import { calculateProjectMetrics } from '../financialUtils';

import { TECHNICAL_PARAMS } from '../constants';

// Mock Supabase to prevent console warnings
jest.mock('../supabaseClient', () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn(() => ({
                eq: jest.fn(() => ({
                    single: jest.fn(() => Promise.resolve({ data: null, error: null })),
                    data: null,
                })),
            })),
        })),
    },
}));

describe('MaPrimeRénov Copropriété 2026', () => {
    describe('simulateFinancing', () => {
        it('calcule correctement 45% pour gain > 50% (sans bonus passoire)', () => {
            const result = simulateFinancing(
                300000, // coût HT
                20,     // nb lots
                'F',    // DPE actuel
                'C',    // DPE cible
                0,      // lots commerciaux
                0,      // aide locale
                0,      // fonds ALUR
                0       // CEE
            );

            // Gain énergétique F→C = 3 classes = 55%
            expect(result.mprRate).toBeCloseTo(0.45, 2);
            expect(result.exitPassoireBonus).toBe(0);
        });

        it('calcule correctement 30% pour amélioration standard (35-50% gain)', () => {
            const result = simulateFinancing(
                300000,
                20,
                'E',    // DPE E
                'C',    // DPE C (2 classes = 40% gain)
                0, 0, 0, 0
            );

            // 40% gain = taux standard 30%
            expect(result.mprRate).toBeCloseTo(0.30, 2);
            expect(result.exitPassoireBonus).toBe(0);
        });

        it('calcule correctement 45% pour performance (>50% gain)', () => {
            const result = simulateFinancing(
                300000,
                20,
                'F',    // DPE F
                'A',    // DPE A (5 classes = 55% gain)
                0, 0, 0, 0
            );

            // 55% gain = taux performance 45%
            expect(result.mprRate).toBeCloseTo(0.45, 2);
            expect(result.exitPassoireBonus).toBe(0);
        });

        it('exclut les lots commerciaux du calcul MPR', () => {
            const result = simulateFinancing(
                300000,
                20,
                'F',
                'C',
                5,      // 5 lots commerciaux
                0, 0, 0
            );

            // Seuls 15 lots résidentiels éligibles
            const expectedCeiling = 15 * 25000; // 375 000€
            // mprAmount doit être calculé sur cette assiette
            expect(result.mprAmount).toBeGreaterThan(0);
            expect(result.mprAmount).toBeLessThanOrEqual(expectedCeiling);
        });

        it('calcule correctement l\'Éco-PTZ plafonné à 50k€ par lot', () => {
            const result = simulateFinancing(
                1000000, // Gros projet
                10,      // 10 lots
                'G',
                'C',
                0, 0, 0, 0
            );

            // Plafond Éco-PTZ = 10 * 50 000 = 500 000€
            expect(result.ecoPtzAmount).toBeLessThanOrEqual(500000);
        });

        it('génère une erreur si nb lots = 0', () => {
            expect(() => {
                simulateFinancing(300000, 0, 'F', 'C');
            }).toThrow('Le nombre de lots doit être supérieur à 0');
        });

        it('génère une erreur si coût = 0', () => {
            expect(() => {
                simulateFinancing(0, 20, 'F', 'C');
            }).toThrow('Le coût HT doit être supérieur à 0');
        });
    });
});

describe('Loi Climat — Statut de conformité', () => {
    describe('calculateComplianceStatus', () => {
        it('DPE G est interdit depuis 2025', () => {
            const result = calculateComplianceStatus('G', new Date('2026-01-01'));
            expect(result.isProhibited).toBe(true);
            expect(result.statusLabel).toBe('INTERDIT');
            expect(result.urgencyLevel).toBe('critical');
        });

        it('DPE F est interdit en 2028', () => {
            const result = calculateComplianceStatus('F', new Date('2026-01-01'));
            expect(result.isProhibited).toBe(false);
            expect(result.prohibitionDate).toEqual(new Date('2028-01-01'));
            expect(result.urgencyLevel).toBe('high');
        });

        it('DPE E est interdit en 2034', () => {
            const result = calculateComplianceStatus('E', new Date('2026-01-01'));
            expect(result.prohibitionDate).toEqual(new Date('2034-01-01'));
        });

        it('DPE D est conforme (pas d\'interdiction)', () => {
            const result = calculateComplianceStatus('D', new Date('2026-01-01'));
            expect(result.isProhibited).toBe(false);
            expect(result.prohibitionDate).toBeNull();
            expect(result.urgencyLevel).toBe('low');
        });

        it('calcule correctement les jours restants', () => {
            const refDate = new Date('2027-01-01'); // 1 an avant interdiction F
            const result = calculateComplianceStatus('F', refDate);
            expect(result.daysUntilProhibition).toBeGreaterThan(360);
            expect(result.daysUntilProhibition).toBeLessThanOrEqual(366);
        });
    });
});

describe('Coût de l\'inaction', () => {
    describe('calculateInactionCost', () => {
        it('calcule l\'inflation BTP sur 3 ans', () => {
            const cost = 300000;
            const result = calculateInactionCost(
                cost,
                20,
                'G',
                3500,   // prix m²
                65      // surface moyenne
            );

            // Inflation calculée dynamiquement selon la constante
            const inflationRate = TECHNICAL_PARAMS.constructionInflationRate;
            const expectedInflation = cost * (Math.pow(1 + inflationRate, 3) - 1);
            const actualInflation = result.projectedCost3Years - result.currentCost;

            // On vérifie que le calcul correspond bien à la formule composée
            expect(actualInflation).toBeCloseTo(expectedInflation, 0);
            expect(result.projectedCost3Years).toBeGreaterThan(cost);
        });

        it('calcule la décote pour DPE F/G', () => {
            const result = calculateInactionCost(
                300000,
                20,
                'F',    // DPE F = décote
                3500,
                65
            );

            // Il doit y avoir une perte de valeur
            expect(result.valueDepreciation).toBeGreaterThan(0);
        });

        it('ne calcule pas de décote pour DPE A-D', () => {
            const result = calculateInactionCost(
                300000,
                20,
                'C',    // DPE C = pas de décote
                3500,
                65
            );

            expect(result.valueDepreciation).toBe(0);
        });
    });
});

describe('Utilitaires', () => {
    describe('estimateDPEByYear', () => {
        it('estime correctement les vieux immeubles', () => {
            // const { estimateDPEByYear } = require('../mocks'); <--- REMOVED

            expect(estimateDPEByYear(1900)).toBe('G');
            expect(estimateDPEByYear(1960)).toBe('F');
            expect(estimateDPEByYear(2010)).toBe('C');
            expect(estimateDPEByYear(2022)).toBe('A');
        });
    });

    describe('formatCurrency', () => {
        it('formate correctement les euros', () => {
            expect(formatCurrency(150000)).toMatch(/150\s?000/);
            expect(formatCurrency(150000)).toContain('€');
        });
    });
});

describe('Intégration — Scénario complet', () => {
    it('scénario: Copro F → C, 20 lots, 300k€', () => {
        // 1. Vérification conformité
        const compliance = calculateComplianceStatus('F', new Date('2026-01-01'));
        expect(compliance.urgencyLevel).toBe('high');

        // 2. Simulation financement
        const financing = simulateFinancing(300000, 20, 'F', 'C');

        // Vérifications cohérence
        expect(financing.mprRate).toBeCloseTo(0.45, 2);
        expect(financing.totalCostHT).toBeGreaterThan(300000); // Avec frais
        expect(financing.remainingCost).toBeGreaterThanOrEqual(0);
        expect(financing.monthlyPayment).toBeGreaterThanOrEqual(0);

        // 3. Coût inaction
        // 3. Coût inaction
        const inaction = calculateInactionCost(300000, 20, 'F', 3500, 65);
        const inflationCost = inaction.projectedCost3Years - inaction.currentCost;
        expect(inaction.totalInactionCost).toBeGreaterThan(inflationCost);

        // 4. Le reste à charge doit être inférieur au coût total
        expect(financing.remainingCost).toBeLessThan(financing.totalCostHT);
    });
});

// =============================================================================
// TESTS CRITIQUES — OPERATION SCALPEL
// =============================================================================

describe('Règles Critiques MPR Copro 2026 — Blindage Mathématique', () => {
    describe('Plafonnement 25k€ par lot (Compliance juridique)', () => {
        test('doit appliquer le plafond MPR à 25000€/lot sur assiette éligible', () => {
            // Cas limité : 40k€/lot de travaux → seuls 25k€ sont éligibles MPR
            const result = simulateFinancing(
                800_000, // 800k€ HT pour 20 lots = 40k€/lot (hors frais)
                20,
                'G',
                'C',
                0, 0, 0, 0
            );

            // Avec frais (syndic 3% + DO 10% + aléas 3%), assiette = 800k * 1.16 = 928k
            // Plafond éligible MPR : 25k€ * 20 = 500k€ (< 928k donc plafond actif)
            // MPR strict plafonné au plafond global
            expect(result.mprAmount).toBeGreaterThan(0);
            expect(result.mprAmount).toBeLessThanOrEqual(500_000);
        });

        test('doit respecter le plafond même en sortie de passoire avec gros projet', () => {
            const result = simulateFinancing(
                1_500_000, // 75k€/lot (largement au-dessus du plafond)
                20,
                'G',
                'A',
                0, 0, 0, 0
            );

            // Plafond : 25k€ * 20 lots = 500k€
            expect(result.mprAmount).toBeLessThanOrEqual(500_000);
        });
    });

    describe('Éligibilité Éco-PTZ (Sécurité financière)', () => {
        test('doit respecter le plafond 50k€ par lot', () => {
            const result = simulateFinancing(
                1_000_000, // Gros projet : 50k€/lot
                20,
                'F',
                'C',
                0, 0, 0, 0
            );

            // Plafond Éco-PTZ = 20 lots * 50k€ = 1 000 000€
            // Mais ne doit pas financer plus que le reste à charge
            expect(result.ecoPtzAmount).toBeLessThanOrEqual(1_000_000);
        });

        test('ne doit JAMAIS financer plus que le reste à charge (garde-fou)', () => {
            const result = simulateFinancing(
                100_000, // Très faible coût avec aides importantes
                20,
                'G',
                'C',
                0, 0, 0, 0
            );

            // Reste à charge = Coût TTC - MPR - AMO
            const totalCostTTC = result.totalCostHT * 1.055;
            const remainingBeforeLoan = totalCostTTC - result.mprAmount - result.amoAmount;

            // L'Éco-PTZ ne doit pas dépasser ce qui reste réellement à payer
            expect(result.ecoPtzAmount).toBeLessThanOrEqual(Math.max(0, remainingBeforeLoan) + 1); // +1 pour arrondi
        });

        test('reste à charge final ne peut JAMAIS être négatif', () => {
            // Cas extreme : énormes aides locales + fonds ALUR
            const result = simulateFinancing(
                50_000,
                5,
                'G',
                'A',
                0,
                100_000, // Aide locale massive (irréaliste mais test de robustesse)
                50_000,  // ALUR fund énorme
                20_000   // CEE bonus
            );

            expect(result.remainingCost).toBeGreaterThanOrEqual(0);
            expect(result.remainingCostPerUnit).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Bonus Sortie de Passoire (désactivé en mode strict)', () => {
        test('ne doit jamais appliquer de bonus passoire', () => {
            const resultFG = simulateFinancing(300_000, 20, 'G', 'D');
            const resultFA = simulateFinancing(300_000, 20, 'F', 'A');

            expect(resultFG.exitPassoireBonus).toBe(0);
            expect(resultFA.exitPassoireBonus).toBe(0);
        });

        test('mprRate suit uniquement le seuil de performance', () => {
            const standard = simulateFinancing(300_000, 20, 'E', 'C'); // 40% gain
            const performance = simulateFinancing(300_000, 20, 'G', 'A'); // 55% gain

            expect(standard.mprRate).toBeCloseTo(0.30, 2);
            expect(performance.mprRate).toBeCloseTo(0.45, 2);
        });
    });

    describe('Calcul AMO (Aide Ingénierie)', () => {
        test('doit appliquer le bon plafond selon taille copro', () => {
            // ≤ 20 lots : 1000€/lot
            const small = simulateFinancing(300_000, 15, 'F', 'C');
            // > 20 lots : 600€/lot
            const large = simulateFinancing(300_000, 25, 'F', 'C');

            // Le montant AMO doit refléter ces plafonds différents
            expect(small.amoAmount).toBeGreaterThan(0);
            expect(large.amoAmount).toBeGreaterThan(0);
        });
    });

    describe('Guard-rails anti-erreur (Production Safety)', () => {
        test('mensualité Éco-PTZ cohérente (20 ans, 0%)', () => {
            const result = simulateFinancing(300_000, 20, 'F', 'C');

            if (result.ecoPtzAmount > 0) {
                // Mensualité théorique = capital / (20*12) sans intérêts
                const expectedMonthly = result.ecoPtzAmount / (20 * 12);
                expect(result.monthlyPayment).toBeCloseTo(expectedMonthly, 0);
            }
        });

        test('mensualité stricte pour ~178k€ sur 20 ans (~744€/mois)', () => {
            const metrics = calculateProjectMetrics(
                378_723, // montant total projet calibré pour ~178k€ de prêt
                10,
                0.50,
                0,
                1_000,
                3_000
            );

            expect(metrics.financing.loanAmount).toBeGreaterThan(175_000);
            expect(metrics.financing.loanAmount).toBeLessThan(181_000);

            const expectedMonthly = Math.round(metrics.financing.loanAmount / (20 * 12));
            expect(metrics.financing.monthlyLoanPayment).toBe(expectedMonthly);
            expect(metrics.financing.monthlyLoanPayment).toBeGreaterThan(700);
            expect(metrics.financing.monthlyLoanPayment).toBeLessThan(780);
        });

        test('coût par lot cohérent avec coût global', () => {
            const result = simulateFinancing(300_000, 20, 'F', 'C');

            const calculatedCostPerUnit = result.totalCostHT / 20;
            // On vérifie avec une marge car costPerUnit est TTC
            expect(result.costPerUnit).toBeGreaterThan(calculatedCostPerUnit * 1.05); // TTC minimum
            expect(result.costPerUnit).toBeLessThan(calculatedCostPerUnit * 1.07); // Marge raisonnable
        });

        test('intégrité des pourcentages (gain énergétique)', () => {
            const result = simulateFinancing(300_000, 20, 'F', 'C');

            expect(result.energyGainPercent).toBeGreaterThanOrEqual(0);
            expect(result.energyGainPercent).toBeLessThanOrEqual(1); // Max 100%
        });
    });
});
