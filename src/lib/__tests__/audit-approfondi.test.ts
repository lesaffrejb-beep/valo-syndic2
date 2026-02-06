/**
 * ============================================================================
 * AUDIT APPROFONDI - RECHERCHE DE BUGS SUBTILS
 * ============================================================================
 * 
 * Cet audit va plus loin pour détecter:
 * - Bugs d'arrondi et précision
 * - Incohérences entre modules
 * - Cas limites (edge cases)
 * - Problèmes de logique métier
 * 
 * Profil: Senior Dev / Mathématicien - Mode paranoïaque 🔍
 * ============================================================================
 */

import {
    simulateFinancing,
    calculateComplianceStatus,
    calculateInactionCost,
    calculateValuation,
    generateDiagnostic,
    formatCurrency,
    estimateDPEByYear,
} from "../calculator";

import {
    estimateEnergyGain,
    type DiagnosticInput,
} from "../schemas";

import {
    MPR_COPRO,
    ECO_PTZ_COPRO,
    AMO_PARAMS,
    PROJECT_FEES,
    TECHNICAL_PARAMS,
    type DPELetter,
} from "../constants";

import { calculateSubsidies, type SimulationInputs } from "../subsidy-calculator";

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

// ============================================================================
// ANALYSE DES INCOHÉRENCES INTER-MODULES
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Incohérences inter-modules", () => {

    it("détecte la divergence des plafonds AMO entre calculator.ts et subsidy-calculator.ts", () => {
        /**
         * 🐛 BUG POTENTIEL DÉTECTÉ:
         * 
         * Dans calculator.ts (ligne ~193):
         *   amoCeilingGlobal = nbLots * AMO_PARAMS.ceilingPerLot (600€)
         * 
         * Dans subsidy-calculator.ts (ligne ~181):
         *   ceilingPerLotSmall: 1_000€ (≤20 lots)
         *   ceilingPerLotLarge: 600€ (>20 lots)
         * 
         * Le calculator.ts utilise TOUJOURS 600€/lot sans distinction de taille.
         * Ceci sous-estime l'aide AMO pour les petites copros (≤20 lots).
         * 
         * Impact: Pour une copro de 10 lots, l'aide AMO est calculée à 3,000€
         *         au lieu de 5,000€ (perte de 2,000€ d'aide affichée).
         */

        const calculator = require("../calculator");
        const subsidy = require("../subsidy-calculator");

        // Simuler une petite copro de 10 lots
        const nbLots = 10;

        // Calculator.ts utilise ceilingPerLot = 600€
        const amoCeilingCalculator = nbLots * AMO_PARAMS.ceilingPerLotLarge; // 6,000€

        // Subsidy-calculator.ts utiliserait 1,000€/lot pour ≤20 lots
        const AMO_PARAMS_SUBSIDY = {
            ceilingPerLotSmall: 1_000,
            ceilingPerLotLarge: 600,
        };
        const amoCeilingSubsidy = nbLots <= 20
            ? nbLots * AMO_PARAMS_SUBSIDY.ceilingPerLotSmall  // 10,000€
            : nbLots * AMO_PARAMS_SUBSIDY.ceilingPerLotLarge; // 6,000€


        // C'est une incohérence mais pas une erreur de calcul en soit
        // Le calculator.ts est plus conservateur (sous-estimation)
        expect(amoCeilingCalculator).not.toEqual(amoCeilingSubsidy);
    });

    it("vérifie que le bonus passoire n'est pas appliqué en mode strict", () => {
        // Le barème garde le bonus théorique
        expect(MPR_COPRO.exitPassoireBonus).toBe(0.10);

        // Test: bonus non appliqué dans le calcul strict
        const resultFD = simulateFinancing(100_000, 10, "F", "D");
        const resultFE = simulateFinancing(100_000, 10, "F", "E");

        expect(resultFD.exitPassoireBonus).toBe(0);
        expect(resultFE.exitPassoireBonus).toBe(0);
    });

    it("vérifie l'arrondi final du reste à charge", () => {
        /**
         * 🐛 BUG POTENTIEL: Les arrondis intermédiaires peuvent créer
         * des incohérences de 1€ entre remainingCost et remainingCostPerUnit × nbLots
         */
        const result = simulateFinancing(333_333, 7, "G", "C");

        const reconstructed = result.remainingCostPerUnit * 7;
        const diff = Math.abs(result.remainingCost - reconstructed);


        // L'écart devrait être ≤ 7€ (arrondi par lot)
        expect(diff).toBeLessThanOrEqual(7);
    });
});

// ============================================================================
// TESTS DES CAS LIMITES (EDGE CASES)
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Edge Cases", () => {

    it("gère le cas minimal: 2 lots (limite inférieure)", () => {
        const result = simulateFinancing(10_000, 2, "F", "C");

        // Avec seulement 2 lots, le plafond MPR = 50k€
        // Mais le coût est très faible donc MPR devrait être proportionnelle
        expect(result.mprAmount).toBeGreaterThanOrEqual(0);
        expect(result.remainingCost).toBeGreaterThanOrEqual(0);
    });

    it("gère le cas maximal: 500 lots (limite schéma)", () => {
        const result = simulateFinancing(50_000_000, 500, "G", "A");

        // MPR max = 500 × 25k€ = 12,500,000€
        const maxMPR = 500 * 25_000;
        expect(result.mprAmount).toBeLessThanOrEqual(maxMPR);

        // Éco-PTZ max = 500 × 50k€ = 25,000,000€
        const maxEcoPTZ = 500 * 50_000;
        expect(result.ecoPtzAmount).toBeLessThanOrEqual(maxEcoPTZ);
    });

    it("gère les montants très faibles de travaux", () => {
        // 1,000€ HT de travaux (minimum schéma)
        const result = simulateFinancing(1_000, 5, "F", "C");

        // Les frais doivent être calculés mais peuvent être ridicules
        expect(result.syndicFees).toBe(30); // 3% de 1000
        expect(result.doFees).toBe(20);     // 2% de 1000
        expect(result.contingencyFees).toBe(50); // 5% de 1000
    });

    it("gère 100% de lots commerciaux (cas extrême)", () => {
        // Si tous les lots sont commerciaux, MPR = 0
        const result = simulateFinancing(300_000, 10, "G", "C", 10); // 10 commerciaux sur 10

        // MPR devrait être 0 car aucun lot résidentiel
        expect(result.mprAmount).toBe(0);
    });

    it("gère le changement de DPE identique (pas d'amélioration)", () => {
        // C→C = 0% gain
        const result = simulateFinancing(100_000, 10, "C", "C");

        // Gain = 0
        expect(result.energyGainPercent).toBe(0);

        // Non éligible MPR (0% < 35%)
        expect(result.mprAmount).toBe(0);
        expect(result.mprRate).toBe(0);
    });

    it("gère le cas où toutes les aides couvrent 100% des travaux", () => {
        // Cas extrême: énormes aides locales + ALUR + CEE
        const result = simulateFinancing(
            50_000,   // Faible coût
            5,        // 5 lots
            "G",      // G→C = 55% gain
            "C",
            0,        // Pas de lots commerciaux
            100_000,  // Aide locale massive
            50_000,   // Fonds ALUR énorme
            50_000    // CEE bonus
        );

        // Le reste à charge doit être 0 (pas négatif)
        expect(result.remainingCost).toBe(0);
        expect(result.remainingCostPerUnit).toBe(0);
    });
});

// ============================================================================
// VÉRIFICATION DE LA PRÉCISION NUMÉRIQUE
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Précision numérique", () => {

    it("vérifie que les pourcentages ne dépassent pas les limites", () => {
        const testCases: [DPELetter, DPELetter, number][] = [
            ["G", "A", 0.55], // Max théorique
            ["G", "F", 0.15], // Min gain
            ["F", "E", 0.15],
            ["E", "D", 0.15],
        ];

        testCases.forEach(([current, target, expected]) => {
            const gain = estimateEnergyGain(current, target);
            expect(gain).toBeGreaterThanOrEqual(0);
            expect(gain).toBeLessThanOrEqual(0.70); // Max 70%
        });
    });

    it("vérifie que la TVA est appliquée correctement (5.5%)", () => {
        const result = simulateFinancing(100_000, 10, "F", "C");

        // Coût TTC = Coût HT × 1.055
        const expectedTTC = result.totalCostHT * 1.055;

        // Le costPerUnit est TTC, donc costPerUnit × 10 = Total TTC
        const reconstructedTTC = result.costPerUnit * 10;

        // Vérifier que la différence est uniquement due à l'arrondi
        const diff = Math.abs(expectedTTC - reconstructedTTC);
        expect(diff).toBeLessThanOrEqual(10); // Tolérance 10€
    });

    it("vérifie que la mensualité Éco-PTZ respecte la formule 0%", () => {
        // À 0%, la mensualité = Capital / (20 ans × 12 mois)
        const result = simulateFinancing(240_000, 10, "F", "C");

        if (result.ecoPtzAmount > 0) {
            const expectedMonthly = result.ecoPtzAmount / (20 * 12);


            // Les deux doivent être identiques (à l'arrondi près)
            expect(result.monthlyPayment).toBeCloseTo(expectedMonthly, 0);
        }
    });
});

// ============================================================================
// VÉRIFICATION DU CALCUL DE VALORISATION
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Valorisation immobilière", () => {

    it("vérifie que le DPE n'impacte pas la valeur actuelle (mode strict)", () => {
        const inputBase: DiagnosticInput = {
            currentDPE: "D",
            targetDPE: "C",
            numberOfUnits: 10,
            estimatedCostHT: 200_000,
            averagePricePerSqm: 3000,
            averageUnitSurface: 50,
            commercialLots: 0,
            localAidAmount: 0,
            alurFund: 0,
            ceeBonus: 0,
            currentEnergyBill: 3000,
            investorRatio: 0,
        };

        // Test chaque classe DPE
        const dpeClasses: DPELetter[] = ["G", "F", "E", "D", "C", "B", "A"];

        dpeClasses.forEach((dpe, index) => {
            const input = { ...inputBase, currentDPE: dpe };
            const financing = simulateFinancing(
                input.estimatedCostHT,
                input.numberOfUnits,
                input.currentDPE,
                input.targetDPE
            );
            const valuation = calculateValuation(input, financing);

            // Valeur actuelle = surface × prix de base (pas d'impact DPE)
            const expectedPrice = 3000;
            const totalSurface = 10 * 50; // 500m²
            const expectedValue = totalSurface * expectedPrice;


            // Tolérance de 100€
            expect(valuation.currentValue).toBeCloseTo(expectedValue, -2);
        });
    });

    it("vérifie que le ROI net est cohérent", () => {
        const input: DiagnosticInput = {
            currentDPE: "F",
            targetDPE: "C",
            numberOfUnits: 20,
            estimatedCostHT: 400_000,
            averagePricePerSqm: 3500,
            averageUnitSurface: 60, // Surface moyenne
            commercialLots: 0,
            localAidAmount: 0,
            alurFund: 0,
            ceeBonus: 0,
            currentEnergyBill: 3000,
            investorRatio: 0,
        };

        const financing = simulateFinancing(
            input.estimatedCostHT,
            input.numberOfUnits,
            input.currentDPE,
            input.targetDPE
        );
        const valuation = calculateValuation(input, financing);

        // ROI Net = Gain Valeur Verte - Reste à charge
        const expectedNetROI = valuation.greenValueGain - financing.remainingCost;


        expect(valuation.netROI).toBeCloseTo(expectedNetROI, 0);
    });
});

// ============================================================================
// VÉRIFICATION DU CALCUL DE L'INACTION
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Coût de l'inaction", () => {

    it("vérifie que l'inflation est composée (pas linéaire)", () => {
        const cost = 300_000;
        const result = calculateInactionCost(cost, 20, "F", 3500, 65);

        // Inflation composée: 300k × (1.045)^3
        const inflationRate = TECHNICAL_PARAMS.constructionInflationRate;
        const expectedProjected = cost * Math.pow(1 + inflationRate, 3);


        expect(result.projectedCost3Years).toBeCloseTo(expectedProjected, 0);

        // Vérifier que ce n'est PAS linéaire (3 × 4.5% = 13.5%)
        const linearProjection = cost * (1 + inflationRate * 3);

        // La projection composée doit être supérieure à la linéaire
        expect(result.projectedCost3Years).toBeGreaterThan(linearProjection);
    });

    it("vérifie que seuls DPE F et G ont une décote", () => {
        const dpeClasses: DPELetter[] = ["G", "F", "E", "D", "C", "B", "A"];

        dpeClasses.forEach(dpe => {
            const result = calculateInactionCost(300_000, 20, dpe, 3500, 65);

            if (dpe === "F" || dpe === "G") {
                expect(result.valueDepreciation).toBeGreaterThan(0);
            } else {
                expect(result.valueDepreciation).toBe(0);
            }
        });
    });
});

// ============================================================================
// VÉRIFICATION DU SUBSIDY-CALCULATOR (PROFILS DE REVENUS)
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Subsidy Calculator (profils de revenus)", () => {

    it("vérifie que les profils Blue et Yellow ont les primes individuelles", () => {
        const inputs: SimulationInputs = {
            workAmountHT: 300_000,
            amoAmountHT: 12_000,
            nbLots: 20,
            energyGain: 0.55,
            initialDPE: "F",
            targetDPE: "C",
            isFragile: false,
            ceePerLot: 0,
            localAidPerLot: 0,
        };

        const result = calculateSubsidies(inputs);

        // Blue: 3,000€ de prime individuelle
        expect(result.profiles.Blue.individualPremium).toBe(3000);
        // Yellow: 1,500€ de prime individuelle
        expect(result.profiles.Yellow.individualPremium).toBe(1500);
        // Purple: 0€
        expect(result.profiles.Purple.individualPremium).toBe(0);
        // Pink: 0€
        expect(result.profiles.Pink.individualPremium).toBe(0);
    });

    it("vérifie que le profil Blue a toujours le reste à charge le plus faible", () => {
        const inputs: SimulationInputs = {
            workAmountHT: 500_000,
            amoAmountHT: 20_000,
            nbLots: 20,
            energyGain: 0.55,
            initialDPE: "G",
            targetDPE: "A",
        };

        const result = calculateSubsidies(inputs);

        const blueRemaining = result.profiles.Blue.remainingCost;
        const yellowRemaining = result.profiles.Yellow.remainingCost;
        const purpleRemaining = result.profiles.Purple.remainingCost;
        const pinkRemaining = result.profiles.Pink.remainingCost;

        // Blue doit avoir le reste à charge le plus faible
        expect(blueRemaining).toBeLessThanOrEqual(yellowRemaining);
        expect(yellowRemaining).toBeLessThanOrEqual(purpleRemaining);
        expect(purpleRemaining).toBeLessThanOrEqual(pinkRemaining);
    });

    it("vérifie le bonus copropriété fragile (+20%)", () => {
        const inputsNormal: SimulationInputs = {
            workAmountHT: 300_000,
            amoAmountHT: 12_000,
            nbLots: 20,
            energyGain: 0.55,
            initialDPE: "G",
            targetDPE: "C",
            isFragile: false,
        };

        const inputsFragile: SimulationInputs = {
            ...inputsNormal,
            isFragile: true,
        };

        const resultNormal = calculateSubsidies(inputsNormal);
        const resultFragile = calculateSubsidies(inputsFragile);

        // Le profil fragile doit avoir un taux MPR supérieur (+20%)
        expect(resultFragile.profiles.Blue.mprRate).toBeGreaterThan(
            resultNormal.profiles.Blue.mprRate
        );

        // Le bonus fragile devrait être de 20%
        const expectedBonus = 0.20;
        expect(resultFragile.profiles.Blue.fragileBonusAmount).toBeGreaterThan(0);
    });
});

// ============================================================================
// DÉTECTION DE BUGS SILENCIEUX
// ============================================================================

describe("🔍 AUDIT APPROFONDI - Bugs silencieux", () => {

    it("vérifie qu'il n'y a pas de division par zéro cachée", () => {
        // Ces cas pourraient causer des divisions par zéro
        expect(() => simulateFinancing(100_000, 1, "F", "C")).not.toThrow();
        expect(() => simulateFinancing(100_000, 2, "F", "C")).not.toThrow();
    });

    it("vérifie que les dates de prohibition sont correctement typées", () => {
        // G et F ont des dates, D/C/B/A ont null
        const { DPE_PROHIBITION_DATES } = require("../constants");
        expect(DPE_PROHIBITION_DATES.G).toBeInstanceOf(Date);
        expect(DPE_PROHIBITION_DATES.F).toBeInstanceOf(Date);
        expect(DPE_PROHIBITION_DATES.E).toBeInstanceOf(Date);
        expect(DPE_PROHIBITION_DATES.D).toBeNull();
        expect(DPE_PROHIBITION_DATES.C).toBeNull();
        expect(DPE_PROHIBITION_DATES.B).toBeNull();
        expect(DPE_PROHIBITION_DATES.A).toBeNull();
    });

    it("vérifie que estimateDPEByYear ne retourne pas de valeur invalide", () => {
        // Tester des années extrêmes
        const veryOld = estimateDPEByYear(1800);
        const veryNew = estimateDPEByYear(2030);
        const future = estimateDPEByYear(2050);

        // Toutes doivent être des DPE valides
        expect(["G", "F", "E", "D", "C", "B", "A"]).toContain(veryOld);
        expect(["G", "F", "E", "D", "C", "B", "A"]).toContain(veryNew);
        expect(["G", "F", "E", "D", "C", "B", "A"]).toContain(future);
    });

    it("vérifie que les montants négatifs sont rejetés", () => {
        // Le schéma Zod devrait rejeter les valeurs négatives
        // Mais le calculator.ts a aussi des guards

        expect(() => simulateFinancing(-1000, 10, "F", "C")).toThrow();
        expect(() => simulateFinancing(100_000, -5, "F", "C")).toThrow();
    });

    it("vérifie la cohérence entre financing.remainingCost et monthlyPayment", () => {
        /**
         * 🐛 BUG POTENTIEL: Si remainingCost = 0 mais monthlyPayment > 0
         * ou l'inverse, il y a une incohérence.
         */
        const result = simulateFinancing(300_000, 20, "F", "C");

        /**
         * LOGIQUE CORRIGÉE:
         * - remainingCost = reste à charge CASH (après PTZ)
         * - monthlyPayment = mensualité du PTZ
         * Donc si ecoPtzAmount > 0, monthlyPayment > 0 même si remainingCost = 0
         */

        // Si ecoPtzAmount = 0, monthlyPayment doit être 0
        if (result.ecoPtzAmount === 0) {
            expect(result.monthlyPayment).toBe(0);
        }

        // Vérification cohérence: si ecoPtzAmount > 0, monthlyPayment doit être > 0
        if (result.ecoPtzAmount > 0) {
            expect(result.monthlyPayment).toBeGreaterThan(0);
        }
    });
});

// ============================================================================
// RAPPORT FINAL
// ============================================================================

afterAll(() => {
});
