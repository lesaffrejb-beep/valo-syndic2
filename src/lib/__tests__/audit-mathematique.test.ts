/**
 * ============================================================================
 * AUDIT MATHÉMATIQUE - VALO-SYNDIC
 * ============================================================================
 * 
 * Objectif : Vérifier rigoureusement tous les calculs métier avec des cas
 * de test aléatoires et des vérifications manuelles indépendantes.
 * 
 * Approche : Calculs de référence faits "à la main" puis comparés au code.
 * 
 * Profil de l'auditeur: Mathématicien / Senior Dev
 * Date d'audit: 2026-01-30
 * ============================================================================
 */

import {
    simulateFinancing,
    calculateComplianceStatus,
    calculateInactionCost,
    calculateValuation,
    generateDiagnostic,
    formatCurrency,
} from "../calculator";

import {
    estimateEnergyGain,
    type DiagnosticInput,
} from "../schemas";

import {
    DPE_PROHIBITION_DATES,
    DPE_NUMERIC_VALUE,
    MPR_COPRO,
    ECO_PTZ_COPRO,
    AMO_PARAMS,
    PROJECT_FEES,
    TECHNICAL_PARAMS,
    VALUATION_PARAMS,
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
// UTILITAIRES D'ASSERTION PERSONNALISÉS
// ============================================================================

interface AuditResult {
    testCase: string;
    test: string;
    passed: boolean;
    expected: string | number | boolean;
    actual: string | number | boolean;
    severity: "CRITICAL" | "WARNING" | "INFO";
}

const auditResults: AuditResult[] = [];

function auditAssert(
    testCase: string,
    test: string,
    condition: boolean,
    expected: string | number | boolean,
    actual: string | number | boolean,
    severity: "CRITICAL" | "WARNING" | "INFO" = "CRITICAL"
): void {
    auditResults.push({
        testCase,
        test,
        passed: condition,
        expected,
        actual,
        severity,
    });
    expect(condition).toBe(true);
}

function auditApprox(
    testCase: string,
    test: string,
    actual: number,
    expected: number,
    tolerance: number = 0.01,
    severity: "CRITICAL" | "WARNING" | "INFO" = "CRITICAL"
): void {
    const diff = Math.abs(actual - expected);
    const passed = diff <= tolerance;
    auditResults.push({
        testCase,
        test,
        passed,
        expected: `${expected} (±${tolerance})`,
        actual,
        severity,
    });
    expect(diff).toBeLessThanOrEqual(tolerance);
}

// ============================================================================
// CAS DE TEST 1: PETITE COPROPRIÉTÉ F → C (SORTIE DE PASSOIRE)
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #1: Petite copropriété F → C", () => {
    const input: DiagnosticInput = {
        address: "12 Rue des Lilas, 49000 Angers",
        postalCode: "49000",
        city: "Angers",
        currentDPE: "F",
        targetDPE: "C",
        numberOfUnits: 8,
        commercialLots: 0,
        estimatedCostHT: 180_000,
        averagePricePerSqm: 3200,
        priceSource: "DVF",
        salesCount: 45,
        averageUnitSurface: 55,
        localAidAmount: 0,
        alurFund: 5000,
        ceeBonus: 0,
        currentEnergyBill: 3000,
        investorRatio: 30,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres de base", () => {
    });

    it("calcule correctement les frais de projet", () => {
        // Frais sur Travaux HT uniquement
        const syndicFees = input.estimatedCostHT * PROJECT_FEES.syndicRate; // 5,400€
        const doFees = input.estimatedCostHT * PROJECT_FEES.doRate; // 3,600€
        const contingencyFees = input.estimatedCostHT * PROJECT_FEES.contingencyRate; // 9,000€

        auditAssert("Cas#1", "Frais syndic (3%)",
            result.financing.syndicFees === Math.round(syndicFees),
            Math.round(syndicFees), result.financing.syndicFees);
        auditAssert("Cas#1", "Frais DO (2%)",
            result.financing.doFees === Math.round(doFees),
            Math.round(doFees), result.financing.doFees);
        auditAssert("Cas#1", "Frais aléas (5%)",
            result.financing.contingencyFees === Math.round(contingencyFees),
            Math.round(contingencyFees), result.financing.contingencyFees);
    });

    it("calcule correctement l'AMO", () => {
        // Le coût AMO réel est de 600€/lot (forfait moyen)
        // Le plafond est de 1000€/lot pour ≤20 lots, 600€ pour >20 lots
        // Avec 8 lots : coût = 4,800€, plafond = 8,000€ → éligible = 4,800€
        // Aide calculée = 4,800€ × 50% = 2,400€
        // MAIS : le plancher minimum de 3,000€ s'applique !
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits; // 4,800€
        const amoCeilingPerLot = input.numberOfUnits <= AMO_PARAMS.smallCoproThreshold
            ? AMO_PARAMS.ceilingPerLotSmall  // 1,000€
            : AMO_PARAMS.ceilingPerLotLarge; // 600€
        const amoCeiling = amoCeilingPerLot * input.numberOfUnits; // 8,000€
        const eligibleBaseAMO = Math.min(amoCostHT, amoCeiling); // 4,800€
        const amoAidCalculated = eligibleBaseAMO * AMO_PARAMS.aidRate; // 2,400€
        const amoAid = Math.max(amoAidCalculated, AMO_PARAMS.minTotal); // 3,000€ (plancher!)

        auditAssert("Cas#1", "Aide AMO avec plancher 3000€",
            result.financing.amoAmount === Math.round(amoAid),
            Math.round(amoAid), result.financing.amoAmount);
    });

    it("calcule correctement le gain énergétique F→C", () => {
        // F→C = 3 sauts = 55%
        const expectedGain = estimateEnergyGain("F", "C"); // = 0.55

        auditAssert("Cas#1", "Gain énergétique F→C = 55%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("applique correctement le taux MPR strict (sans bonus passoire)", () => {
        // Gain 55% > 50% → taux performance 45% (bonus passoire ignoré en mode strict)
        const expectedMprRate = 0.45;

        auditApprox("Cas#1", "Taux MPR strict (45%)",
            result.financing.mprRate, expectedMprRate, 0.001);
        auditAssert("Cas#1", "Bonus passoire non appliqué",
            result.financing.exitPassoireBonus === 0,
            0, result.financing.exitPassoireBonus);
    });

    it("calcule correctement le montant MPR avec plafond", () => {
        // Travaux + frais = 180k + 5.4k + 3.6k + 9k = 198k
        const subtotalWorksFeesHT = input.estimatedCostHT * (1 + 0.03 + 0.02 + 0.05);
        // AMO = 8 lots × 600€ = 4,800€
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits;
        const totalCostHT = subtotalWorksFeesHT + amoCostHT;
        const totalCostTTC = totalCostHT * 1.055;

        // Plafond MPR = 8 lots × 25k€ = 200k€
        const mprCeiling = input.numberOfUnits * MPR_COPRO.ceilingPerUnit;
        // MPR strict = min(TTC × 45%, plafond)
        const expectedMPR = Math.min(totalCostTTC * 0.45, mprCeiling);

        auditAssert("Cas#1", "Montant MPR calculé",
            result.financing.mprAmount === Math.round(expectedMPR),
            Math.round(expectedMPR), result.financing.mprAmount);
    });

    it("calcule correctement l'Éco-PTZ", () => {
        // Total HT = Travaux + Frais + AMO
        // Travaux 180k + Frais 18k = 198k
        const subtotalWorksFeesHT = input.estimatedCostHT * 1.10;
        // AMO = 8 lots × 600€ = 4,800€ (coût réel)
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits;
        const totalCostHT = subtotalWorksFeesHT + amoCostHT; // 202,800€
        // TTC = 202.8k × 1.055 = 213,954€
        const totalCostTTC = totalCostHT * 1.055;
        // MPR strict = min(TTC × 45%, plafond)
        const mprCeiling = input.numberOfUnits * MPR_COPRO.ceilingPerUnit;
        const mprAmount = Math.min(totalCostTTC * 0.45, mprCeiling);
        // CEE strict = min(TTC × 8%, 5k/lot)
        const ceeAmount = Math.min(totalCostTTC * 0.08, input.numberOfUnits * 5_000);
        // AMO aidée = plafond(4800 × 50%, 3000 plancher) = 3,000€
        const amoAmount = 3000;
        // Reste avant PTZ = TTC - (MPR + CEE + AMO + aide locale) - ALUR
        const remainingBeforePTZ =
            totalCostTTC - mprAmount - ceeAmount - amoAmount - input.localAidAmount - input.alurFund;
        // Plafond Éco-PTZ = 8 × 50k = 400k€
        const ecoPtzCeiling = input.numberOfUnits * ECO_PTZ_COPRO.ceilingPerUnit;
        // Éco-PTZ = min(remaining, plafond)
        const expectedEcoPTZ = Math.min(remainingBeforePTZ, ecoPtzCeiling);

        // Tolérance 5€ pour les arrondis intermédiaires
        auditApprox("Cas#1", "Montant Éco-PTZ",
            result.financing.ecoPtzAmount, expectedEcoPTZ, 5);
    });

    it("calcule correctement le reste à charge final", () => {
        // Reste = 97,654 - 97,654 = 0€ (tout couvert!)
        auditAssert("Cas#1", "Reste à charge final",
            result.financing.remainingCost === 0,
            0, result.financing.remainingCost);
    });

    it("calcule correctement la mensualité Éco-PTZ", () => {
        // Mensualité = Capital / 240 mois
        // Capital = ecoPtzAmount calculé précédemment (~97,054€ avec plancher AMO)
        const durationMonths = ECO_PTZ_COPRO.maxDurationYears * 12;
        const expectedMonthly = result.financing.ecoPtzAmount / durationMonths;

        auditApprox("Cas#1", "Mensualité Éco-PTZ",
            result.financing.monthlyPayment, expectedMonthly, 1);
    });

    it("calcule correctement la valorisation", () => {
        // Surface totale = 8 × 55 = 440m²
        const totalSurface = input.numberOfUnits * (input.averageUnitSurface || 65);
        const basePricePerSqm = input.averagePricePerSqm!;
        const currentValue = totalSurface * basePricePerSqm;
        // Gain 55% → bonus valeur verte 12%
        const greenValueGain = currentValue * 0.12;
        const projectedValue = currentValue + greenValueGain;

        auditApprox("Cas#1", "Valeur actuelle",
            result.valuation.currentValue, currentValue, 100);
        auditApprox("Cas#1", "Valeur projetée",
            result.valuation.projectedValue, projectedValue, 100);
        auditApprox("Cas#1", "Gain Valeur Verte",
            result.valuation.greenValueGain, greenValueGain, 100);
    });

    it("calcule correctement le ROI net", () => {
        // Gain Valeur Verte ≈ 211,200€ - Reste à charge 0€ = +211,200€
        const isPositiveROI = result.valuation.netROI > 0;
        auditAssert("Cas#1", "ROI net positif",
            isPositiveROI,
            "positif", result.valuation.netROI);
    });
});

// ============================================================================
// CAS DE TEST 2: GRANDE COPROPRIÉTÉ G → A AVEC LOTS COMMERCIAUX
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #2: Grande copropriété G → A", () => {
    const input: DiagnosticInput = {
        address: "45 Avenue du Grand Large, 44100 Nantes",
        postalCode: "44100",
        city: "Nantes",
        currentDPE: "G",
        targetDPE: "A",
        numberOfUnits: 45,
        commercialLots: 3,
        estimatedCostHT: 1_200_000,
        averagePricePerSqm: 3800,
        priceSource: "DVF",
        salesCount: 120,
        averageUnitSurface: 62,
        localAidAmount: 25_000,
        alurFund: 0,
        ceeBonus: 15_000,
        currentEnergyBill: 3000,
        investorRatio: 40,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("exclut correctement les lots commerciaux du calcul MPR", () => {
        // Lots résidentiels = 45 - 3 = 42
        const residentialLots = input.numberOfUnits - (input.commercialLots || 0);
        // Plafond MPR = 42 × 25k€ = 1,050,000€
        const mprCeiling = residentialLots * MPR_COPRO.ceilingPerUnit;

        // Travaux + frais = 1,200k × 1.10 = 1,320,000€
        const subtotalWorksFeesHT = input.estimatedCostHT * 1.10;
        // AMO = 45 lots × 600€ = 27,000€
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits;
        const totalCostHT = subtotalWorksFeesHT + amoCostHT;
        const totalCostTTC = totalCostHT * 1.055;
        // MPR strict = min(TTC × 45%, plafond)
        const expectedMPR = Math.min(totalCostTTC * 0.45, mprCeiling);

        auditAssert("Cas#2", "MPR avec exclusion lots commerciaux",
            result.financing.mprAmount === Math.round(expectedMPR),
            Math.round(expectedMPR), result.financing.mprAmount, "CRITICAL");
    });

    it("calcule correctement le gain énergétique G→A", () => {
        // G→A = 5 sauts = 55% (max)
        const expectedGain = estimateEnergyGain("G", "A");
        auditAssert("Cas#2", "Gain énergétique G→A = 55%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("applique le taux MPR maximum strict (performance)", () => {
        auditApprox("Cas#2", "Taux MPR max 45%",
            result.financing.mprRate, 0.45, 0.001);
    });

    it("intègre correctement les aides externes (CEE + locales)", () => {
        const residentialLots = input.numberOfUnits - (input.commercialLots || 0);
        const subtotalWorksFeesHT = input.estimatedCostHT * 1.10;
        const amoCostHT = AMO_PARAMS.costPerLot * input.numberOfUnits;
        const totalCostHT = subtotalWorksFeesHT + amoCostHT;
        const totalCostTTC = totalCostHT * 1.055;
        const expectedCee = Math.min(totalCostTTC * 0.08, residentialLots * 5_000);

        auditAssert("Cas#2", "Aides locales présentes",
            result.financing.localAidAmount === input.localAidAmount,
            input.localAidAmount, result.financing.localAidAmount);
        auditAssert("Cas#2", "Primes CEE calculées (strict)",
            result.financing.ceeAmount === Math.round(expectedCee),
            Math.round(expectedCee), result.financing.ceeAmount);
    });
});

// ============================================================================
// CAS DE TEST 3: PROJET NON ÉLIGIBLE MPR (gain < 35%)
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #3: Projet non éligible MPR", () => {
    const input: DiagnosticInput = {
        address: "8 Rue Moderne, 49100 Angers",
        postalCode: "49100",
        city: "Angers",
        currentDPE: "C",
        targetDPE: "B", // C→B = 1 classe = 15% gain < 35%
        numberOfUnits: 12,
        commercialLots: 0,
        estimatedCostHT: 80_000,
        averagePricePerSqm: 3400,
        averageUnitSurface: 58,
        localAidAmount: 5000,
        alurFund: 0,
        ceeBonus: 0,
        currentEnergyBill: 3000,
        investorRatio: 0,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("calcule correctement le faible gain énergétique", () => {
        // C→B = 1 saut = 15%
        const expectedGain = estimateEnergyGain("C", "B"); // = 0.15
        auditAssert("Cas#3", "Gain C→B = 15%",
            result.financing.energyGainPercent === expectedGain,
            expectedGain, result.financing.energyGainPercent);
    });

    it("déclare le projet non éligible MPR (gain < 35%)", () => {
        // Gain 15% < 35% minimum → MPR = 0
        const isEligible = result.financing.energyGainPercent >= MPR_COPRO.minEnergyGain;
        auditAssert("Cas#3", "Projet non éligible (15% < 35%)",
            !isEligible, false, isEligible);
    });

    it("attribue MPR = 0 pour projet non éligible", () => {
        auditAssert("Cas#3", "MPR = 0€ si non éligible",
            result.financing.mprAmount === 0,
            0, result.financing.mprAmount, "CRITICAL");
    });

    it("n'applique pas de bonus passoire (C n'est pas une passoire)", () => {
        auditAssert("Cas#3", "Pas de bonus passoire pour C",
            result.financing.exitPassoireBonus === 0,
            0, result.financing.exitPassoireBonus);
    });
});

// ============================================================================
// CAS DE TEST 4: TEST DE STRESS - PLAFONNEMENTS MAXIMUMS
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #4: Test de stress plafonnements", () => {
    const input: DiagnosticInput = {
        address: "1 Rue du Test, 75000 Paris",
        postalCode: "75000",
        city: "Paris",
        currentDPE: "G",
        targetDPE: "A",
        numberOfUnits: 100,
        commercialLots: 0,
        estimatedCostHT: 10_000_000, // 100k€/lot!
        averagePricePerSqm: 12000,
        averageUnitSurface: 85,
        localAidAmount: 500_000,
        alurFund: 200_000,
        ceeBonus: 100_000,
        currentEnergyBill: 3000,
        investorRatio: 0,
    };

    const result = generateDiagnostic(input);

    it("vérifie les paramètres", () => {
    });

    it("respecte le plafond MPR par lot (25k€)", () => {
        // MPR max = 100 lots × 25k€ = 2,500,000€
        const maxMPR = input.numberOfUnits * MPR_COPRO.ceilingPerUnit;
        auditAssert("Cas#4", "MPR respecte plafond",
            result.financing.mprAmount <= maxMPR + 1,
            `≤ ${maxMPR}`, result.financing.mprAmount, "CRITICAL");
    });

    it("respecte le plafond Éco-PTZ par lot (50k€)", () => {
        // Éco-PTZ max = 100 lots × 50k€ = 5,000,000€
        const maxEcoPTZ = input.numberOfUnits * ECO_PTZ_COPRO.ceilingPerUnit;
        auditAssert("Cas#4", "Éco-PTZ respecte plafond",
            result.financing.ecoPtzAmount <= maxEcoPTZ,
            `≤ ${maxEcoPTZ}`, result.financing.ecoPtzAmount, "CRITICAL");
    });

    it("garde le reste à charge toujours positif ou nul", () => {
        auditAssert("Cas#4", "Reste à charge global ≥ 0",
            result.financing.remainingCost >= 0,
            "≥ 0", result.financing.remainingCost, "CRITICAL");
        auditAssert("Cas#4", "Reste à charge par lot ≥ 0",
            result.financing.remainingCostPerUnit >= 0,
            "≥ 0", result.financing.remainingCostPerUnit, "CRITICAL");
    });

    it("maintient la cohérence des totaux HT", () => {
        // totalCostHT = worksCostHT + syndicFees + doFees + contingencyFees + AMO
        const amoTotal = input.numberOfUnits * AMO_PARAMS.costPerLot;
        const expectedTotalHT = result.financing.worksCostHT + result.financing.syndicFees
            + result.financing.doFees + result.financing.contingencyFees + amoTotal;

        auditApprox("Cas#4", "Cohérence total HT",
            result.financing.totalCostHT, expectedTotalHT, 10, "CRITICAL");
    });

    it("calcule un coût par lot TTC cohérent", () => {
        // costPerUnit est TTC donc > totalCostHT / nbLots
        const minCostPerUnit = result.financing.totalCostHT / input.numberOfUnits * 1.05;
        const maxCostPerUnit = result.financing.totalCostHT / input.numberOfUnits * 1.06;

        auditAssert("Cas#4", "Coût par lot TTC cohérent",
            result.financing.costPerUnit >= minCostPerUnit && result.financing.costPerUnit <= maxCostPerUnit,
            `${formatCurrency(minCostPerUnit)}-${formatCurrency(maxCostPerUnit)}`,
            formatCurrency(result.financing.costPerUnit), "WARNING");
    });
});

// ============================================================================
// CAS DE TEST 5: STATUT DE CONFORMITÉ DPE
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #5: Statut de conformité DPE", () => {
    const referenceDate = new Date("2026-01-27");

    it("vérifie que DPE G est déjà INTERDIT en 2026", () => {
        const compliance = calculateComplianceStatus("G", referenceDate);

        auditAssert("Cas#5", "DPE G isProhibited = true",
            compliance.isProhibited === true, true, compliance.isProhibited, "CRITICAL");
        auditAssert("Cas#5", "DPE G urgencyLevel = critical",
            compliance.urgencyLevel === "critical", "critical", compliance.urgencyLevel, "CRITICAL");
        auditAssert("Cas#5", "DPE G daysUntilProhibition = 0",
            compliance.daysUntilProhibition === 0, 0, compliance.daysUntilProhibition!, "CRITICAL");
        auditAssert("Cas#5", "DPE G label = INTERDIT",
            compliance.statusLabel === "INTERDIT", "INTERDIT", compliance.statusLabel, "CRITICAL");
    });

    it("vérifie que DPE F est urgent mais pas encore interdit", () => {
        const compliance = calculateComplianceStatus("F", referenceDate);

        auditAssert("Cas#5", "DPE F isProhibited = false (jan 2026)",
            compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
        auditAssert("Cas#5", "DPE F urgencyLevel = high",
            compliance.urgencyLevel === "high", "high", compliance.urgencyLevel, "CRITICAL");
        // F interdit en 2028, donc ~2 ans = ~730 jours
        auditAssert("Cas#5", "DPE F daysUntilProhibition ≈ 730",
            compliance.daysUntilProhibition! > 700 && compliance.daysUntilProhibition! < 800,
            "700-800", compliance.daysUntilProhibition!, "WARNING");
    });

    it("vérifie que DPE E est en alerte moyenne", () => {
        const compliance = calculateComplianceStatus("E", referenceDate);

        auditAssert("Cas#5", "DPE E isProhibited = false",
            compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
        // E interdit en 2034, donc > 2 ans → medium
        auditAssert("Cas#5", "DPE E urgencyLevel = medium",
            compliance.urgencyLevel === "medium", "medium", compliance.urgencyLevel, "WARNING");
    });

    it("vérifie que DPE D/C/B/A sont conformes", () => {
        ["D", "C", "B", "A"].forEach((dpe) => {
            const compliance = calculateComplianceStatus(dpe as DPELetter, referenceDate);
            auditAssert(`Cas#5`, `DPE ${dpe} isProhibited = false`,
                compliance.isProhibited === false, false, compliance.isProhibited, "CRITICAL");
            auditAssert(`Cas#5`, `DPE ${dpe} urgencyLevel = low`,
                compliance.urgencyLevel === "low", "low", compliance.urgencyLevel, "WARNING");
        });
    });
});

// ============================================================================
// CAS DE TEST 6: VÉRIFICATIONS DE BUGS POTENTIELS
// ============================================================================

describe("AUDIT MATHEMATIQUE - Cas #6: Détection de bugs potentiels", () => {
    it("vérifie que le calcul MPR n'excède pas 100%", () => {
        const result = simulateFinancing(100_000, 5, "G", "A");
        auditAssert("Bug#1", "MPR rate ≤ 100%",
            result.mprRate <= 1.0, "≤ 1.0", result.mprRate, "CRITICAL");
    });

    it("vérifie que le coût par lot TTC > coût par lot HT", () => {
        const result = simulateFinancing(300_000, 20, "F", "C");
        const costPerUnitHT = result.totalCostHT / 20;
        auditAssert("Bug#2", "CostPerUnit TTC > CostPerUnit HT",
            result.costPerUnit > costPerUnitHT,
            `> ${costPerUnitHT}`, result.costPerUnit, "CRITICAL");
    });

    it("vérifie que les années de construction correspondent aux DPE", () => {
        // Vérification des estimations DPE par année
        const { estimateDPEByYear } = require("../calculator");

        auditAssert("Bug#3a", "Avant 1948 = G", estimateDPEByYear(1900) === "G", "G", estimateDPEByYear(1900));
        auditAssert("Bug#3b", "1960 = F", estimateDPEByYear(1960) === "F", "F", estimateDPEByYear(1960));
        auditAssert("Bug#3c", "1985 = E", estimateDPEByYear(1985) === "E", "E", estimateDPEByYear(1985));
        auditAssert("Bug#3d", "2015 = B", estimateDPEByYear(2015) === "B", "B", estimateDPEByYear(2015));
        auditAssert("Bug#3e", "2022 = A", estimateDPEByYear(2022) === "A", "A", estimateDPEByYear(2022));
    });

    it("vérifie la cohérence du coût de l'inaction", () => {
        const result = calculateInactionCost(300_000, 20, "F", 3500, 65);

        // Le coût projeté doit être supérieur au coût actuel (inflation)
        auditAssert("Bug#4a", "Coût 2029 > Coût 2026",
            result.projectedCost3Years > result.currentCost,
            "> current", result.projectedCost3Years, "CRITICAL");

        // DPE F doit avoir une décote
        auditAssert("Bug#4b", "Décote pour DPE F",
            result.valueDepreciation > 0,
            "> 0", result.valueDepreciation, "WARNING");
    });

    it("vérifie que DPE C n'a pas de décote", () => {
        const result = calculateInactionCost(300_000, 20, "C", 3500, 65);
        auditAssert("Bug#5", "Pas de décote pour DPE C",
            result.valueDepreciation === 0,
            0, result.valueDepreciation, "WARNING");
    });
});

// ============================================================================
// RAPPORT FINAL
// ============================================================================

afterAll(() => {

    const critical = auditResults.filter(r => r.severity === "CRITICAL");
    const warnings = auditResults.filter(r => r.severity === "WARNING");

    const criticalPassed = critical.filter(r => r.passed).length;
    const criticalFailed = critical.filter(r => !r.passed).length;
    const warningPassed = warnings.filter(r => r.passed).length;
    const warningFailed = warnings.filter(r => !r.passed).length;


    if (criticalFailed > 0) {
        critical.filter(r => !r.passed).forEach(r => {
        });
    }

    if (warningFailed > 0) {
        warnings.filter(r => !r.passed).forEach(r => {
        });
    }

    if (criticalFailed === 0 && warningFailed === 0) {
    } else if (criticalFailed === 0) {
    } else {
    }
});
